#!/usr/bin/env bash
#
# trace_snto_pes.sh
#
# For each point on a trajectory/scan (Gaussian fchk/fch + log):
#   1) Generate NTOs for state1..stateN (as separate .fch files)
#   2) Track "diabatic" states using SNTO (adjacent-point NTO overlap)
#   3) Output scan coordinate vs energy curves (.dat)
#
# Dependency: baneSNTO (from your moov_banesnto_sntofile.tgz; compile to bin/baneSNTO)
#
# -------------------------
# INPUT MODE
# -------------------------
# MODE 1: Using traj.list file
#   e.g. `-l traj.list`
#   list format:
#   One point per line; blank lines and lines starting with # are ignored:
#     coord    fchk_or_fch    log
#   Example:
#     0.90     pt001.fchk     pt001.log
#     0.95     pt002.fchk     pt002.log
#     1.00     pt003.fchk     pt003.log
#   
#   Also supports 2 columns:
#     coord    filename
#   The script will automatically locate filename.fchk / filename.fch and filename.log
#
# MODE 2: Using prefix
#   e.g. `--prefix frame_` means:
#   automatically find frame_001, frame_002, frame_003, etc.
#   Looks for frame_XXX.fchk (or .fch) and frame_XXX.log
#   Coordinate = frame index
#
# Outputs:
#   1) <out>.dat (default: diabatic.dat) : tracked diabatic energy curve
#   2) adiabatic_energies.dat            : raw adiabatic energies state1..N for reference
#   3) NTO files at workdir/ptXXXX/S#.fch
#   4) overlap.snto (except for the 1st point) kept under workdir/ptXXXX/
#
# Notes:
#   * It is recommended to add IOP(9/40=4) in Gaussian log to ensure full excitation
#     coefficients are printed; otherwise NTOs may be unstable.
#   * Default autorange threshold thr=0.2; adjust if needed.
#   * Energy is parsed from "Excited State  n: ...  X eV" and printed in eV.
#
set -euo pipefail

# -------------------------
# Default parameters
# -------------------------
LIST=""
PREFIX=""
START_IDX=1           # Starting index for prefix mode
END_IDX=0             # End index for prefix mode (0 = auto-detect)
NSTATES=5             # state1..stateN
ROOT0=1               # initial diabatic state (adiabatic index at point 1)
THR=0.2               # autorange threshold
TIE_EPS=0.05          # if (best-second)/best < TIE_EPS, re-check using previous-step reference (n-1) (default 5%)
BANESNTO="baneSNTO"   
THREADS=0             # 0 = do not pass --nt (let baneSNTO decide)
OTYPE=1               # 1=|<phi|psi>| (recommended); 2/3 see baneSNTO manual
RADPOT=30
SPHPOT=302
RADCUT=15.0
WORKDIR="SNTO_work"
OUTDAT="diabatic.dat"

usage() {
  cat <<EOF
diabatic.sh is a script for tracking diabatic state in scan trajectory.
Usage:
  MODE 1 (traj.list): $0 -l traj.list -N Nstates -r root0 [options]
  MODE 2 (prefix):    $0 --prefix frame_ -N Nstates -r root0 [options]

Common options:
  -l, --list FILE         Trajectory list file (MODE 1)
      --prefix PREFIX     File prefix for auto-detection (MODE 2, e.g., "frame_")
      --start N           Starting index for prefix mode (default: 1)
      --end N             Ending index for prefix mode (default: auto-detect)
  -N, --nstates N         Number of excited states to process (state1..stateN)
  -r, --root0  N          Initial diabatic state as adiabatic state index at point 1 (default: 1)
  -t, --thr    X          Autorange threshold (default: 0.2)
      --tie-eps X         If (best-second)/best < X, re-check using previous-step reference (n-1) (default: 0.05)
  -o, --out    FILE       Output dat filename (default: diabatic.dat)
  -b, --banesnto PATH     Path to baneSNTO executable (default: baneSNTO in PATH)

Optional:
  -T, --threads N         baneSNTO --nt N (OpenMP threads). Default 0 = not passed
      --otype K           baneSNTO --otype (default: 1)
      --radpot N          (default: 30)
      --sphpot N          (default: 302)
      --radcut R          (default: 15.0)
      --workdir DIR       (default: SNTO_work)

EOF
}

die() { echo "ERROR: $*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Command not found: $1 (check PATH or use -b to specify baneSNTO)"
}

# -------------------------
# NEW: only print baneSNTO invocations
# -------------------------
print_banesnto_cmd() {
  # Print command exactly as it will be executed (quoted safely)
  # Use stderr so it won't mix with normal output files.
  printf '>>> baneSNTO CMD:'
  printf ' %q' "$@"
  printf '\n' >&2
}

run_banesnto() {
  # $BANESNTO can be "baneSNTO" or "/path/to/baneSNTO"
  # We only print if argv[0] matches BANESNTO (basename match also allowed)
  local exe="$1"
  if [[ "$exe" == "$BANESNTO" ]] || [[ "$(basename -- "$exe")" == "$(basename -- "$BANESNTO")" ]]; then
    print_banesnto_cmd "$@"
  fi
  "$@"
}

# Parse excitation energies (eV) from Gaussian log: output N lines for state1..N
parse_exc_eV() {
  local log="$1" N="$2"
  awk -v N="$N" '
    BEGIN{
      for(i=1;i<=N;i++) e[i]="NaN";
    }
    /Excited State[[:space:]]+[0-9]+:/{
      if (match($0, /Excited State[[:space:]]+([0-9]+):/, m)) {
        st = m[1] + 0;
        if (st>=1 && st<=N) {
          if (match($0, /([0-9]+\.?[0-9]*)[[:space:]]*eV/, mm)) {
            e[st] = mm[1];
          }
        }
      }
    }
    END{
      for(i=1;i<=N;i++) print e[i];
    }
  ' "$log"
}

# Pick best state (max SNTO_avg) from overlap.snto
# Output: best_state best_avg best_hole best_part
pick_best_from_snto() {
  local sntofile="$1" N="$2"
  awk -v N="$N" '
    BEGIN{best=0; max=-1; bh="NaN"; bp="NaN";}
    /^END_STATES/ {exit}
    $1 ~ /^[0-9]+$/ {
      st=$1+0;
      if(st>=1 && st<=N){
        avg=$2+0;
        hole=$3+0; part=$4+0;
        if(avg>max){
          max=avg; best=st; bh=hole; bp=part;
        }
      }
    }
    END{
      if(best==0){print "0 NaN NaN NaN";}
      else{ printf("%d %.10f %.10f %.10f\n", best, max, bh, bp); }
    }
  ' "$sntofile"
}

# Get best + second best, and list all "near-best" candidates
# Output format:
#   best_state best_avg second_state second_avg | candidates...
# Candidates satisfy: avg >= best_avg*(1-TIE_EPS)
pick_best_second_and_candidates() {
  local sntofile="$1" N="$2" eps="$3"
  awk -v N="$N" -v eps="$eps" '
    BEGIN{
      best=0; bestv=-1;
      second=0; secondv=-1;
      for(i=1;i<=N;i++) val[i]=-1;
    }
    /^END_STATES/ {exit}
    $1 ~ /^[0-9]+$/ {
      st=$1+0;
      if(st>=1 && st<=N){
        v=$2+0;
        val[st]=v;
        if(v>bestv){
          second=best; secondv=bestv;
          best=st; bestv=v;
        } else if(v>secondv){
          second=st; secondv=v;
        }
      }
    }
    END{
      if(best==0){ print "0 NaN 0 NaN |"; exit }
      printf("%d %.10f %d %.10f |", best, bestv, second, secondv);
      thr = bestv*(1.0-eps);
      for(st=1; st<=N; st++){
        if(val[st] >= thr) printf(" %d", st);
      }
      printf("\n");
    }
  ' "$sntofile"
}

# Get (avg hole part) for a given state from overlap.snto
# If not found: -1 NaN NaN
get_snto_fields_for_state() {
  local sntofile="$1" st="$2"
  awk -v st="$st" '
    /^END_STATES/ {exit}
    $1==st {printf("%.10f %.10f %.10f\n", $2+0, $3+0, $4+0); found=1; exit}
    END{ if(!found) print "-1 NaN NaN" }
  ' "$sntofile"
}

# Get SNTO_avg for a given state; if not found: -1
get_snto_avg_for_state() {
  local sntofile="$1" st="$2"
  awk -v st="$st" '
    /^END_STATES/ {exit}
    $1==st {print $2+0; found=1; exit}
    END{ if(!found) print -1 }
  ' "$sntofile"
}

# Auto-detect files with given prefix
# Returns array of indices that have both .fchk/.fch and .log files
detect_prefix_files() {
  local prefix="$1" start="$2" end="$3"
  local -a indices=()
  
  # If end is 0 (auto), scan up to 9999
  local max_scan=9999
  if (( end > 0 )); then
    max_scan="$end"
  fi
  
  for i in $(seq "$start" "$max_scan"); do
    local idx_str
    idx_str=$(printf "%03d" "$i")
    local base="${prefix}${idx_str}"
    local has_fch=0
    local has_log=0
    
    # Check for fchk or fch
    if [[ -f "${base}.fchk" ]] || [[ -f "${base}.fch" ]]; then
      has_fch=1
    fi
    
    # Check for log
    if [[ -f "${base}.log" ]]; then
      has_log=1
    fi
    
    if [[ $has_fch -eq 1 ]] && [[ $has_log -eq 1 ]]; then
      indices+=("$i")
    elif (( end == 0 )) && [[ $has_fch -eq 0 ]] && [[ $has_log -eq 0 ]]; then
      # Auto-detect mode: if we don't find files, stop
      break
    fi
  done
  
  if (( ${#indices[@]} == 0 )); then
    die "No files found with prefix '${prefix}' in range ${start}-${max_scan}"
  fi
  
  printf '%s\n' "${indices[@]}"
}

# -------------------------
# Parse args
# -------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--list) LIST="$2"; shift 2;;
    --prefix) PREFIX="$2"; shift 2;;
    --start) START_IDX="$2"; shift 2;;
    --end) END_IDX="$2"; shift 2;;
    -N|--nstates) NSTATES="$2"; shift 2;;
    -r|--root0) ROOT0="$2"; shift 2;;
    -t|--thr) THR="$2"; shift 2;;
    --tie-eps) TIE_EPS="$2"; shift 2;;
    -o|--out) OUTDAT="$2"; shift 2;;
    -b|--banesnto) BANESNTO="$2"; shift 2;;
    -T|--threads) THREADS="$2"; shift 2;;
    --otype) OTYPE="$2"; shift 2;;
    --radpot) RADPOT="$2"; shift 2;;
    --sphpot) SPHPOT="$2"; shift 2;;
    --radcut) RADCUT="$2"; shift 2;;
    --workdir) WORKDIR="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) die "Unknown argument: $1 (use -h for help)";;
  esac
done

# Check mode
if [[ -n "$LIST" ]] && [[ -n "$PREFIX" ]]; then
  die "Cannot use both --list and --prefix modes simultaneously"
fi

if [[ -z "$LIST" ]] && [[ -z "$PREFIX" ]]; then
  die "Must specify either --list or --prefix (use -h for help)"
fi

# baneSNTO must be runnable
if [[ "$BANESNTO" == */* ]]; then
  [[ -x "$BANESNTO" ]] || die "baneSNTO is not executable: $BANESNTO"
else
  need_cmd "$BANESNTO"
fi

need_cmd awk

# Basic checks
[[ "$NSTATES" =~ ^[0-9]+$ ]] || die "NSTATES must be an integer"
(( NSTATES >= 1 )) || die "NSTATES must be >= 1"
[[ "$ROOT0" =~ ^[0-9]+$ ]] || die "ROOT0 must be an integer"
(( ROOT0 >= 1 && ROOT0 <= NSTATES )) || die "ROOT0 must be within 1..NSTATES"

mkdir -p "$WORKDIR"

# Output headers
{
  echo "# coord   Energy(eV)   adiab_state   SNTO_avg   SNTO_hole   SNTO_part"
} > "$OUTDAT"

ADIAB_DAT="adiabatic_energies.dat"
{
  printf "# coord"
  for s in $(seq 1 "$NSTATES"); do printf "  E_S%d(eV)" "$s"; done
  echo
} > "$ADIAB_DAT"

# Build trajectory array based on mode
declare -a TRAJ_LINES

if [[ -n "$LIST" ]]; then
  # MODE 1: Read from traj.list
  [[ -f "$LIST" ]] || die "List file not found: $LIST"
  mapfile -t TRAJ_LINES < <(awk '
    /^[[:space:]]*$/ {next}
    /^[[:space:]]*#/ {next}
    {print}
  ' "$LIST")
else
  # MODE 2: Auto-detect from prefix
  echo "Using prefix mode: ${PREFIX}"
  echo "Detecting files..."
  
  mapfile -t FILE_INDICES < <(detect_prefix_files "$PREFIX" "$START_IDX" "$END_IDX")
  
  echo "Found ${#FILE_INDICES[@]} files:"
  for i in "${FILE_INDICES[@]}"; do
    idx_str=$(printf "%03d" "$i")
    base="${PREFIX}${idx_str}"
    if [[ -f "${base}.fchk" ]]; then
      fch_file="${base}.fchk"
    else
      fch_file="${base}.fch"
    fi
    log_file="${base}.log"
    echo "  [$i] ${fch_file} ${log_file}"
    
    # Build traj line: coord fchk log
    TRAJ_LINES+=("$i $fch_file $log_file")
  done
  echo ""
fi

(( ${#TRAJ_LINES[@]} > 0 )) || die "No trajectory points to process"

prev_nto=""
prevprev_nto=""
prev_state="$ROOT0"

for idx in "${!TRAJ_LINES[@]}"; do
  line="${TRAJ_LINES[$idx]}"

  coord="$(echo "$line" | awk '{print $1}')"
  col2="$(echo "$line" | awk '{print $2}')"
  col3="$(echo "$line" | awk '{print $3}')"

  if [[ -z "${col2:-}" ]]; then
    die "Line $((idx+1)) has too few columns; expected (coord filename) or (coord fch/fchk log). Line: $line"
  fi

  if [[ -n "${col3:-}" ]]; then
    fch="$col2"
    log="$col3"
  else
    filename="$col2"
    if [[ -f "${filename}.fchk" ]]; then
      fch="${filename}.fchk"
    elif [[ -f "${filename}.fch" ]]; then
      fch="${filename}.fch"
    else
      die "Cannot find ${filename}.fchk or ${filename}.fch (from point $((idx+1)))"
    fi
    log="${filename}.log"
  fi

  [[ -f "$fch" ]] || die "Missing fch/fchk file: $fch (point $((idx+1)))"
  [[ -f "$log" ]] || die "Missing log file: $log (point $((idx+1)))"

  pt_dir="${WORKDIR}/pt$(printf '%04d' $((idx+1)))"
  # Index convention (match main program):
  #   point index = n   corresponds to geometry/frame n  (1-based in workdir naming)
  #   step  index = n   corresponds to transition point n -> n+1 (so step=1 when processing point 2)
  pt=$((idx+1))
  step=$idx
  prev_pt=$idx
  prev_step=$((idx-1))
  mkdir -p "$pt_dir"

  # Parse energies
  mapfile -t Elist < <(parse_exc_eV "$log" "$NSTATES")

  # Write adiabatic energies (reference)
  {
    printf "%s" "$coord"
    for s in $(seq 1 "$NSTATES"); do
      e="${Elist[$((s-1))]}"
      printf "  %s" "$e"
    done
    echo
  } >> "$ADIAB_DAT"

  # Build baneSNTO command: new NTOs for all states
  cmd=( "$BANESNTO" --newnto "$fch" "$log" )
  for s in $(seq 1 "$NSTATES"); do
    cmd+=( --state "$s" --outfch "${pt_dir}/S${s}.fch" )
  done

  cmd+=( --otype "$OTYPE" --radpot "$RADPOT" --sphpot "$SPHPOT" --radcut "$RADCUT" )
  if (( THREADS > 0 )); then
    cmd+=( --nt "$THREADS" )
  fi

  if (( idx == 0 )); then
    echo "[pt ${pt}] Generating NTOs (no overlap at the first point) ..."
    run_banesnto "${cmd[@]}" > "${pt_dir}/baneSNTO.out" 2>&1

    chosen_state="$ROOT0"
    snto_avg="NaN"; snto_h="NaN"; snto_p="NaN"
    prev_nto="${pt_dir}/S${chosen_state}.fch"
    prevprev_nto=""
  else
    [[ -f "$prev_nto" ]] || die "Previous-point NTO file is missing: $prev_nto"

    echo "[pt ${pt} | step ${step}] Generating NTOs + SNTO overlap for step ${step} (pt ${prev_pt} -> pt ${pt}; oldfch=${prev_nto}) ..."
    cmd2=( "${cmd[@]}" --oldfch "$prev_nto" --autorange "$THR" --sntofile "${pt_dir}/overlap.snto" )
    run_banesnto "${cmd2[@]}" > "${pt_dir}/baneSNTO.out" 2>&1

    # best/second + candidates
    read -r best_state best_avg second_state second_avg bar candidates_str < <(
      pick_best_second_and_candidates "${pt_dir}/overlap.snto" "$NSTATES" "$TIE_EPS"
    )
    chosen_state="$best_state"

    diff="$(awk -v b="$best_avg" -v s="$second_avg" 'BEGIN{ if(b>0) print (b-s)/b; else print 1 }')"
    trig="$(awk -v d="$diff" -v e="$TIE_EPS" 'BEGIN{ print (d<e)?1:0 }')"

    if [[ "$second_state" -ge 1 ]] && [[ "$trig" -eq 1 ]]; then
      if [[ -n "${prevprev_nto:-}" ]] && [[ -f "$prevprev_nto" ]]; then
        echo "  [tie] Best/second are too close (diff=${diff} < ${TIE_EPS}); re-checking using previous step (step ${prev_step}, i.e., reference pt ${prev_step}) (oldfch=${prevprev_nto}) ..."

        # Re-check overlap against the n-2 reference WITHOUT rebuilding NTOs.
        # We already generated ${pt_dir}/S*.fch above in cmd2; now reuse them via baneSNTO --newfch.
        cmd3=( "$BANESNTO" --oldfch "$prevprev_nto" --autorange "$THR" --sntofile "${pt_dir}/overlap.nminus.snto" )
        for st in $candidates_str; do
          [[ -f "${pt_dir}/S${st}.fch" ]] || die "Missing NTO file for candidate state ${st}: ${pt_dir}/S${st}.fch"
          cmd3+=( --newfch "${pt_dir}/S${st}.fch" "$st" )
        done
        cmd3+=( --otype "$OTYPE" --radpot "$RADPOT" --sphpot "$SPHPOT" --radcut "$RADCUT" )
        if (( THREADS > 0 )); then cmd3+=( --nt "$THREADS" ); fi
        run_banesnto "${cmd3[@]}" >> "${pt_dir}/baneSNTO.out" 2>&1

        best_alt="-1"
        best_st="$chosen_state"
        for st in $candidates_str; do
          v="$(get_snto_avg_for_state "${pt_dir}/overlap.nminus.snto" "$st")"
          cmp="$(awk -v v="$v" -v best="$best_alt" 'BEGIN{ print (v>best)?1:0 }')"
          if [[ "$cmp" -eq 1 ]]; then
            best_alt="$v"
            best_st="$st"
          fi
        done
        chosen_state="$best_st"
      else
        echo "[WARNING] Near-degenerate SNTO overlap detected (diff=${diff} < ${TIE_EPS}), but the n-2 reference is unavailable." >&2
        echo "          This often happens when the starting point is too close to a state-crossing region, in which case" >&2
        echo "          diabatic tracking may be unreliable. Restarting state tracking from a structure farther away from the" >&2
        echo "          crossing point might be a good decision." >&2
      fi
    fi

    (( chosen_state >= 1 )) || die "Failed to parse the best state from ${pt_dir}/overlap.snto"

    read -r snto_avg snto_h snto_p < <(get_snto_fields_for_state "${pt_dir}/overlap.snto" "$chosen_state")
    if [[ "$snto_avg" == "-1" ]]; then
      snto_avg="NaN"; snto_h="NaN"; snto_p="NaN"
    fi

    prev_state="$chosen_state"
    prevprev_nto="$prev_nto"
    prev_nto="${pt_dir}/S${chosen_state}.fch"
  fi

  energy="${Elist[$((chosen_state-1))]}"

  printf "%s  %s  %d  %s  %s  %s\n" \
    "$coord" "$energy" "$chosen_state" "$snto_avg" "$snto_h" "$snto_p" >> "$OUTDAT"
done

echo "Done."
echo "  Diabatic trace dat : $OUTDAT"
echo "  Adiabatic energies : $ADIAB_DAT"
echo "  NTO/SNTO workdir   : $WORKDIR"

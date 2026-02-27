#!/bin/bash

# 创建关联数组存储提取的数据
declare -A rates_data
declare -A huang_data
declare -A reorg_data

# 提取速率常数的函数
extract_rates() {
    local dir=$1
    local type=$2
    
    if [ "$type" = "IC" ]; then
        rate=$(grep "IC rate constant" "$dir"/*.out 2>/dev/null | awk '{print $5}')
        if [ ! -z "$rate" ]; then
            coord=$(echo "$dir" | grep -o "CART\|INT")
            rates_data["${coord}_ic"]=$rate
        fi
    elif [ "$type" = "EMI" ]; then
        rate=$(grep "kr(s-1)" "$dir"/*.out 2>/dev/null | awk '{print $3}')
        if [ ! -z "$rate" ]; then
            coord=$(echo "$dir" | grep -o "CART\|INT")
            rates_data["${coord}_emi"]=$rate
        fi
    elif [ "$type" = "ISC" ]; then
        rate=$(grep "Non-radiative rate constant" "$dir"/*.out 2>/dev/null | awk '{print $5}')
        if [ ! -z "$rate" ]; then
            coord=$(echo "$dir" | grep -o "CART\|INT")
            rates_data["${coord}_isc"]=$rate
        fi
    fi
}

# 提取Huang-Rhys因子的函数
extract_huang_rhys() {
    local dir=$1
    local coord=$(echo "$dir" | grep -o "CART\|INT")
    local huang_file="$dir/HuangRhys.dat"
    
    if [ -f "$huang_file" ]; then
        local result=$(awk '
        BEGIN { max_huang = 0; max_mode = 0 }
        !/^[[:space:]]*#/ && NF >= 2 && $1 ~ /^[0-9]+$/ && $2 ~ /^[0-9.-]+([eE][+-]?[0-9]+)?$/ {
            mode = $1; huang = $2 + 0
            if (huang > max_huang) { max_huang = huang; max_mode = mode }
        }
        END { if (max_huang > 0) print max_mode " " max_huang }
        ' "$huang_file")
        
        if [ ! -z "$result" ]; then
            huang_data["${coord}_huang"]=$(echo "$result" | awk '{print $2}')
            huang_data["${coord}_mode"]=$(echo "$result" | awk '{print $1}')
        fi
    fi
}

# 绘制Duschinsky矩阵热图
plot_duschinsky() {
    local dir=$1
    local dusch_file="$dir/duschinsky.dat"
    
    [ ! -f "$dusch_file" ] && return
    
    local coord=$(echo "$dir" | grep -o "CART\|INT")
    local type=$(echo "$dir" | grep -oE "^[A-Z0-9]+" | head -1)
    local prefix="${type}-${coord}"
    
    # 计算矩阵维度
    local n_elements=$(grep -v '^[[:space:]]*$' "$dusch_file" | wc -l)
    local n_dim=$(awk -v n="$n_elements" 'BEGIN {print int(sqrt(n))}')
    local n_check=$((n_dim * n_dim))
    
    if [ "$n_check" -ne "$n_elements" ]; then
        echo "Warning: $dusch_file has $n_elements elements (not a perfect square)"
        return
    fi
    
    echo "Plotting Duschinsky matrix: $prefix (${n_dim}x${n_dim})"
    
    local matrix_file="${prefix}_dusch_matrix.dat"
    local output_png="${prefix}_duschinsky.png"
    
    # 转换为矩阵格式（Fortran列优先 -> 行优先，取绝对值）
    awk -v n="$n_dim" '
    BEGIN { idx = 0 }
    /^[[:space:]]*$/ { next }
    { data[idx++] = ($1 < 0) ? -$1 : $1 }
    END {
        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                printf "%.6e", data[j*n + i]
                if (j < n-1) printf "\t"
            }
            printf "\n"
        }
    }
    ' "$dusch_file" > "$matrix_file"
    
    # 生成gnuplot脚本并绘图
    gnuplot << EOF 2>/dev/null
set terminal png size 800,750 enhanced font 'Arial,11'
set output '$output_png'
set title 'Duschinsky Matrix |J| ($prefix)' font 'Arial,14'
set xlabel 'Mode Index'; set ylabel 'Mode Index'
set pm3d map; set pm3d interpolate 0,0
set palette defined (0 '#FFFFFF', 0.2 '#FFFF99', 0.4 '#FFCC00', 0.6 '#FF6600', 0.8 '#CC0000', 1.0 '#660000')
set colorbox; set cblabel '|J|'
set cbrange [0:*]
set xrange [0:$((n_dim-1))]; set yrange [0:$((n_dim-1))]
set size ratio 1; unset key
splot '$matrix_file' matrix with image
EOF
    
    [ -f "$output_png" ] && echo "  -> $output_png"
    rm -f "$matrix_file"
}

# 转换科学计数法为普通数值
convert_to_number() {
    local value=$1
    [[ "$value" == "N/A     " ]] && echo "0" || echo "$value" | awk '{printf "%.0f", $1}'
}

# 计算寿命（单位：ns）
calculate_lifetime() {
    local kr=$(convert_to_number "$1")
    local kic=$(convert_to_number "$2")
    local kisc=$(convert_to_number "$3")
    
    awk -v kr="$kr" -v kic="$kic" -v kisc="$kisc" 'BEGIN {
        total = kr + kic + kisc
        if (total == 0) print "N/A     "
        else printf "%.3f", 1e9 / total
    }'
}

# 计算量子产率
calculate_quantum_yield() {
    local kr=$(convert_to_number "$1")
    local kic=$(convert_to_number "$2")
    local kisc=$(convert_to_number "$3")
    
    awk -v kr="$kr" -v kic="$kic" -v kisc="$kisc" 'BEGIN {
        total = kr + kic + kisc
        if (total == 0 || kr == 0) print "N/A     "
        else { phi = kr / total; printf "%.4f", phi }
    }'
}

# 格式化为科学计数法
format_scientific() {
    local value=$1
    [[ "$value" == "N/A     " || "$value" == "ERROR:"* ]] && echo "$value" || echo "$value" | awk '{printf "%.2e", $1}'
}

# 绘制Huang-Rhys因子频率分布图
plot_huang_rhys_frequency() {
    local coord=$1
    local huang_file="EMI-${coord}/HuangRhys.dat"
    
    [ ! -f "$huang_file" ] && return
    
    local opt_log=$(find . -maxdepth 1 -name "opt*.log" | head -1)
    [ -z "$opt_log" ] && return
    
    command -v banedata &> /dev/null || return
    
    local freq_file="frequencies_${coord}.dat"
    banedata "$opt_log" -f all > "$freq_file" 2>/dev/null
    [ ! -s "$freq_file" ] && return
    
    local plot_data="huang_rhys_freq_${coord}.dat"
    echo "# Mode Frequency(cm-1) Huang-Rhys-Factor" > "$plot_data"
    
    while read -r mode huang_value; do
        [[ "$mode" =~ ^[[:space:]]*# ]] || [[ -z "$mode" ]] && continue
        local freq=$(awk -v m="$mode" '$1 == m {print $2; exit}' "$freq_file")
        if [ ! -z "$freq" ] && (( $(echo "$freq <= 1000" | bc -l) )); then
            echo "$mode $freq $huang_value" >> "$plot_data"
        fi
    done < <(awk '!/^[[:space:]]*#/ && NF >= 2 {print $1, $2}' "$huang_file")
    
    command -v gnuplot &> /dev/null || { rm -f "$freq_file"; return; }
    
    local plot_output="huang_rhys_freq_${coord}.png"
    gnuplot << EOF 2>/dev/null
set terminal png size 1200,800 font "Arial,12"
set output "$plot_output"
set title "Huang-Rhys Factors vs Frequencies ($coord)"
set xlabel "Frequency (cm^{-1})"; set ylabel "Huang-Rhys Factor"
set grid; set xrange [0:1000]
plot "$plot_data" using 2:3 with impulses lw 2 lc rgb "steelblue" notitle
EOF
    
    [ -f "$plot_output" ] && echo "Huang-Rhys plot: $plot_output"
    rm -f "$freq_file"
}

# 计算低频重组能比例
calculate_low_frequency_contribution() {
    local coord=$1
    local huang_file="EMI-${coord}/HuangRhys.dat"
    
    [ ! -f "$huang_file" ] && return
    
    local opt_log=$(find . -maxdepth 1 -name "opt*.log" | head -1)
    [ -z "$opt_log" ] && return
    command -v banedata &> /dev/null || return
    
    local freq_file="frequencies_temp.dat"
    banedata "$opt_log" -f all > "$freq_file" 2>/dev/null
    [ ! -s "$freq_file" ] && { rm -f "$freq_file"; return; }
    
    local result=$(awk -v freq_file="$freq_file" '
    BEGIN {
        while ((getline line < freq_file) > 0) {
            split(line, a); freqs[a[1]] = a[2]
        }
        total = 0; low = 0
    }
    !/^[[:space:]]*#/ && NF >= 2 {
        mode = $1; huang = $2 + 0
        if (mode in freqs) {
            freq = freqs[mode] + 0
            lambda = huang * freq
            total += lambda
            if (freq < 200) low += lambda
        }
    }
    END {
        if (total > 0) printf "%.2f %.2f %.2f", low, total, low/total*100
    }
    ' "$huang_file")
    
    if [ ! -z "$result" ]; then
        reorg_data["${coord}_low"]=$(echo $result | awk '{print $1}')
        reorg_data["${coord}_total"]=$(echo $result | awk '{print $2}')
        reorg_data["${coord}_pct"]=$(echo $result | awk '{print $3}')
    fi
    
    rm -f "$freq_file"
}

# 主函数
main() {
    local output_file="rate_constants.txt"
    > "$output_file"
    
    echo "Extracting rate constants and Huang-Rhys factors..."
    
    # 提取各类数据
    for dir in IC-*/ */IC_*/ *IC-*/; do [ -d "$dir" ] && extract_rates "$dir" "IC"; done
    for dir in EMI-*/ */EMI_*/ *EMI-*/; do
        [ -d "$dir" ] && { extract_rates "$dir" "EMI"; extract_huang_rhys "$dir"; }
    done
    for dir in NR0-*/ */NR0_*/ *NR0-*/; do [ -d "$dir" ] && extract_rates "$dir" "ISC"; done
    
    # 计算低频重组能（需要先计算才能输出到表格）
    for coord in "CART" "INT"; do
        [[ ${huang_data[${coord}_huang]} ]] && calculate_low_frequency_contribution "$coord"
    done
    
    # 输出结果表
    echo -e "Coords\tkr(s⁻¹) \tkIC(s⁻¹)\tkISC(s⁻¹)\tτ(ns)\tφ\tHuang\tmode\tλ_low\tλ_total\t%low" | tee "$output_file"
    
    for coord in "CART" "INT"; do
        local kr=${rates_data[${coord}_emi]:-N/A     }
        local kic=${rates_data[${coord}_ic]:-N/A     }
        local kisc=${rates_data[${coord}_isc]:-N/A     }
        local huang=${huang_data[${coord}_huang]:-N/A     }
        local mode=${huang_data[${coord}_mode]:-N/A     }
        local lambda_low=${reorg_data[${coord}_low]:-N/A     }
        local lambda_total=${reorg_data[${coord}_total]:-N/A     }
        local pct_low=${reorg_data[${coord}_pct]:-N/A     }
        
        local lifetime=$(calculate_lifetime "$kr" "$kic" "$kisc")
        local phi=$(calculate_quantum_yield "$kr" "$kic" "$kisc")
        
        local kr_fmt=$(format_scientific "$kr")
        local kic_fmt=$(format_scientific "$kic")
        local kisc_fmt=$(format_scientific "$kisc")
        local huang_fmt=$([[ "$huang" == "N/A     " ]] && echo "N/A     " || echo "$huang" | awk '{printf "%.4f", $1}')
        local coord_fmt=$([[ "$coord" == "INT" ]] && echo " INT" || echo "$coord")
        
        printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
            "$coord_fmt" "$kr_fmt" "$kic_fmt" "$kisc_fmt" "$lifetime" "$phi" "$huang_fmt" "$mode" "$lambda_low" "$lambda_total" "$pct_low" | \
            tee -a "$output_file"
    done
    
    echo ""
    echo "Results saved to $output_file"
    
    # 统计信息
    echo ""
    local ic_found=0 emi_found=0 isc_found=0 huang_found=0
    for coord in "CART" "INT"; do
        [[ ${rates_data[${coord}_ic]} ]] && ((ic_found++))
        [[ ${rates_data[${coord}_emi]} ]] && ((emi_found++))
        [[ ${rates_data[${coord}_isc]} ]] && ((isc_found++))
        [[ ${huang_data[${coord}_huang]} ]] && ((huang_found++))
    done
    echo "Found: IC=$ic_found EMI=$emi_found ISC=$isc_found Huang-Rhys=$huang_found"
    
    # Duschinsky矩阵热图绘制
    echo ""
    echo "Duschinsky Matrix Heatmaps:"
    echo "---------------------------"
    for dir in IC-*/ EMI-*/ NR0-*/ ISC-*/; do
        [ -d "$dir" ] && plot_duschinsky "$dir"
    done
    
    # 附加分析：Huang-Rhys频率分布图
    echo ""
    echo "Additional Analysis:"
    echo "-------------------"
    for coord in "CART" "INT"; do
        [[ ${huang_data[${coord}_huang]} ]] && plot_huang_rhys_frequency "$coord"
    done
}

main
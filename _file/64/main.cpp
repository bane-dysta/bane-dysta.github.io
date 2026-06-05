#include <GraphMol/RDKitBase.h>
#include <GraphMol/Conformer.h>
#include <GraphMol/MolOps.h>
#include <GraphMol/SmilesParse/SmilesParse.h>
#include <GraphMol/SmilesParse/SmilesWrite.h>
#include <GraphMol/DistGeomHelpers/Embedder.h>
#include <GraphMol/ForceFieldHelpers/MMFF/AtomTyper.h>
#include <GraphMol/ForceFieldHelpers/MMFF/Builder.h>
#include <GraphMol/ForceFieldHelpers/UFF/Builder.h>
#include <GraphMol/MolAlign/AlignMolecules.h>
#include <ForceField/ForceField.h>

#include <algorithm>
#include <atomic>
#include <cmath>
#include <cctype>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <memory>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>
#include <thread>
#include <utility>
#include <vector>

namespace fs = std::filesystem;

struct Options {
    std::string smiles;
    std::string outputBase = "conformers";
    std::string outputDir = "conformers";
    std::string sdfFile = "conformers/conformers.sdf";
    std::string csvFile = "conformers/conformers.csv";
    std::string trjFile = "conformers/trj.xyz";

    int numConfs = 0;          // 0 means auto: atom_count_after_AddHs * 4
    int numThreads = 0;        // 0 = all hardware threads
    int maxIters = 1000;
    int randomSeed = 42;       // hidden option, not asked interactively
    int charge = 0;            // trj.xyz charge, default = formal charge sum
    int spinMultiplicity = 1;  // trj.xyz spin multiplicity, default = radical electrons + 1

    double forceTol = 0.0001;  // hidden defaults
    double energyTol = 1e-6;
    double rmsdCutoff = 0.50;          // Angstrom
    double duplicateEnergyCutoff = 0.25; // kcal/mol
    double energyWindow = 10.0;        // kcal/mol
    double populationCutoff = 0.01;    // 1%
    double temperature = 298.15;       // K

    std::string mmffVariant = "MMFF94";
    bool useUffFallback = true;        // always on by default

    bool interactive = true;
    bool help = false;

    bool smilesSet = false;
    bool outputSet = false;
    bool outputDirSet = false;
    bool numConfsSet = false;
    bool chargeSet = false;
    bool spinSet = false;
    bool noPause = false;
};

struct OptimizedConf {
    int confId = -1;
    int status = -1; // 0 converged, 1 more iterations needed, -1 invalid
    double energy = 0.0;
    bool ok = false;
    std::string message;
    std::vector<RDGeom::Point3D> coords;
};

struct ConformerInfo {
    int confId = -1;
    int status = -1;
    double energy = 0.0;
    double relativeEnergy = 0.0;
    double population = 0.0;
    double rmsdToLowest = 0.0;
    double minRmsdToKept = 0.0;
};

struct SearchResult {
    std::unique_ptr<RDKit::ROMol> mol;
    std::string canonicalSmiles;
    std::string forceFieldUsed;
    int embeddedCount = 0;
    int optimizedValidCount = 0;
    std::vector<ConformerInfo> finalConformers;
};

static std::string trim(const std::string &s) {
    auto begin = std::find_if_not(s.begin(), s.end(),
                                  [](unsigned char c) { return std::isspace(c); });
    auto end = std::find_if_not(s.rbegin(), s.rend(),
                                [](unsigned char c) { return std::isspace(c); }).base();
    if (begin >= end) return {};
    return std::string(begin, end);
}

static std::string lower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(),
                   [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
    return s;
}

static std::string fixedString(double x, int precision) {
    std::ostringstream os;
    os << std::fixed << std::setprecision(precision) << x;
    return os.str();
}

static std::string askString(const std::string &label, const std::string &defaultValue) {
    std::cout << label << " [" << defaultValue << "]: ";
    std::string line;
    std::getline(std::cin, line);
    line = trim(line);
    return line.empty() ? defaultValue : line;
}

template <typename T>
static T askNumber(const std::string &label, T defaultValue) {
    while (true) {
        std::cout << label << " [" << defaultValue << "]: ";
        std::string line;
        std::getline(std::cin, line);
        line = trim(line);
        if (line.empty()) return defaultValue;
        std::stringstream ss(line);
        T value{};
        ss >> value;
        if (!ss.fail()) return value;
        std::cout << "Invalid number, please try again.\n";
    }
}

static bool isKnownOutputExtension(const std::string &ext) {
    return ext == ".sdf" || ext == ".csv" || ext == ".xyz";
}

static std::string outputStemFromBase(const fs::path &p) {
    std::string ext = lower(p.extension().string());

    fs::path namePath;
    if (isKnownOutputExtension(ext)) {
        namePath = p.stem();
    } else {
        namePath = p.filename();
        if (namePath.empty() && p.has_parent_path()) {
            namePath = p.parent_path().filename();
        }
    }

    std::string stem = namePath.string();
    return stem.empty() ? std::string("conformers") : stem;
}

static fs::path defaultOutputDirFromBase(const fs::path &p) {
    if (p.empty()) {
        return fs::path("conformers");
    }

    std::string ext = lower(p.extension().string());
    if (isKnownOutputExtension(ext)) {
        fs::path dir = p;
        dir.replace_extension("");
        return dir.empty() ? fs::path("conformers") : dir;
    }

    return p;
}

static void deriveOutputFiles(Options &opt) {
    fs::path basePath(opt.outputBase);
    const std::string stem = outputStemFromBase(basePath);

    fs::path dir = opt.outputDirSet
        ? fs::path(opt.outputDir)
        : defaultOutputDirFromBase(basePath);

    if (dir.empty()) {
        dir = fs::path("conformers");
    }

    opt.outputDir = dir.string();
    opt.sdfFile = (dir / (stem + ".sdf")).string();
    opt.csvFile = (dir / (stem + ".csv")).string();
    opt.trjFile = (dir / "trj.xyz").string();
}

static void printHelp() {
    std::cout << R"(RDKit single-SMILES conformer search

Usage:
  confsearch.exe
  confsearch.exe "CCOC(=O)c1ccccc1"
  confsearch.exe -s "CCOC(=O)c1ccccc1" -o aspirin_conf -n 1000 -t 0
  confsearch.exe -s "CCO" --no-interactive

Main options:
  -s, --smiles TEXT        Input SMILES. If missing, the program asks for it.
  -o, --out FILE/PREFIX    Output prefix or filename. Files are written to a separate folder.
                           Example: -o result  -> result/result.sdf + result/result.csv + result/trj.xyz
                           Example: -o result.sdf -> result/result.sdf + result/result.csv + result/trj.xyz
      --out-dir DIR        Override the output folder while keeping names from --out.
  -n, --num-confs N        Number of initial conformers. Default: atom_count_after_AddHs * 4
  -t, --threads N          Number of worker threads. 0 = all CPU threads. Default: 0
  --max-iters N            MMFF94/UFF max iterations. Default: 1000
  --rmsd X                 RMSD duplicate cutoff in Angstrom. Default: 0.50
  --dedup-energy X         Energy duplicate cutoff in kcal/mol. Default: 0.25
  --energy-window X        Energy pre-filter window in kcal/mol. Default: 10.0
  --pop X                  Population cutoff. 0.01 means 1%. Default: 0.01
  --temp X                 Temperature in K. Default: 298.15
  --charge N               Charge written to trj.xyz. Default: sum of formal charges.
  --spin N                 Spin multiplicity written to trj.xyz. Default: radical electrons + 1.
  --no-interactive         Do not ask questions; use provided args/defaults
  --no-pause               Do not wait for Enter before exiting
  -h, --help               Show help

)";
}

static std::string requireValue(int &i, int argc, char **argv, const std::string &flag) {
    if (i + 1 >= argc) {
        throw std::runtime_error("Missing value after " + flag);
    }
    return argv[++i];
}

static Options parseArgs(int argc, char **argv) {
    Options opt;
    opt.interactive = true;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];

        if (arg == "-h" || arg == "--help") {
            opt.help = true;
        } else if (arg == "--no-interactive" || arg == "--defaults" || arg == "-y") {
            opt.interactive = false;
        } else if (arg == "--interactive") {
            opt.interactive = true;
        } else if (arg == "-s" || arg == "--smiles") {
            opt.smiles = requireValue(i, argc, argv, arg);
            opt.smilesSet = true;
        } else if (arg == "-o" || arg == "--out") {
            opt.outputBase = requireValue(i, argc, argv, arg);
            opt.outputSet = true;
        } else if (arg == "--out-dir") {
            opt.outputDir = requireValue(i, argc, argv, arg);
            opt.outputDirSet = true;
        } else if (arg == "-n" || arg == "--num-confs") {
            opt.numConfs = std::stoi(requireValue(i, argc, argv, arg));
            opt.numConfsSet = true;
        } else if (arg == "-t" || arg == "--threads") {
            opt.numThreads = std::stoi(requireValue(i, argc, argv, arg));
        } else if (arg == "--max-iters") {
            opt.maxIters = std::stoi(requireValue(i, argc, argv, arg));
        } else if (arg == "--rmsd") {
            opt.rmsdCutoff = std::stod(requireValue(i, argc, argv, arg));
        } else if (arg == "--dedup-energy") {
            opt.duplicateEnergyCutoff = std::stod(requireValue(i, argc, argv, arg));
        } else if (arg == "--energy-window") {
            opt.energyWindow = std::stod(requireValue(i, argc, argv, arg));
        } else if (arg == "--pop") {
            opt.populationCutoff = std::stod(requireValue(i, argc, argv, arg));
        } else if (arg == "--temp") {
            opt.temperature = std::stod(requireValue(i, argc, argv, arg));
        } else if (arg == "--charge") {
            opt.charge = std::stoi(requireValue(i, argc, argv, arg));
            opt.chargeSet = true;
        } else if (arg == "--spin" || arg == "--multiplicity") {
            opt.spinMultiplicity = std::stoi(requireValue(i, argc, argv, arg));
            opt.spinSet = true;
        } else if (arg == "--no-pause") {
            opt.noPause = true;
        } else if (arg == "--mmff-variant") { // hidden advanced option
            opt.mmffVariant = requireValue(i, argc, argv, arg);
        } else if (arg == "--seed") { // hidden advanced option
            opt.randomSeed = std::stoi(requireValue(i, argc, argv, arg));
        } else if (!arg.empty() && arg[0] != '-' && !opt.smilesSet) {
            opt.smiles = arg;
            opt.smilesSet = true;
        } else {
            throw std::runtime_error("Unknown option: " + arg);
        }
    }

    deriveOutputFiles(opt);
    return opt;
}

static std::vector<int> parseMenuSelection(const std::string &line) {
    std::vector<int> out;
    std::string normalized = line;
    for (char &c : normalized) {
        if (c == ',' || c == ';' || c == ' ') c = ' ';
    }

    std::stringstream ss(normalized);
    int x;
    while (ss >> x) {
        if (std::find(out.begin(), out.end(), x) == out.end()) {
            out.push_back(x);
        }
    }
    return out;
}

static int estimateDefaultConformerCount(const std::string &smiles) {
    std::unique_ptr<RDKit::ROMol> mol(RDKit::SmilesToMol(smiles));
    if (!mol) {
        return 100;
    }

    std::unique_ptr<RDKit::ROMol> molH(RDKit::MolOps::addHs(*mol));
    if (!molH) {
        return std::max(1, static_cast<int>(mol->getNumAtoms()) * 4);
    }

    return std::max(1, static_cast<int>(molH->getNumAtoms()) * 4);
}

static std::pair<int, int> estimateDefaultChargeAndSpin(const std::string &smiles) {
    std::unique_ptr<RDKit::ROMol> mol(RDKit::SmilesToMol(smiles));
    if (!mol) {
        return {0, 1};
    }

    int formalCharge = 0;
    int unpairedElectrons = 0;

    for (const RDKit::Atom *atom : mol->atoms()) {
        formalCharge += atom->getFormalCharge();
        unpairedElectrons += static_cast<int>(atom->getNumRadicalElectrons());
    }

    return {formalCharge, std::max(1, unpairedElectrons + 1)};
}

static void applyAutoDefaultsAfterSmiles(Options &opt) {
    if (!opt.numConfsSet || opt.numConfs <= 0) {
        opt.numConfs = estimateDefaultConformerCount(opt.smiles);
    }

    if (!opt.chargeSet || !opt.spinSet) {
        auto [defaultCharge, defaultSpin] = estimateDefaultChargeAndSpin(opt.smiles);
        if (!opt.chargeSet) {
            opt.charge = defaultCharge;
        }
        if (!opt.spinSet || opt.spinMultiplicity <= 0) {
            opt.spinMultiplicity = defaultSpin;
        }
    }
}

static void printParameterTable(const Options &opt) {
    std::cout << "\nCurrent default parameters:\n";
    std::cout << "  1. Initial conformers       " << opt.numConfs << "  (auto = atom_count_after_AddHs * 4)\n";
    std::cout << "  2. Threads                  " << opt.numThreads << "  (0 = all CPU threads)\n";
    std::cout << "  3. Max optimization steps   " << opt.maxIters << "\n";
    std::cout << "  4. RMSD dedup cutoff        " << opt.rmsdCutoff << " A\n";
    std::cout << "  5. Dedup energy cutoff      " << opt.duplicateEnergyCutoff << " kcal/mol\n";
    std::cout << "  6. Energy window            " << opt.energyWindow << " kcal/mol\n";
    std::cout << "  7. Boltzmann cutoff         " << opt.populationCutoff * 100.0 << " %\n";
    std::cout << "  8. Temperature              " << opt.temperature << " K\n";
    std::cout << "  9. Charge for trj.xyz       " << opt.charge << "  (auto = sum of formal charges)\n";
    std::cout << " 10. Spin for trj.xyz         " << opt.spinMultiplicity << "  (auto = unpaired electrons + 1)\n";
}

static void fillMissingInteractively(Options &opt) {
    if (opt.smiles.empty()) {
        while (opt.smiles.empty()) {
            std::cout << "Enter SMILES: ";
            std::getline(std::cin, opt.smiles);
            opt.smiles = trim(opt.smiles);
        }
    }

    applyAutoDefaultsAfterSmiles(opt);

    if (!opt.interactive) {
        deriveOutputFiles(opt);
        return;
    }

    if (!opt.outputSet) {
        opt.outputBase = askString("Output prefix or filename", opt.outputBase);
        deriveOutputFiles(opt);
    }

    printParameterTable(opt);
    std::cout << "\nWhich parameters do you want to change? Enter numbers separated by commas.\n";
    std::cout << "Example: 1,4,7 changes conformer count, RMSD cutoff, and Boltzmann cutoff.\n";
    std::cout << "Items to change: ";

    std::string line;
    std::getline(std::cin, line);
    auto choices = parseMenuSelection(line);

    for (int choice : choices) {
        switch (choice) {
            case 1: opt.numConfs = askNumber<int>("Initial conformer count", opt.numConfs); break;
            case 2: opt.numThreads = askNumber<int>("Thread count, 0 = all CPU threads", opt.numThreads); break;
            case 3: opt.maxIters = askNumber<int>("Max optimization steps", opt.maxIters); break;
            case 4: opt.rmsdCutoff = askNumber<double>("RMSD dedup cutoff, A", opt.rmsdCutoff); break;
            case 5: opt.duplicateEnergyCutoff = askNumber<double>("Dedup energy cutoff, kcal/mol", opt.duplicateEnergyCutoff); break;
            case 6: opt.energyWindow = askNumber<double>("Energy window, kcal/mol", opt.energyWindow); break;
            case 7: opt.populationCutoff = askNumber<double>("Boltzmann cutoff, 0.01 = 1%", opt.populationCutoff); break;
            case 8: opt.temperature = askNumber<double>("Temperature, K", opt.temperature); break;
            case 9: opt.charge = askNumber<int>("Charge for trj.xyz", opt.charge); opt.chargeSet = true; break;
            case 10: opt.spinMultiplicity = askNumber<int>("Spin multiplicity for trj.xyz", opt.spinMultiplicity); opt.spinSet = true; break;
            default:
                std::cout << "Ignoring unknown item: " << choice << "\n";
                break;
        }
    }

    deriveOutputFiles(opt);
    std::cout << "\n";
}

static void validateOptions(const Options &opt) {
    if (opt.smiles.empty()) throw std::runtime_error("SMILES is empty");
    if (opt.numConfs <= 0) throw std::runtime_error("Initial conformer count must be > 0");
    if (opt.numThreads < 0) throw std::runtime_error("Thread count must be >= 0");
    if (opt.maxIters <= 0) throw std::runtime_error("Max iterations must be > 0");
    if (opt.rmsdCutoff <= 0.0) throw std::runtime_error("RMSD cutoff must be > 0");
    if (opt.duplicateEnergyCutoff < 0.0) throw std::runtime_error("Duplicate energy cutoff must be >= 0");
    if (opt.energyWindow <= 0.0) throw std::runtime_error("Energy window must be > 0");
    if (opt.populationCutoff < 0.0 || opt.populationCutoff > 1.0) {
        throw std::runtime_error("Population cutoff must be between 0 and 1");
    }
    if (opt.temperature <= 0.0) throw std::runtime_error("Temperature must be > 0");
    if (opt.spinMultiplicity <= 0) throw std::runtime_error("Spin multiplicity must be > 0");
    if (trim(opt.outputDir).empty()) throw std::runtime_error("Output directory is empty");

    std::string variant = lower(opt.mmffVariant);
    if (variant != "mmff94" && variant != "mmff94s") {
        throw std::runtime_error("MMFF variant must be MMFF94 or MMFF94S");
    }
}

static int resolvedThreadCount(int requested) {
    if (requested > 0) return requested;
    unsigned int hc = std::thread::hardware_concurrency();
    return hc == 0 ? 1 : static_cast<int>(hc);
}

static OptimizedConf optimizeOneConformer(const RDKit::ROMol &molNoConfs,
                                          const RDKit::Conformer &initialConf,
                                          const Options &opt,
                                          bool useMMFF) {
    OptimizedConf res;
    res.confId = initialConf.getId();

    try {
        RDKit::ROMol localMol(molNoConfs);
        localMol.addConformer(new RDKit::Conformer(initialConf), false);
        const int localConfId = localMol.getConformer().getId();

        std::unique_ptr<ForceFields::ForceField> ff;

        if (useMMFF) {
            RDKit::MMFF::MMFFMolProperties props(localMol, opt.mmffVariant);
            if (!props.isValid()) {
                res.message = "MMFF properties invalid";
                return res;
            }
            ff.reset(RDKit::MMFF::constructForceField(
                localMol, &props, 10.0, localConfId, true));
        } else {
            ff.reset(RDKit::UFF::constructForceField(
                localMol, 10.0, localConfId, true));
        }

        if (!ff) {
            res.message = useMMFF ? "MMFF force field construction failed"
                                  : "UFF force field construction failed";
            return res;
        }

        ff->initialize();
        res.status = ff->minimize(static_cast<unsigned int>(opt.maxIters),
                                  opt.forceTol, opt.energyTol);
        res.energy = ff->calcEnergy();

        const RDKit::Conformer &outConf = localMol.getConformer(localConfId);
        res.coords.reserve(localMol.getNumAtoms());
        for (unsigned int i = 0; i < localMol.getNumAtoms(); ++i) {
            res.coords.push_back(outConf.getAtomPos(i));
        }

        res.ok = std::isfinite(res.energy);
        return res;
    } catch (const std::exception &e) {
        res.message = e.what();
        return res;
    }
}

static std::vector<OptimizedConf> optimizeConformersParallel(RDKit::ROMol &mol,
                                                             const RDKit::INT_VECT &confIds,
                                                             const Options &opt,
                                                             bool useMMFF) {
    RDKit::ROMol molNoConfs(mol);
    molNoConfs.clearConformers();

    std::vector<RDKit::Conformer> initialConfs;
    initialConfs.reserve(confIds.size());
    for (int confId : confIds) {
        initialConfs.emplace_back(mol.getConformer(confId));
    }

    std::vector<OptimizedConf> results(initialConfs.size());
    if (initialConfs.empty()) return results;

    int nThreads = resolvedThreadCount(opt.numThreads);
    nThreads = std::max(1, std::min<int>(nThreads, static_cast<int>(initialConfs.size())));

    std::atomic<std::size_t> next{0};
    std::vector<std::thread> workers;
    workers.reserve(nThreads);

    for (int t = 0; t < nThreads; ++t) {
        workers.emplace_back([&]() {
            while (true) {
                std::size_t i = next.fetch_add(1);
                if (i >= initialConfs.size()) break;
                results[i] = optimizeOneConformer(molNoConfs, initialConfs[i], opt, useMMFF);
            }
        });
    }

    for (auto &w : workers) {
        w.join();
    }

    // Copy optimized coordinates back into the output molecule.
    for (const auto &r : results) {
        if (!r.ok || r.coords.empty()) continue;
        RDKit::Conformer &conf = mol.getConformer(r.confId);
        for (unsigned int i = 0; i < mol.getNumAtoms(); ++i) {
            conf.setAtomPos(i, r.coords[i]);
        }
    }

    return results;
}

static std::vector<RDKit::MatchVectType> makeIdentityHeavyAtomMap(const RDKit::ROMol &mol) {
    RDKit::MatchVectType atomMap;
    for (auto atom : mol.atoms()) {
        if (atom->getAtomicNum() > 1) {
            atomMap.emplace_back(static_cast<int>(atom->getIdx()), static_cast<int>(atom->getIdx()));
        }
    }

    if (atomMap.empty()) {
        for (auto atom : mol.atoms()) {
            atomMap.emplace_back(static_cast<int>(atom->getIdx()), static_cast<int>(atom->getIdx()));
        }
    }

    return std::vector<RDKit::MatchVectType>{atomMap};
}

static double bestRmsdInAngstrom(RDKit::ROMol &mol,
                                 int confA,
                                 int confB,
                                 const std::vector<RDKit::MatchVectType> &atomMaps) {
    return RDKit::MolAlign::getBestRMS(
        mol, mol, confA, confB,
        atomMaps,
        1,
        true,
        nullptr,
        1
    );
}

static void calculateBoltzmann(std::vector<ConformerInfo> &confs, double temperature) {
    if (confs.empty()) return;

    const double R = 0.00198720425864083; // kcal mol^-1 K^-1
    const double minEnergy = confs.front().energy;

    double sumWeights = 0.0;
    std::vector<double> weights(confs.size(), 0.0);

    for (std::size_t i = 0; i < confs.size(); ++i) {
        confs[i].relativeEnergy = confs[i].energy - minEnergy;
        weights[i] = std::exp(-confs[i].relativeEnergy / (R * temperature));
        sumWeights += weights[i];
    }

    if (sumWeights <= 0.0 || !std::isfinite(sumWeights)) {
        throw std::runtime_error("Boltzmann weights underflowed or became non-finite");
    }

    for (std::size_t i = 0; i < confs.size(); ++i) {
        confs[i].population = weights[i] / sumWeights;
    }
}

static SearchResult runConformerSearch(const Options &opt) {
    SearchResult result;

    std::unique_ptr<RDKit::ROMol> mol(RDKit::SmilesToMol(opt.smiles));
    if (!mol) {
        throw std::runtime_error("Could not parse SMILES: " + opt.smiles);
    }

    result.canonicalSmiles = RDKit::MolToSmiles(*mol);

    std::unique_ptr<RDKit::ROMol> molH(RDKit::MolOps::addHs(*mol));
    if (!molH) {
        throw std::runtime_error("Could not add hydrogens");
    }

    std::cout << "Canonical SMILES: " << result.canonicalSmiles << "\n";
    std::cout << "Embedding " << opt.numConfs << " initial conformers...\n";

    // ETKDG-like settings. Avoid referencing exported ETKDGv3 preset object directly on Windows.
    RDKit::DGeomHelpers::EmbedParameters params;
    params.randomSeed = opt.randomSeed;
    params.numThreads = opt.numThreads;
    params.clearConfs = true;
    params.enforceChirality = true;
    params.useExpTorsionAnglePrefs = true;
    params.useBasicKnowledge = true;
    params.useSmallRingTorsions = true;
    params.useMacrocycleTorsions = true;
    params.useMacrocycle14config = true;
    params.ETversion = 2;
    params.pruneRmsThresh = -1.0; // do our own post-optimization pruning

    RDKit::INT_VECT confIds = RDKit::DGeomHelpers::EmbedMultipleConfs(
        *molH, static_cast<unsigned int>(opt.numConfs), params);

    result.embeddedCount = static_cast<int>(confIds.size());
    if (confIds.empty()) {
        throw std::runtime_error("RDKit could not embed any conformers");
    }

    std::cout << "Embedded conformers: " << result.embeddedCount << "\n";

    std::cout << "Optimizing with " << opt.mmffVariant
              << " using " << resolvedThreadCount(opt.numThreads) << " worker thread(s)...\n";

    auto optResults = optimizeConformersParallel(*molH, confIds, opt, true);
    result.forceFieldUsed = opt.mmffVariant;

    auto countValid = [](const std::vector<OptimizedConf> &xs) {
        return static_cast<int>(std::count_if(xs.begin(), xs.end(),
            [](const OptimizedConf &x) { return x.ok && std::isfinite(x.energy); }));
    };

    result.optimizedValidCount = countValid(optResults);

    if (result.optimizedValidCount == 0 && opt.useUffFallback) {
        std::cout << opt.mmffVariant << " failed for all conformers, trying UFF...\n";
        optResults = optimizeConformersParallel(*molH, confIds, opt, false);
        result.forceFieldUsed = "UFF";
        result.optimizedValidCount = countValid(optResults);
    }

    if (result.optimizedValidCount == 0) {
        throw std::runtime_error("Force-field optimization failed for all conformers");
    }

    std::vector<ConformerInfo> candidates;
    candidates.reserve(optResults.size());

    for (const auto &r : optResults) {
        if (!r.ok || !std::isfinite(r.energy)) continue;
        ConformerInfo info;
        info.confId = r.confId;
        info.status = r.status;
        info.energy = r.energy;
        candidates.push_back(info);
    }

    std::sort(candidates.begin(), candidates.end(),
              [](const ConformerInfo &a, const ConformerInfo &b) {
                  return a.energy < b.energy;
              });

    const double minEnergy = candidates.front().energy;
    for (auto &c : candidates) {
        c.relativeEnergy = c.energy - minEnergy;
    }

    std::cout << "Valid optimized conformers: " << candidates.size() << "\n";
    std::cout << "Lowest " << result.forceFieldUsed << " energy: "
              << std::fixed << std::setprecision(6) << minEnergy << " kcal/mol\n";

    std::vector<ConformerInfo> energyFiltered;
    for (const auto &c : candidates) {
        if (c.relativeEnergy <= opt.energyWindow) {
            energyFiltered.push_back(c);
        }
    }

    std::cout << "After energy-window filter (<=" << opt.energyWindow
              << " kcal/mol): " << energyFiltered.size() << "\n";

    const auto atomMaps = makeIdentityHeavyAtomMap(*molH);
    std::vector<ConformerInfo> kept;
    kept.reserve(energyFiltered.size());

    for (auto cand : energyFiltered) {
        if (kept.empty()) {
            cand.minRmsdToKept = 0.0;
            cand.rmsdToLowest = 0.0;
            kept.push_back(cand);
            continue;
        }

        double minRmsd = std::numeric_limits<double>::infinity();
        bool duplicate = false;

        for (const auto &k : kept) {
            double rmsd = bestRmsdInAngstrom(*molH, cand.confId, k.confId, atomMaps);
            minRmsd = std::min(minRmsd, rmsd);

            const double dE = std::fabs(cand.energy - k.energy);
            if (rmsd < opt.rmsdCutoff && dE < opt.duplicateEnergyCutoff) {
                duplicate = true;
                break;
            }
        }

        if (!duplicate) {
            cand.minRmsdToKept = minRmsd;
            cand.rmsdToLowest = bestRmsdInAngstrom(*molH, cand.confId, kept.front().confId, atomMaps);
            kept.push_back(cand);
        }
    }

    std::cout << "After RMSD/energy deduplication: " << kept.size() << "\n";

    calculateBoltzmann(kept, opt.temperature);

    std::vector<ConformerInfo> finalConfs;
    for (const auto &c : kept) {
        if (c.population >= opt.populationCutoff) {
            finalConfs.push_back(c);
        }
    }

    std::cout << "After population filter (>=" << opt.populationCutoff * 100.0
              << "%): " << finalConfs.size() << "\n";

    result.mol = std::move(molH);
    result.finalConformers = std::move(finalConfs);
    return result;
}

static void printSummary(const SearchResult &res) {
    std::cout << "\nFinal conformers:\n";
    std::cout << "Rank  ConfID  Status  Energy(kcal/mol)  RelE(kcal/mol)  RMSD_to_min(A)  Pop(%)\n";
    std::cout << "----  ------  ------  ----------------  -------------  --------------  ------\n";

    int rank = 1;
    for (const auto &c : res.finalConformers) {
        std::cout << std::setw(4) << rank++ << "  "
                  << std::setw(6) << c.confId << "  "
                  << std::setw(6) << c.status << "  "
                  << std::setw(16) << std::fixed << std::setprecision(6) << c.energy << "  "
                  << std::setw(13) << std::fixed << std::setprecision(6) << c.relativeEnergy << "  "
                  << std::setw(14) << std::fixed << std::setprecision(4) << c.rmsdToLowest << "  "
                  << std::setw(6) << std::fixed << std::setprecision(2) << c.population * 100.0
                  << "\n";
    }
}

static void ensureOutputDirectory(const Options &opt) {
    fs::path dir(opt.outputDir);
    if (dir.empty()) {
        throw std::runtime_error("Output directory is empty");
    }

    std::error_code ec;
    if (fs::exists(dir, ec) && !fs::is_directory(dir, ec)) {
        throw std::runtime_error("Output path exists but is not a directory: " + dir.string());
    }

    fs::create_directories(dir, ec);
    if (ec) {
        throw std::runtime_error("Could not create output directory " + dir.string() + ": " + ec.message());
    }
}

static void writeCsv(const SearchResult &res, const Options &opt) {
    std::ofstream out(opt.csvFile, std::ios::out | std::ios::trunc);
    if (!out) throw std::runtime_error("Could not open CSV output: " + opt.csvFile);

    out << "rank,conf_id,force_field,status,energy_kcal_mol,relative_energy_kcal_mol,"
           "rmsd_to_lowest_A,min_rmsd_to_kept_A,population,population_percent,smiles\n";

    int rank = 1;
    for (const auto &c : res.finalConformers) {
        out << rank++ << ','
            << c.confId << ','
            << res.forceFieldUsed << ','
            << c.status << ','
            << fixedString(c.energy, 8) << ','
            << fixedString(c.relativeEnergy, 8) << ','
            << fixedString(c.rmsdToLowest, 6) << ','
            << fixedString(c.minRmsdToKept, 6) << ','
            << fixedString(c.population, 8) << ','
            << fixedString(c.population * 100.0, 4) << ','
            << '"' << res.canonicalSmiles << '"' << '\n';
    }
}

static int molfileBondType(const RDKit::Bond *bond) {
    switch (bond->getBondType()) {
        case RDKit::Bond::SINGLE: return 1;
        case RDKit::Bond::DOUBLE: return 2;
        case RDKit::Bond::TRIPLE: return 3;
        case RDKit::Bond::AROMATIC: return 4;
        default: return 1;
    }
}

static void writeSdfProperty(std::ostream &out,
                             const std::string &name,
                             const std::string &value) {
    out << ">  <" << name << ">\n";
    out << value << "\n\n";
}

static void writeMolBlockV2000(std::ostream &out,
                               const RDKit::ROMol &mol,
                               int confId,
                               const std::string &name) {
    const RDKit::Conformer &conf = mol.getConformer(confId);

    out << name << "\n";
    out << "  confsearch\n";
    out << "\n";

    const unsigned int nAtoms = mol.getNumAtoms();
    const unsigned int nBonds = mol.getNumBonds();

    if (nAtoms > 999 || nBonds > 999) {
        throw std::runtime_error("V2000 SDF writer supports at most 999 atoms and 999 bonds");
    }

    out << std::setw(3) << nAtoms
        << std::setw(3) << nBonds
        << "  0  0  0  0            999 V2000\n";

    for (unsigned int i = 0; i < nAtoms; ++i) {
        const RDKit::Atom *atom = mol.getAtomWithIdx(i);
        const RDGeom::Point3D &p = conf.getAtomPos(i);

        out << std::fixed << std::setprecision(4)
            << std::setw(10) << p.x
            << std::setw(10) << p.y
            << std::setw(10) << p.z << " "
            << std::left << std::setw(3) << atom->getSymbol() << std::right
            << " 0  0  0  0  0  0  0  0  0  0  0  0\n";
    }

    for (const RDKit::Bond *bond : mol.bonds()) {
        out << std::setw(3) << (bond->getBeginAtomIdx() + 1)
            << std::setw(3) << (bond->getEndAtomIdx() + 1)
            << std::setw(3) << molfileBondType(bond)
            << "  0  0  0  0\n";
    }

    // Preserve formal charges in simple M  CHG records, 8 atom-charge pairs per line.
    std::vector<std::pair<int, int>> charges;
    for (unsigned int i = 0; i < nAtoms; ++i) {
        int chg = mol.getAtomWithIdx(i)->getFormalCharge();
        if (chg != 0) {
            charges.emplace_back(static_cast<int>(i + 1), chg);
        }
    }

    for (std::size_t offset = 0; offset < charges.size(); offset += 8) {
        std::size_t count = std::min<std::size_t>(8, charges.size() - offset);
        out << "M  CHG" << std::setw(3) << count;
        for (std::size_t j = 0; j < count; ++j) {
            out << std::setw(4) << charges[offset + j].first
                << std::setw(4) << charges[offset + j].second;
        }
        out << "\n";
    }

    out << "M  END\n";
}

static void writeSdf(const SearchResult &res, const Options &opt) {
    std::ofstream out(opt.sdfFile, std::ios::out | std::ios::trunc);
    if (!out) {
        throw std::runtime_error("Could not open SDF output: " + opt.sdfFile);
    }

    int rank = 1;
    for (const auto &c : res.finalConformers) {
        const std::string name = "conf_" + std::to_string(rank);

        writeMolBlockV2000(out, *res.mol, c.confId, name);

        writeSdfProperty(out, "Rank", std::to_string(rank));
        writeSdfProperty(out, "ConfID", std::to_string(c.confId));
        writeSdfProperty(out, "ForceField", res.forceFieldUsed);
        writeSdfProperty(out, "Status", std::to_string(c.status));
        writeSdfProperty(out, "Energy_kcal_mol", fixedString(c.energy, 8));
        writeSdfProperty(out, "RelativeEnergy_kcal_mol", fixedString(c.relativeEnergy, 8));
        writeSdfProperty(out, "RMSD_to_lowest_A", fixedString(c.rmsdToLowest, 6));
        writeSdfProperty(out, "Min_RMSD_to_kept_A", fixedString(c.minRmsdToKept, 6));
        writeSdfProperty(out, "Population", fixedString(c.population, 8));
        writeSdfProperty(out, "Population_percent", fixedString(c.population * 100.0, 4));
        writeSdfProperty(out, "Canonical_SMILES", res.canonicalSmiles);

        out << "$$$$\n";
        ++rank;
    }
}

static void writeTrjXyz(const SearchResult &res, const Options &opt) {
    std::ofstream out(opt.trjFile, std::ios::out | std::ios::trunc);
    if (!out) {
        throw std::runtime_error("Could not open trj.xyz output: " + opt.trjFile);
    }

    for (const auto &c : res.finalConformers) {
        const RDKit::Conformer &conf = res.mol->getConformer(c.confId);

        out << res.mol->getNumAtoms() << "\n";
        out << opt.charge << " " << opt.spinMultiplicity
            << " E=" << fixedString(c.energy, 8)
            << " boltzmann_w=" << fixedString(c.population, 8) << "\n";

        for (unsigned int i = 0; i < res.mol->getNumAtoms(); ++i) {
            const RDKit::Atom *atom = res.mol->getAtomWithIdx(i);
            const RDGeom::Point3D &pos = conf.getAtomPos(i);

            out << std::left << std::setw(3) << atom->getSymbol() << std::right << " "
                << std::fixed << std::setprecision(8)
                << std::setw(14) << pos.x << " "
                << std::setw(14) << pos.y << " "
                << std::setw(14) << pos.z << "\n";
        }
    }
}

static void waitBeforeExitIfNeeded(const Options &opt) {
    if (opt.noPause) {
        return;
    }

    std::cout << "\nPress Enter to exit...";
    std::string dummy;
    std::getline(std::cin, dummy);
}

static void printIntro() {
    std::cout << "Confs - a crude conformational search script. ";
    std::cout << "Written by Bane Dysta.\n";
    std::cout << "feedback: http://bbs.keinsci.com/forum.php?mod=viewthread&tid=59528&fromuid=63020\n\n";
}

int main(int argc, char **argv) {
    printIntro();
    Options opt;
    try {
        opt = parseArgs(argc, argv);
        if (opt.help) {
            printHelp();
            waitBeforeExitIfNeeded(opt);
            return 0;
        }

        fillMissingInteractively(opt);
        validateOptions(opt);

        std::cout << "SMILES: " << opt.smiles << "\n"
                  << "Output folder: " << opt.outputDir << "\n"
                  << "SDF output: " << opt.sdfFile << "\n"
                  << "CSV output: " << opt.csvFile << "\n"
                  << "TRJ XYZ output: " << opt.trjFile << "\n"
                  << "Initial conformers: " << opt.numConfs << "\n"
                  << "Threads: " << opt.numThreads << " (0 = all CPU threads)\n"
                  << "Max iterations: " << opt.maxIters << "\n"
                  << "RMSD cutoff: " << opt.rmsdCutoff << " A\n"
                  << "Duplicate energy cutoff: " << opt.duplicateEnergyCutoff << " kcal/mol\n"
                  << "Energy window: " << opt.energyWindow << " kcal/mol\n"
                  << "Population cutoff: " << opt.populationCutoff * 100.0 << "%\n"
                  << "Temperature: " << opt.temperature << " K\n"
                  << "Charge for trj.xyz: " << opt.charge << "\n"
                  << "Spin for trj.xyz: " << opt.spinMultiplicity << "\n\n";

        ensureOutputDirectory(opt);
        auto result = runConformerSearch(opt);

        printSummary(result);
        writeCsv(result, opt);
        writeSdf(result, opt);
        writeTrjXyz(result, opt);

        std::cout << "\nDone.\n"
                  << "Wrote: " << opt.sdfFile << "\n"
                  << "Wrote: " << opt.csvFile << "\n"
                  << "Wrote: " << opt.trjFile << "\n";

        waitBeforeExitIfNeeded(opt);
        return 0;
    } catch (const std::exception &e) {
        std::cerr << "\nFatal error: " << e.what() << "\n";
        std::cerr << "Use -h for help.\n";
        waitBeforeExitIfNeeded(opt);
        return 1;
    }
}

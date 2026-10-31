---
title: banedftw
summary: 范围分离泛函的 ω 优化、扫描、SRSH-PCM 与 SVγT 溶剂调谐工具
math: true
---

Last Update: 2026/10/31

banedftw 是用于范围分离泛函参数调谐的命令行工具，由 BaneLib 提供。它调用已安装的 Gaussian 或 ORCA，在固定几何上计算参考体系及失去、得到一个电子后的体系，从能量和前线轨道能量构造目标函数，寻找合适的泛函参数。

程序提供四种运行方式：普通 ω 优化、等步长 ω 扫描、同时考虑交换屏蔽和连续介质环境的 SRSH-PCM 调谐，以及采用非平衡溶剂响应的 SVγT 调谐。前三种支持 Gaussian 和 ORCA，SVγT 使用 Gaussian。输入沿用量化程序的原生模板，程序自动生成各参数点和电荷态的单点任务，并汇总结果。

## 下载与安装

- [banedftw 发布帖与下载](http://bbs.keinsci.com/thread-60799-1-1.html)

将可执行文件放到 `PATH` 中的目录，例如 `~/.local/bin`，然后赋予执行权限：

```bash
chmod +x ~/.local/bin/banedftw
export PATH="$HOME/.local/bin:$PATH"
banedftw --help
```

Gaussian 或 ORCA 需要另行安装，并能在当前终端正常运行。程序默认通过 `g16` 调用 Gaussian；使用 ORCA 时，通过 `--orca /path/to/orca` 指定可执行文件。

## 快速开始

### Gaussian

在独立工作目录中准备 `template.gjf`。下面以 F₂ 为例，实际使用时替换为待调谐体系的几何、泛函、基组及资源设置：

```text
%nprocshared=4
%mem=2000MB
#p LC-wPBE/6-31+G(d) scf=tight nosymm

F2 tuning

0 1
F 0.0 0.0 0.0
F 0.0 0.0 1.41

```

程序从原生输入中读取几何、电荷和多重度。示例中的 `0 1` 表示中性单重态，程序据此生成电荷为 +1 和 −1 的两个双重态单点任务。参考体系也可以带电。

在输入文件所在目录运行：

```bash
banedftw --mode omega --keep
```

默认在 0.05–0.7 Bohr⁻¹ 内搜索 ω，初始值取区间中点，相对收敛容差为 0.0001。`--keep` 保留生成的原生输入和日志，方便检查计算。

也可以直接指定搜索下限、上限、初值和相对容差，四个位置参数按此顺序填写：

```bash
banedftw 0.05 0.7 0.3 0.0001 --keep
```

搜索下限须大于零，初值须严格位于上下限之间，上限不超过 9.9999 Bohr⁻¹。Gaussian 的实际 ω 保留四位小数，ORCA 使用自身可表示精度。

### ORCA

使用 ORCA 时，准备 `template.inp`，例如：

```text
! LC-BLYP ma-def2-SVP TightSCF NoAutoStart
%pal nprocs 4 end
%maxcore 500
* xyz 0 1
F 0.0 0.0 0.0
F 0.0 0.0 1.41
*
```

程序从 `* xyz 0 1` 读取参考体系的电荷和多重度。运行：

```bash
banedftw --mode omega --orca /path/to/orca --keep
```

模板应为单个基态单点任务，泛函须支持所选后端的范围分离参数设置。方法、基组及其他原生单点设置由模板提供；普通 ω 优化和扫描时，不要在模板中固定控制 ω 的 IOp 或 `RangeSepMu`。模板引用的外部文件应使用绝对路径。

## 等步长扫描

扫描适合检查目标函数曲线，再据此选择优化区间。在同样的模板和电子态设置下运行：

```bash
banedftw --mode scan --scanlow 0.1 --scanhigh 0.5 --scanstep 0.02 --keep
```

这会从 0.1 Bohr⁻¹ 开始，以 0.02 Bohr⁻¹ 为步长计算到不超过 0.5 Bohr⁻¹ 的最后一个点。步长不能整除区间时，不额外补算上限；上下限相等时只算一个点。Gaussian 的扫描参数至多四位小数，步长至少为 0.0001 Bohr⁻¹；ORCA 可以使用更细的步长。

程序汇总全部点，并给出网格上目标函数最小的点。扫描使用普通 ω 调谐目标；SRSH 的 PCM 交换比例优化使用下一节的模式。

## SRSH 与 PCM 调谐

`srsh-pcm` 模式按 [Bhandari 等提出的 OT-SRSH-PCM 流程](https://doi.org/10.1021/acs.jctc.8b00876)，在同一静态介电常数下处理长程交换屏蔽和 PCM 环境。支持的泛函如下：

- Gaussian：LC-wPBE、LC-PBEPBE、LC-BLYP、CAM-B3LYP。
- ORCA：LC-BLYP、CAM-B3LYP。

各泛函的相关成分保留。LC-wPBE 与 LC-PBEPBE 是不同模型；ωB97 系列目前不开放 SRSH 调谐。

一轮完整调谐依次完成：

1. 给定短程 HF 交换比例，在气相中将长程 HF 交换比例设为 1，优化 ω。
2. 固定所得 ω，在 PCM 中优化交换比例，满足介电屏蔽约束。

对应的参数关系为：

$$
\beta_{\mathrm{gas}}=1-\alpha,\qquad \alpha_{\mathrm{PCM}}=1/\varepsilon-\beta.
$$

式中：α 是短程 HF 交换比例，α＋β 是长程 HF 交换比例，β 表示两者之差，可以为负值；ε 是静态介电常数。下标 gas 和 PCM 分别表示气相与连续介质环境。气相搜索固定 α、优化 ω；PCM 搜索固定 ω、优化 β，同时更新 α。

例如，指定静态介电常数为 3、初始短程 HF 比例为 0.2：

```bash
banedftw --mode srsh-pcm --epsilon 3 --alpha 0.2 --retune 0 --keep
```

可用 `--solvent Acetonitrile` 按 Gaussian 名称选择溶剂，乙腈对应介电常数 35.688；名称不区分大小写，完整列表可用 `banedftw --list-solvents` 查看。自定义介质使用 `--epsilon`，须大于 1 且不超过 10000。同时给出两者时 epsilon 优先，溶剂名称仍须有效。设置文件也接受 `solvent`；命令行中的 solvent 或 epsilon 会一起替换设置文件中的这两个选项。名称查询仅设置介电常数，计算采用下述 PCM 协议。

`alpha` 默认为 0.2，须满足 0 ≤ alpha < 1。首次调谐完成后，`retune` 指定重新调谐的轮数：0 表示不重新调谐，1、2、3 分别表示重新调谐一、二、三轮。每次重新调谐使用上一轮 PCM 得到的实际 α，再进行气相 ω 搜索和 PCM β 搜索。最终参数取自最后一轮 PCM 搜索。程序按指定轮数停止，每次参数搜索须收敛，但不判断轮间自洽收敛。

β 搜索默认使用物理允许区间 `1/epsilon-1` 到 `1/epsilon`，可用 `--betalow`、`--betahigh` 缩小范围。`--betainit auto` 根据本轮 α 设置初值，初值不在区间内部时取中点；`--betatol` 指定 β 的相对收敛容差，默认 0.0001。

SRSH 模板可直接使用不含溶剂的单点输入，由程序设置 Gaussian 的 IEFPCM 或 ORCA 的 CPCM。已有 PCM 设置须与指定介电常数一致，且不带其他附加溶剂选项；可解释且一致的交换参数覆盖由程序接管，冲突或不支持的设置会在计算前报错。程序保留模板中的基组、格点和 SCF 设置。

Gaussian 的交换比例按四位小数表示，实际 PCM 介电常数也会相应调整。例如 `epsilon=3` 对应长程 HF 比例 0.3333、实际介电常数约 3.00030003；复用结果时以报告和最佳点原生输入中的实际参数为准。ORCA 使用自身可表示精度。

## SVγT 溶剂调谐

`svgt` 模式在溶液中搜索 ω，适用于尚无调谐参数的体系。每个参数点先计算参考态的平衡溶剂场，再固定溶剂的慢极化响应，计算失去和得到一个电子的两个垂直过程。短程 HF 交换比例 α 固定，默认 0.2；β=1−α，长程 HF 交换比例为 1。

在独立工作目录中准备 `template.gjf`，可沿用快速开始中的 Gaussian 模板，填入实际体系的几何、电荷、多重度和资源设置。方法使用 `LC-wPBE`，基组使用 Gaussian 内置基组。模板应为基态单点，溶剂和交换参数由程序生成，因此不添加 SCRF、交换 IOp、Guess 或额外输入段。

例如，使用 DMSO 的静态介电常数 46.71、光学介电常数 2.1874：

```bash
banedftw --mode svgt --template template.gjf --gaussian g16 \
  --epsilon 46.71 --epsilon-inf 2.1874
```

`epsilon` 控制静态响应，`epsilon-inf` 控制快速电子响应，须满足 `1 <= epsilon-inf <= epsilon`。也可用 `--solvent DiMethylSulfoxide` 查询溶剂表中的两项常数；显式给定的值分别覆盖对应表值。命令行中的介质选项整体替换设置文件中的介质选择。溶剂模型采用 Gaussian 默认的 IEFPCM，SCRF 中设置 `Read` 与 `NonEquilibrium=Save/Read`；空腔使用 Bondi 半径乘以 1.2，氢原始半径设为 1.1 Å。

拿到一个新体系后，程序按以下顺序完成搜索：

1. 在默认 0–0.6 Bohr⁻¹ 范围内，以 0.15 Bohr⁻¹ 为步长生成粗网格，包含两端，首轮候选为 0、0.15、0.30、0.45、0.60。
2. 对每个候选 ω，计算参考态，将平衡溶剂场信息保存到 `.chk` 文件；将含有参考态慢极化信息的同一份 `.chk` 文件分别复制给两个带电态，执行非平衡单点，得到该点的目标函数。
3. 找出粗网格中的各个局部低谷，在相邻粗网格点围成的区间内，以 0.02 Bohr⁻¹ 为步长细化；已计算的点直接复用。
4. 比较所有已求值点，输出目标函数最小点的 ω、α、β、介电常数及 Gaussian 原生参数。

ω=0 的端点使用相应的全局 PBE 混合泛函。搜索范围和网格间距可显式设置：

```bash
banedftw --mode svgt --epsilon 46.71 --epsilon-inf 2.1874 \
  --wlow 0 --whigh 0.6 --coarse-step 0.15 --fine-step 0.02 \
  --alpha 0.2 --maxit 100
```

ω 和步长的单位为 Bohr⁻¹，至多四位小数；`maxit` 限制不同参数点的求值数量，每点需要三个单点计算。SVγT 使用网格搜索，设置项为上下限和粗、细步长；`winit`、`wtol` 及 β 调谐选项不适用。设置文件中对应的键为 `mode=svgt`、`epsilon_inf`、`coarse_step`、`fine_step`，其余同命令行。

计算完成后，`optdftw.csv` 保存逐点能量与目标函数，`optdftw.report.json` 给出最佳参数、原生输入片段和最佳参考态 `.chk` 文件路径。复用泛函时同时使用 ω、α、β；报告中的 `native_parameters.keywords` 已包含方法名，配上相同基组，并保留 `native_parameters.extra_input` 中的介质设置与空行。

若继续计算最佳点的两个垂直带电过程，新建两个独立目录，将同一份最佳参考态 `.chk` 文件各复制为 `state.chk`。两份输入均写 `%chk=state.chk`，保持几何和基组，分别填写对应电荷及多重度，将原生关键词中的 `NonEquilibrium=Save` 改为 `NonEquilibrium=Read`。两个作业分别从各自复制的 `.chk` 文件中读取参考态慢极化信息，再求解自身的波函数与快速极化响应。

## 调谐目标

普通 ω 优化、扫描与 SVγT 使用参考体系和增加一个电子后体系的 HOMO，最小化两项残差的平方和：

$$
J^2=[\epsilon_{\mathrm{HOMO}}(N)+E(N-1)-E(N)]^2+[\epsilon_{\mathrm{HOMO}}(N+1)+E(N)-E(N+1)]^2.
$$

式中：N 是参考体系的电子数；E 是对应电子数体系的总能量；ε_HOMO 是最高占据轨道能量；J² 是优化所用的目标函数。三个体系采用相同几何，能量均以 Hartree 计，J² 的单位为 Hartree²。普通最优调谐的理论背景可参见 [Stein 等，PRL 105, 266802 (2010)](https://doi.org/10.1103/PhysRevLett.105.266802)；模板和设置文件用法也可参考 [Tian Lu 的 optDFTw](http://sobereva.com/346)。

SVγT 中，参考态能量来自平衡溶剂计算，两个相邻电子态的能量来自共用参考态慢极化场的非平衡计算。

SRSH 调谐则使用参考体系自身的 HOMO 和 LUMO：

$$
J^2=[\epsilon_{\mathrm{HOMO}}(N)+E(N-1)-E(N)]^2+[\epsilon_{\mathrm{LUMO}}(N)+E(N)-E(N+1)]^2.
$$

式中：ε_LUMO 是参考体系最低未占据轨道的能量，其余符号同上。气相搜索和 PCM 搜索分别使用各自环境中的三态能量与轨道值。程序同时输出两项残差绝对值之和 J；J² 并非这个 J 的平方。

## 配置与结果

程序可读取当前目录的 `settings.ini`，也可用 `--settings FILE` 指定其他文件；没有默认配置文件时使用内置默认值。命令行覆盖设置文件，位置参数最后应用。常用设置包括：

```ini
mode= omega
wlow= 0.05
whigh= 0.7
winit= auto
wtol= 0.0001
maxit= 100
```

相邻电子态的电荷由原生输入中的参考态自动加一、减一；默认多重度按单重态配双重态、双重态配单重态、更高多重度减一处理。需要其他自旋耦合时，可在设置文件中用 `N-1`、`N+1` 指定各态的电荷和多重度，也可用命令行的 `--N-1`、`--N+1`，例如 `--N+1 '-1 4'` 表示电荷 −1、多重度 4。相邻态电荷须与参考态的电子数关系一致，多重度应按实际体系选择；显式设置 `N` 时须与原生输入一致。

`maxit` 默认为 100，在普通优化和 SRSH 中限制每次参数搜索的迭代次数，在 SVγT 中限制不同参数点的求值数量；扫描不受它限制。原生模板可通过 `--template FILE` 指定。若需选择自旋通道，可用 `--spin-n`、`--spin-np1`，SRSH 另有 `--spin-lumo`；均接受 `auto`、`alpha` 或 `beta`。完整选项见 `banedftw --help`。

程序默认向当前工作目录的 `banedftw.log` 追加运行日志，记录 UTC 时间、配置与模板、搜索阶段、参数点、电子态、输入输出路径、进程退出码、结果验收和耗时，以及能量、轨道值、残差与 J/J²。日志逐行写入，计算中可查看：

```bash
tail -f banedftw.log
```

`--idetail 0` 只简化终端中的能量与轨道详情，日志仍保存完整数值。运行结束后，日志给出成功或失败及总耗时；即使原生目录在成功后被清理，运行总日志仍保留。重复运行会追加新的开始和结束记录。

普通优化与 SVγT 写入 `optdftw.csv`，扫描写入 `scandftw.csv`。CSV 包含实际 ω、J/J²、三态能量及所用 HOMO。SRSH 另有各轮气相与 PCM 搜索的 CSV。SRSH 与 SVγT 均将完整调谐记录写入 `optdftw.report.json`。

原生输入与日志保存在新建的 `optdftw-run-N` 目录中，按搜索、参数点和电荷态分目录。普通优化、扫描和 SRSH 成功后默认清理本次原生目录，`--keep` 可保留；SRSH 的各轮 CSV 会在清理前复制到当前目录。SVγT 始终保留原生文件与 `.chk` 文件。再次运行会覆盖同名汇总文件，比较不同设置时应使用不同工作目录。

查看结果时，应同时检查目标函数曲线、最佳点是否靠近搜索边界，以及三个电荷态的 SCF 解和自旋选择。SVγT 报告中的 `at_boundary=true` 表示最佳点位于搜索端点，可据此调整区间。SRSH 结果应同时复用 ω、交换比例和 PCM 介电常数。

运行失败时保留已完成的记录及原生日志，可据此检查失败的电荷态；部分记录不能当作完整调谐结果。使用 [BaneTask](/software/banetask/) 组织后续计算时，也可通过 `%action optdftw` 调谐并传递参数。

## 引用

如果使用本程序获得的结果用于论文或其他研究成果，建议同时引用本程序与 Tian Lu 的原始 optDFTw，并注明实际使用的程序版本或获取日期：

1. [banedftw](https://bane-dysta.top/software/banedftw/).
2. Tian Lu. [optDFTw program](http://sobereva.com/346).

如果使用了 `srsh-pcm` 模式进行 PCM 环境下的调谐，还请引用该方法的原始论文：

3. Bhandari, S.; Cheung, M. S.; Geva, E.; Kronik, L.; Dunietz, B. D. Fundamental Gaps of Condensed-Phase Organic Semiconductors from Single-Molecule Calculations using Polarization-Consistent Optimally Tuned Screened Range-Separated Hybrid Functionals. *J. Chem. Theory Comput.* **2018**, *14* (12), 6287–6294. [DOI: 10.1021/acs.jctc.8b00876](https://doi.org/10.1021/acs.jctc.8b00876).

使用 `svgt` 模式时，请引用其调谐方案与应用文献：

4. Ren, F.; Li, P.; Chen, X.; Dong, L.; Liu, F. Data-Driven Recommendation of Optimal Tuning Scheme for Range-Separated Hybrid Functionals in Solution-Phase UV/vis Absorption Energy Prediction. *J. Chem. Theory Comput.* **2025**. [DOI: 10.1021/acs.jctc.5c01044](https://doi.org/10.1021/acs.jctc.5c01044).

## Reference

- [优化长程校正泛函w参数的简便工具optDFTw](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=4100&fromuid=63020)
- [optDFTw: A program for tuning ω parameter of long-range corrected functionals](http://sobereva.com/soft/optDFTw/)
- [Fundamental Gaps of Condensed-Phase Organic Semiconductors from Single-Molecule Calculations using Polarization-Consistent Optimally Tuned Screened Range-Separated Hybrid Functionals](https://doi.org/10.1021/acs.jctc.8b00876)

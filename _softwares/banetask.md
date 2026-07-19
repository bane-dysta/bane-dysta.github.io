---
title: BaneTask
summary: 量子化学任务、执行与结果管理系统
---

Last Update: 2026/07/19

BaneTask 是一个用 **C++17** 编写的量子化学任务组织与结果管理工具。它使用单个文件描述计算步骤，把结构来源、程序输入、任务依赖、资源请求、前后处理、执行调度和结果整理放进同一套流程。

Gaussian、ORCA 等量子化学程序仍负责实际计算；BaneTask 负责把一个 case 或一批 case 从输入生成一路组织到查询、绘图和结项归档。

```text
结构文件 + .bt / .projbt
  -> banetask 展开任务并生成输入、命令和 .bwrk
  -> btrun 在本地或调度系统上执行 workflow
  -> btproc 提取规范结果并写入事实存储
  -> btdb / @derive / @plot 查询、计算、导表和出图
  -> btdb archive create 导出单文件 .btdb
```

{% include embed/bilibili.html id='BV1QJPpzkEMY' %}

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [下载与文档](#下载与文档)
- [BaneTask 能做什么](#banetask-能做什么)
- [快速开始](#快速开始)
  - [准备程序环境](#准备程序环境)
  - [编写任务文件](#编写任务文件)
  - [生成并运行](#生成并运行)
  - [查询与归档](#查询与归档)
- [任务描述能力](#任务描述能力)
  - [程序后端](#程序后端)
  - [依赖与条件](#依赖与条件)
  - [批量展开与模块复用](#批量展开与模块复用)
  - [前后处理命令](#前后处理命令)
- [执行与调度](#执行与调度)
- [结果、派生计算与绘图](#结果派生计算与绘图)
  - [结果存储](#结果存储)
  - [Derive 与 Plot](#derive-与-plot)
  - [单文件归档](#单文件归档)
- [命令行工具](#命令行工具)
- [配置目录](#配置目录)
- [从源码构建](#从源码构建)
- [项目与资源](#项目与资源)

<!-- /TOC -->

## 下载与文档

- **Linux 自解压安装包**：[banetask-Linux-x86_64-2.36.5.sh](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/release/banetask-Linux-x86_64-2.36.5.sh)
- **Windows 安装包**：[banetask_setup.exe](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/release/banetask_setup.exe)
- **完整手册**：[BaneTask_Project_Manual_zh.pdf](/assets/files/banetask/BaneTask_Project_Manual_zh.pdf)

发布包中的 `bin/` 与 `share/banelib/` 共同组成运行环境。移动或解压后应保留两者的相对目录关系，并把 `bin/` 加入 `PATH`。

```bash
export PATH=/path/to/banetask/bin:$PATH
banetask --version
btrun --version
```

## BaneTask 能做什么

- 用统一 DSL 描述任务块、结构来源、依赖关系、条件、资源和元数据。
- 生成多种量子化学程序的输入文件，并在同一流程中串联不同程序。
- 为任务生成 `.bwrk` workflow，在本地文件队列、Slurm、SGE、PBS 或 SSH/rsync 远程 profile 上执行。
- 使用 `define:`、`matrix:`、结构化 YAML 集合和 `@foreach` 批量展开参数、结构和任务变体。
- 从计算输出提取带属性名、单位、序列轴和来源信息的规范结果。
- 使用 `@derive` 完成相对能、热力学组合、表格整理和逐原子数据处理。
- 使用 `%plot` / `@plot` 生成能垒、收敛、光谱、相关、热图、柱图、轨道能级和激发态能级等图。
- 把 current records、历史解析 revision、内容寻址对象、分析配方和显式发布结果封装为可校验的 `.btdb` 单文件。

BaneTask 更适合有连续依赖、批量结构、条件分支或长期结果管理需求的项目。只提交一个现成输入文件时，也可以直接使用 `btrun task`，不必先写 `.bt`。

## 快速开始

下面的例子先用 Gaussian 优化甲烷并计算频率，再在没有虚频时使用 ORCA 做单点计算。

目录结构：

```text
methane/
  methane.xyz
  methane.bt
```

`methane.xyz`：

```xyz
5
methane
C      0.000000    0.000000    0.000000
H      0.629118    0.629118    0.629118
H     -0.629118   -0.629118    0.629118
H     -0.629118    0.629118   -0.629118
H      0.629118   -0.629118   -0.629118
```

### 准备程序环境

程序运行方式由 `<type>.conf` 描述。建议把配置放在 `~/.bane/task/envs/`。下面是一个最小的 `g16.conf`：

```conf
[main]
DESCRIPTION=Gaussian 16
SUFFIX=gjf
OUTPUT_SUFFIX=log
CONF_CORES=16
CONF_MEMORY=64000

[ENV_SETUP]
source "$HOME/apprepo/gaussian/16/env.sh"

[RUN_CMD_TEMPLATE]
g16 "${ACTUAL_INPUT_FILE}" > "${ACTUAL_OUTPUT_FILE}"
```

ORCA、GAMESS、AMESP、xTB 等程序使用同样的分节格式。`[main]` 保存标量配置；`[ENV_SETUP]`、`[RUN_CMD_TEMPLATE]` 和自定义区块直接保存多行脚本。

### 编写任务文件

`methane.bt`：

```bt
autorun: false
project: methane-demo

define:
  method: B3LYP
  basis: 6-31G(d)

$opt
  %source origin
  %program gaussian
  %control
    totcore 16
    totmem 64000
  %keywords "opt freq [method]/[basis]"

$sp
  %source opt
  %program orca
  %control
    totcore 32
    totmem 96000
  %when
    completed opt
    {{ opt.nimag }} = 0
  %keywords "wB97M-V def2-TZVP def2/J RIJCOSX TightSCF"

@derive summary
  let E = energy(sp)
  emit final_energy = E
@end
```

`%source opt` 同时声明了几何来源和上游依赖。`%when` 读取上游完成状态与结果快照；条件满足后，`sp` 才进入生成计划。

### 生成并运行

生成输入文件、`pre_comd`、`comd` 和 `.bwrk`：

```bash
banetask methane/methane.bt
```

在本地文件队列中运行：

```bash
btrun kick --backend local --path ./methane
```

`btrun kick` 也会在可用时先调用 `banetask`，因此日常使用可以直接从项目目录启动：

```bash
btrun kick --path ./methane
```

检查调度脚本而不提交：

```bash
btrun render --path ./methane --explain
```

### 查询与归档

同步并查询结果：

```bash
btdb case sync --path ./methane
btdb case query --path ./methane \
  --sql "SELECT task_name, energy, nimag FROM task_flat_latest"
```

结项时导出并校验单文件归档：

```bash
btdb case archive create \
  --path ./methane \
  --out methane.btdb

btdb archive verify methane.btdb
```

## 任务描述能力

### 程序后端

`%program` 决定输入生成方式和相关字段的解释规则。

| 类型 | 主要输入字段 | 生成内容 |
| --- | --- | --- |
| `gaussian` | `%keywords`、`%extrainput` | `*.gjf` |
| `orca` | `%keywords`、`%extrainput` | `*.inp` |
| `gamess` | `%keywords`、`%extrainput` | `*.inp` |
| `amesp` | `%keywords`、`%extrainput` | `*.aip` |
| `mopac` | `%keywords`、`%extrainput` | `*.mop` |
| `bdf` | `%keywords`、`%extrainput` | `*.inp` |
| `fcclasses` | 结构化 `%source`、`%keywords`、`%extrainput` | 作业计划、独立目录与启动器 |
| `mrcc` | `%keywords`、`%extrainput` | `*.inp` |
| `maple` | `%keywords`、`%extrainput` | `*.inp` |
| `xtb` | `%args`、`%extrainput` | `*.xyz` 与可选 `.xcontrol` |
| `script` | `%runner`、`%body` | `*.sh` 或 `*.bat` |
| `other` | `%template`、`%param` | 由模板定义的任意输入 |

未写 `%program` 时默认使用 `gaussian`。各程序可查询的结果属性取决于相应的 BaneLib 输入与结果后端；部分后端以输入生成和 workflow 为主。

### 依赖与条件

`%source` 可以引用原始结构、上游任务、显式结构文件或重启工件：

```bt
%source origin
%source opt
%source xyz=reactant.xyz
%source restart
```

需要多个上游资源时，可以使用逗号依赖或结构化 `%source`。`%when` 支持：

- `defined [NAME]`：检查变量是否存在；
- `completed <task>`：检查任务是否完成；
- `completed allothers`：等待同一流程的其他有效任务；
- `{{ task.property }}`：读取能量、虚频、收敛状态等结果快照。

条件读取的是任务结果，不需要在 shell 中自行扫描日志或轮询目录。

### 批量展开与模块复用

`define:` 保存可复用变量，`matrix:` 对参数做组合展开：

```yaml
define:
  basis: def2-TZVP

matrix:
  method: B3LYP, CAM-B3LYP, wB97XD
  solvent: water, dmso
```

展开后的任务保留模板任务名和 `matrix.*` 元数据，方便数据库筛选与横向比较。更大的流程可以使用：

- `&INCLUDE`：并入任务文件、局部片段或 `.btlib` 命名片段；
- `@foreach` / `@foreach?`：按 YAML 集合或结构帧生成任务；
- `btool expand`：查看 include、foreach 和 matrix 展开后的规范任务文件；
- `btool fmt` / `btool migrate`：格式化或迁移到规范 DSL v2。

### 前后处理命令

`%preprocess` 与 `%process` 会生成任务目录中的 `pre_comd` 和 `comd`。内建命令包括：

- `run`：运行脚本目录中的命令；
- `mwfn` / `multiwfn`、`banewfn`：执行波函数分析配方；
- `publish`：复制人工结果到 `Results/`，`--pin` 可把结果纳入结项归档；
- `cp`、`mv`、`mkdir`、`snapshot`、`mass`：处理任务文件和目录；
- `result`、`dbcollect`、`atomvec`：补充任务结果与逐原子数据；
- `benv`、`fork`：加载环境或采集结构。

不匹配内建 DSL 的行会作为原样 shell 命令写入。项目也可以通过 manifest 扩展自定义 Process DSL 命令。

## 执行与调度

每个输入文件对应一个 `.bwrk` workflow，其中包含资源请求、环境初始化、前处理、主命令、返回码处理和后处理。`btrun` 负责选择执行目标并消费这些 workflow。

支持的执行方式：

- 本地文件队列；
- Slurm；
- SGE；
- PBS；
- 使用 SSH/rsync 的远程 execution profile。

常用命令：

```bash
# 生成并提交目录中的 workflow
btrun kick --path ./project

# 提交已有 .bwrk
btrun submit --path ./project

# 只渲染调度脚本
btrun render --path ./project --explain

# 不写 .bt，直接提交已有程序输入
btrun task -t orca mol1.inp mol2.inp

# 查看本地队列
btrun queue status
btrun queue list
```

execution profile、queue catalog 和 routing policy 用 YAML 描述。自动选择会综合 backend、profile、队列、核心数、内存、GPU 和优先级；`--explain` 可显示候选目标及拒绝原因。

## 结果、派生计算与绘图

### 结果存储

任务结果分成事实源、可重建缓存、运行状态和人工结果视图：

```text
.bane/
  store/
    records/                 # current records
    revisions/               # 历史解析 revision
    objects/sha256/          # 内容寻址工件
  cache/
    snapshots/               # 条件判断使用的集中快照
    project.db               # 可删除重建的 SQLite 查询缓存
  run/
    db-queue/                # 待同步标记

Results/
  Recipes/                   # 实际使用的分析、Derive 与 Plot 配方
  Derived/                   # 派生标量和表格
  Plots/                     # 图、数据、渲染脚本和 manifest
  Method/                    # 方法学 Markdown / JSON
  FCclasses/                 # 速率与量子产率汇总
  published.json             # publish --pin 的显式选择清单
```

`.bane/store/` 保存长期事实；`.bane/cache/project.db` 是查询索引，可以由 `btdb sync` / `rebuild` 重新生成。`Results/` 面向下载、检查和交流，不承担数据库事实源职责。

### Derive 与 Plot

`@derive` 可以从任务结果计算标量、生成表格、筛选与排序记录、连接逐原子属性，并输出 CSV、TSV、JSONL、KV、XYZ 或 extxyz。内建函数覆盖规范能量选择、单位换算、CBS 外推、热力学组合、谐振零点能和 RRHO 等常见任务。

```bt
@derive activation
  let G_r = single_point(sp_R) + gibbs_corr(freq_R)
  let G_ts = single_point(sp_TS) + gibbs_corr(freq_TS)
  require nimag(freq_R) == 0
  require nimag(freq_TS) == 1
  emit delta_g = convert(G_ts - G_r, "kcal/mol")
@end
```

`%plot` / `@plot` 使用同一套规范属性与单位系统。图的实际数据、规范声明、渲染脚本、fingerprint 和 manifest 会一并保存，因此结果可以追溯、检查和重画。

单独处理分析脚本时，可以直接运行：

```bash
banetask analysis.btder
banetask figure.btplt --rerender-plots
```

### 单文件归档

`.btdb` 是不可变的导出、迁移和长期保存容器。默认封存：

- current records 与历史 revisions；
- records/revisions 实际引用的 SHA-256 对象；
- `Results/Recipes/`；
- `Results/published.json` 显式选择的普通结果；
- 可用的顶层 `.bt` / `.projbt` 上下文。

SQLite、snapshot、queue 和 scheduler 状态不进入归档。恢复时由事实源重建数据库：

```bash
btdb archive restore project.btdb --out ./restored_project
```

归档使用 ZIP64 store 容器，并通过 manifest、CRC、字节数、SHA-256、对象引用和路径规则检查完整性。SHA-256 用于检测损坏或改动，不提供作者身份认证。

## 命令行工具

| 工具 | 职责 | 常用入口 |
| --- | --- | --- |
| `banetask` | 解析 `.bt` / `.projbt`，生成输入与 workflow，执行 Derive / Plot | `banetask case.bt` |
| `btrun` | 提交、渲染和执行 `.bwrk`，管理本地或远程调度 | `btrun kick --path ./project` |
| `btdb` | 同步、查询、报告、比较、校验和 `.btdb` 归档 | `btdb project sync --path ./project` |
| `btool` | 模板、project 维护、改名、格式化、展开、解释和静态检查 | `btool lint --strict ./cases` |
| `btc` | 从 `.btc` 模板初始化单 case 或多 case project | `btc template.btc *.xyz` |
| `btproc` | 结果提取、方法学说明、结构采集和逐原子处理等运行期任务 | `btproc result ...` |
| `var` | 读取和写入 YAML / `.bt` 变量 | `var read define:method --file case.bt` |

查看完整帮助：

```bash
banetask --help
btrun --help
btrun help conf
btdb --help
btool --help
btc --help
```

## 配置目录

推荐的用户级目录：

```text
~/.bane/task/
  banetask.conf
  envs/                  # <type>.conf
  bt_templates/          # .bt 与变量模板
  btlib/                 # 可复用片段库
  other_templates/       # %program other 输入模板
  scripts/               # Process DSL 脚本
  multiwfn_templates/
  banewfn/
  external/
  btrun/
    profiles/
    queues/
    routes/

~/.bane/taskq/
  pending/
  running/
  done/
  failed/
  cancelled/
  logs/
```

`banetask.conf` 使用 `KEY=value`。环境变量覆盖配置文件，同类查找路径支持路径列表：POSIX 使用 `:`，Windows 使用 `;`。

常用配置项：

- `BANETASK_ENVCONF_PATH`：程序环境配置目录；
- `BANETASK_TEMPLATE_PATH`：任务与变量模板目录；
- `BANETASK_BTLIB_PATH`：共享 `.btlib` 与片段目录；
- `BANETASK_OTHER_TEMPLATES_PATH`：`other` 输入模板目录；
- `BANETASK_SCRIPTS_PATH`：Process DSL 脚本目录；
- `BANETASK_WFN_EXAMPLES_PATH`、`BANETASK_BANEWFN_PATH`：波函数分析模板目录；
- `BANETASK_GNUPLOT`：gnuplot 可执行文件；
- `BTRUN_PROFILE_DIR`：execution profile 目录；
- `BTRUN_QUEUE_DIR`：本地文件队列目录。

完整查找顺序、环境变量和 profile 格式见项目手册。

## 从源码构建

BaneTask 依赖 BaneLib。`BANETASK_BANELIB_ROOT` 可以指向 BaneLib 的源码树、构建树或安装树。

```bash
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DBANETASK_BANELIB_ROOT=/path/to/banelib

cmake --build build -j
cmake --install build --prefix /your/prefix
```

主要依赖：

- CMake 3.10 或更新版本；
- C++17 编译器；
- BaneLib 的 `bane::core`、`bane::chem`、`bane::input`、`bane::qc`、`bane::structure` targets；
- Threads、JsonCpp 和 SQLite。

安装完成后，确认 `<prefix>/bin/` 与 `<prefix>/share/banelib/` 同时存在。

## 项目与资源

- **网站介绍文章**：[BaneTask：把量子化学项目从任务生成一路管到结果分析](/posts/54/)
- **VS Code 高亮插件**：[bt-highlight.vsix](/assets/files/banetask/bt-highlight.vsix)
- **用户手册**：[BaneTask_Project_Manual_zh.pdf](/assets/files/banetask/BaneTask_Project_Manual_zh.pdf)

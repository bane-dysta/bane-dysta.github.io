---
title: BaneTask 
summary: 量子化学任务控制系统
---

Last Update: 2026/03/04

BaneTask 是一个用 **C++17** 编写的量子化学任务控制/工作流生成工具。本程序的目标不是像agent一样替你算，而是按照你的要求把你从**输入文件批量生成、任务依赖串联、前后处理脚本拼装、结果落盘整理**这些重复工作里解放出来：你只需要写一个相对简洁的 `.bt` 文本文件描述流程，BaneTask 会在目录中生成对应的工作流脚本文件。

核心理念很简单：

- 用 **任务块**（`$taskname`）表达计算步骤，用 `%source` 表达依赖关系。
- 用 `define:` 在文件头定义变量，后续用 `[变量名]` 做替换。
- 把“跑前准备/跑后处理”写到 `%preprocess / %process`，自动落到每个任务目录的 `pre_comd / comd`。

{% include embed/bilibili.html id='BV1QJPpzkEMY' %}

项目地址：

- **GitHub**: https://github.com/bane-dysta/banetask
- **Gitee**: https://gitee.com/bane-dysta/banetask2

(重构中，丑比代码就先不公开了，重构之后再放开)

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [安装与快速开始](#安装与快速开始)
- [配置与目录结构](#配置与目录结构)
  - [banetask.conf 的查找规则与优先级](#banetaskconf-的查找规则与优先级)
- [配置](#配置)
  - [量子化学程序环境](#量子化学程序环境)
  - [Windows 与 Shell 选择](#windows-与-shell-选择)
- [bt 任务文件](#bt-任务文件)
  - [文件头：元信息、define、include](#文件头元信息defineinclude)
  - [任务块：依赖、输入生成与控制](#任务块依赖输入生成与控制)
  - [前后处理脚本：pre_comd 与 comd](#前后处理脚本pre_comd-与-comd)
  - [归档（开发中）](#归档开发中)
- [运行产物与目录约定](#运行产物与目录约定)
- [命令行工具](#命令行工具)
  - [banetask 主程序](#banetask-主程序)
  - [btask 辅助工具](#btask-辅助工具)
- [示例](#示例)

<!-- /TOC -->

## 安装与快速开始

Release:

- Linux: [下载installer](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/release/banetask-Linux-x86_64-1.0.sh)
- Windows: [下载installer](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/release/banetask_setup.exe)

把发布的可执行文件（或你自己编译出来的 `banetask` / `btask`）加入 `PATH`：

```bash
export PATH=/path/to/banetask/bin:$PATH
```

帮助：

```bash
banetask --help
```

它会打印当前读取到的配置文件路径、各环境变量当前值，以及默认的配置搜索路径。

> BaneTask 本身只负责生成工作流脚本，不强绑定具体队列系统。你可以用banetask提供的调度器`run.sh`，也可以自己按需求编写任务调度器，或是直接进入任务目录手动执行其中的命令。

## 配置与目录结构

### banetask.conf 的查找规则与优先级

BaneTask 会按以下顺序查找 `banetask.conf`：

1. 当前目录（`.`）
2. `banetask` 可执行文件所在目录
3. `~/.banetask/`
4. `/etc/banetask/`

同一个配置项的优先级固定为：

**环境变量 > 配置文件 > 内置默认值**。

因此你可以把“常用默认值”写在 `~/.banetask/banetask.conf`，而在 CI/集群节点上用环境变量做覆盖。

## 配置

建议把所有可移植、可复用的资源集中到 `~/.banetask/`（Windows 下对应 `%USERPROFILE%\.banetask\`），典型结构如下：

```text
~/.banetask/
  banetask.conf
  envs/                 # 各程序运行环境配置（*.conf）
  bt_templates/         # btask 用的 .bt 模板
  other_templates/      # %program other 用的输入模板
  scripts/              # 可选：供 scripts/autorun 使用的脚本集合
  wfn_examples/         # 可选：multiwfn 模板/输入流示例
  external/             # 可选：env.sh / env.bat 之类的统一环境初始化
  banewfn/              # 可选：banewfn 子系统脚本（如你需要）
```

`banetask.conf` 是一个简单的 `KEY=VALUE` 文件。你不需要把所有变量都写满；只要写你需要覆盖的项即可。下面是与源码行为一致的“路径类变量”含义说明（括号内是默认值或典型用法）：

- `BANETASK_TASK_PATH`：当你 **不带参数运行** `banetask` 时，用它作为“任务搜索根目录”（默认 `.`）。
- `BANETASK_LOG_PATH`：banetask 自己的日志输出目录（默认 `.`；通常你可以设置成与 `BANETASK_TASK_PATH` 相同）。
- `BANETASK_ENVCONF_PATH`：程序环境配置目录（默认 `~/.banetask/envs`）。
- `BANETASK_TEMPLATE_PATH`：`btask` 的模板目录（建议指向 `~/.banetask/bt_templates`；若不设置，`btask` 会尝试使用 `./conf/bt_templates`）。
- `BANETASK_OTHER_TEMPLATES_PATH`：`%program other` 的输入模板目录（默认 `~/.banetask/other_templates`）。

下面这些是“可选能力”才会用到的路径（不配置也不影响基础工作流生成）：

- `BANETASK_SCRIPTS_PATH`：后处理指令中的 `scripts ...`、以及 `autorun: true` 时的 `run.sh/run.bat` 所在目录（默认 `~/.banetask/scripts`）。
- `BANETASK_EXTERNAL_SCRIPTS_PATH`：生成的 `pre_comd/comd` 会优先尝试加载这里的 `env.sh`（bash）或 `env.bat/env.cmd`（cmd）做统一环境初始化（默认 `~/.banetask/external`）。
- `BANETASK_WFN_EXAMPLES_PATH`：`multiwfn` 指令使用的模板/输入流目录（默认 `~/.banetask/wfn_examples`）。
- `BANETASK_BANEWFN_PATH`：`banewfn` 指令用到的脚本目录（无默认值；你需要时再配）。

另外还有一个与依赖判定相关的开关：

- `IF_WAIT_FREQ`：依赖任务完成性检查时的策略开关（布尔值，默认行为以源码为准）。如果你遇到“日志很大/频率输出很靠前导致尾部检测不稳”的情况，可以通过它调整检查方式。

### 量子化学程序环境

`BANETASK_ENVCONF_PATH` 目录下的 `*.conf` 用于告诉 BaneTask：

- 这个程序的**输入文件后缀**是什么（用来在任务目录里找到要跑的输入）。
- 跑之前需要怎样 **ENV_SETUP**（加载模块、设置环境变量等）。
- 真正执行计算时要用怎样的 **RUN_CMD_TEMPLATE**。

源码要求每个环境配置文件至少包含三项：

- `SUFFIX`：输入文件后缀（不带点），例如 `gjf` / `inp` / `sh`。
- `ENV_SETUP`：执行前的环境准备命令。
- `RUN_CMD_TEMPLATE`：实际执行命令模板。

并且支持以下模板变量（由 BaneTask 在生成 `.bwrk` 时替换）：

- `${ACTUAL_INPUT_FILE}`：本段工作流实际要跑的输入文件名（例如 `opt_methane.gjf`）。
- `${ACTUAL_OUTPUT_FILE}`：本段工作流的输出文件名（默认与输入同名换后缀，通常是 `.log`；可用 `OUTPUT_SUFFIX` 配置）。
- `${CORES}`：本段工作流使用的核数。

配置文件是 `KEY=VALUE` 形式，同时支持用**单引号包裹多行值**（常用于 `ENV_SETUP`）：

```conf
# g16.conf（示例）
CONF_CORES=32
CONF_MEMORY=96000
SUFFIX=gjf
OUTPUT_SUFFIX=log

ENV_SETUP='source "$HOME/apprepo/gaussian/16-hy/scripts/env.sh"
export GAUSS_SCRDIR="$HOME/scratch"'

# 这里给出一个“可移植”的写法：显式把输出导向 ${ACTUAL_OUTPUT_FILE}
RUN_CMD_TEMPLATE='g16 "${ACTUAL_INPUT_FILE}" > "${ACTUAL_OUTPUT_FILE}"'
```

约定的文件名：

- Gaussian：优先找 `g16.conf`，找不到再找 `gaussian.conf`
- ORCA：`orca.conf`
- Script：`script.conf`
- Other：由  `prog` 字段决定，例如 `xtb.conf`

> 如果你希望在 Windows/cmd 下使用这些配置，`ENV_SETUP` 和 `RUN_CMD_TEMPLATE` 里就应该写 **cmd 语法**（例如 `call xxx.bat`、`set VAR=...`）。BaneTask 不会自动把 bash 命令翻译成 cmd。

### Windows 与 Shell 选择

为了让同一套 `.bt` 在 Linux/macOS（bash）与 Windows（cmd）都能工作，源码里引入了“脚本输出 shell”选择：

- 非 Windows 平台默认输出 **bash** 风格脚本。
- Windows 平台默认输出 **cmd** 风格脚本。

你可以用配置/环境变量强制切换（留给未来 Git Bash 兼容）：

- `BANETASK_SHELL`：可设为 `bash` / `sh` / `gitbash` 或 `cmd` / `bat` / `powershell`（会按类别归入 bash 或 cmd）。
- `USE_GITBASH=true`：在 Windows 上强制使用 bash 输出（优先级高于默认）。
- `BANETASK_CMD_ENABLE_DIRECTIVES=true`：仅在 cmd 模式下有意义。默认 cmd 模式会把 `%preprocess/%process` 里的每一行都当作“原始命令行”写入脚本，不再解析 `copy/scripts/result...` 这类内置指令；打开该开关后才会启用这些指令解析。

`autorun: true` 的行为也会随 shell 变化：

- bash 模式下尝试调用 `BANETASK_SCRIPTS_PATH/run.sh`
- cmd 模式下尝试调用 `BANETASK_SCRIPTS_PATH/run.bat`

> 归档链路（`banejs --archive/--soc`）在 Windows/cmd 模式下默认不会写入 `comd`，以避免生成无效命令。

## bt 任务文件

### 文件头：元信息、define、include

一个 `.bt` 文件由两部分组成：

1. 文件头（YAML-like）：用于写元信息与 `define:` 变量。
2. 若干任务块（`$taskname`）：每个块描述一个步骤。

文件头示例：

```yaml
autorun: true

define:
  func: B3LYP
  basis: 6-31G(d)
  solvent: water
```

- `define:` 下的键值会以 `[func]`、`[basis]` 的形式在后续内容中替换。
- `autorun: true` 会让 BaneTask 在生成 `comd` 时额外追加一条 `run.sh/run.bat --path ..`（若该脚本存在）。

源码还支持两种“拆分/复用”的 include 机制，适合把私人配置与公共模板分离：

- `#INCLUDE path/to/file.yaml`：只能出现在文件头区域，用来把额外的 header/define 合并进来。
- `&INCLUDE path/to/file.bt`：出现在任务区，用来把另一份 `.bt/.projbt` 里的任务块并入当前文件。

此外，如果 `.bt` 所在目录里存在以下文件，会被自动加载：

- `extra.yaml`：在解析完当前 `.bt` 文件头后追加解析（常用来放“这个目录特有的 define”）。
- `extra.bt`：在解析完当前 `.bt` 任务块后追加解析（常用来放“这个目录特有的额外任务块”）。

### 任务块：依赖、输入生成与控制

每个任务块以 `$任务名` 开头，例如 `$opt`、`$sp`。任务名会用于创建输出目录（例如 `opt/`、`sp/`），也会参与生成输入文件名。

任务块中常用的指令如下：

**1）`%program`：程序类型**

- `gaussian`（默认）
- `orca`
- `other`：走“模板驱动”的其他程序接口（由模板与 `.other_task` 决定）
- `script`：生成一个可执行脚本（`.sh`）作为“输入文件”，并由 `script.conf` 定义如何运行

**2）`%source`：结构来源与依赖**

`%source` 同时决定“从哪里取几何结构”和“依赖哪些前置任务完成”。支持：

- `origin`：使用与 `.bt` 同名（或可推断同名）的原始结构文件（`.xyz/.gjf/.com/.log`）。
- `任务名`：从 `任务名/` 目录下提取输出结构（默认从 `任务名_[originname].log` 提取）。
- `任务名 guess`：Gaussian 专用。除提取结构外，还会写入 `%oldchk` 并启用 `guess=read`。
- `restart`：从当前任务的旧 `.log` 中提取结构并“重启”；旧结果会被移动到 `fail/` 目录以避免覆盖。
- `xyz=文件名`：从指定的 `文件名.xyz` 读取结构（默认在 `.bt` 所在目录下找）。
- 多依赖：用逗号分隔，例如 `opt,N+1,N-1`。其中**第一个依赖**用于取结构/guess，其余依赖只用于“完成性检查”。

**3）`%control`：资源与条件控制**

- `totcore 32` / `totmem 96000`：覆盖该任务块的资源（也会反映到 `.bwrk` 的 YAML 头）。
- `runifdef [SOMEVAR]`：条件任务块。如果替换后仍然包含 `[` `]`（通常表示变量未定义），该任务块会被跳过。
- `verbosity p|t`：Gaussian 路由行用 `#p` / `#t`（默认 `#`）。

**4）`%keywords` 与 `%extrakeywords`：输入内容**

- `%keywords`：主关键词。Gaussian 会自动补 `#` 前缀，ORCA 会自动补 `!` 前缀。
- `%extrakeywords`：附加块，以 `end exkwd` 结束。用途取决于程序：
  - Gaussian：写在坐标之后（例如额外的输入段）。
  - ORCA：写在关键词行之后（例如 `%tddft` 等块）。
  - Script：作为脚本正文；`%keywords` 则用于 shebang（例如 `/bin/bash`）。

源码支持在 `%keywords` 中使用 `{a,b,c}` 做“关键词集合展开”，会生成多份输入文件并分别生成 `.bwrk`。注意：展开项会被用作文件名前缀的一部分。

**5）`%mod`：电荷与自旋修正**

可对 `charge` / `spin` 做赋值或加减，例如：

```text
%mod
  charge add 1
  spin set 1
```

### 前后处理脚本：pre_comd 与 comd

`%preprocess` 与 `%process` 并不会在生成阶段执行，而是写入任务目录下的两段脚本：

- `pre_comd`：在主程序运行前执行
- `comd`：在主程序运行后执行

脚本里支持四个内置占位符（生成脚本时替换）：

- `[taskname]`：任务名（`$...` 的名字）
- `[originname]`：原始结构名（通常是 `.bt` 的基名）
- `[inputname]`：默认是 `[taskname]_[originname]`
- `[rootname]`：`.bt` 所在目录名（常用来保持跨目录一致命名）

在 **bash 模式** 下，BaneTask 还提供了一些“内置指令”用于简化后处理书写（你可以把它们理解为宏/快捷命令）：

- `scripts ...`：调用 `BANETASK_SCRIPTS_PATH` 下的脚本
- `copy ...`：文件复制快捷写法（会展开成 `cp -r`）
- `result / results ...`：把指定产物收集到 `../Results/[inputname]/`
- `multiwfn ...` / `banewfn ...` / `analysis ...` / `benv ...`：与个人工具链联动的快捷入口

在 **cmd 模式（Windows 默认）** 下，为避免与 Windows 内置命令（例如 `copy`）冲突，源码默认不解析上述内置指令，而是把每一行都当作原始命令写入脚本。你只要在 `%preprocess/%process` 中写正常的 `.bat`/cmd 命令即可。

如果你确实希望在 cmd 模式下也启用这些内置指令解析，可以设置 `BANETASK_CMD_ENABLE_DIRECTIVES=true`，但这通常意味着你要准备一套对应的 `.bat` 脚本体系或直接切到 Git Bash。

### 归档（开发中）

当任务块包含 `%archive` 时，BaneTask 会在任务目录生成 `任务名_archive.json`，用于把“任务元信息 + 归档诉求”传递给外部归档工具（例如 `banejs`）。

示例：

```text
%archive
  strucid 00123
  properties {freq,tddft,log_file,fchk_file}
```

源码还会根据关键词做一些自动补全：

- 关键词包含 `freq` 会自动加入 `freq`
- 关键词匹配 TD-DFT（`td`/`td=`/`td(` 等）会自动加入 `tddft`
- Gaussian 任务默认会加入 `log_file` 与 `fchk_file`

> 是否以及如何执行真正的归档，是你自己的工具链决定的；BaneTask 只负责生成 JSON，并在 bash 模式下可选把 `banejs` 命令写入 `comd`。

## 运行产物与目录约定

假设你的 `.bt` 文件位于某个分子目录（例如 `methane/methane.bt`），BaneTask 的约定是：

- 在 `.bt` 同级目录下，为每个任务块创建一个子目录：`opt/`、`sp/`……
- 在任务目录中生成输入文件、对应的 `.bwrk`、以及 `pre_comd/comd`。

常见文件如下：

- `opt/opt_methane.gjf`、`opt/opt_methane.chk`：Gaussian 输入与 chk（是否包含 nproc/mem 取决于 `%control`）
- `sp/sp_methane.inp`：ORCA 输入
- `*/pre_comd`、`*/comd`：前后处理脚本（shell 由 `BANETASK_SHELL/USE_GITBASH` 决定）
- `*.bwrk`：工作流文件（每个输入文件一个 `.bwrk`）
- `bt.status`：位于 `.bt` 所在目录，用于记录哪些任务块已生成过工作流（用于跳过重复生成）

如果你只想刷新 `pre_comd/comd`（以及归档 JSON），而不希望改动/新增 `.bwrk`，可以使用：

```bash
banetask your.bt --comd-only
```

该模式不会修改 `bt.status`。

## 命令行工具

### banetask 主程序

常用方式：

- `banetask your.bt`：解析 `.bt`，按依赖关系生成输入、脚本与 `.bwrk`。
- `banetask your.bt --comd-only`：只重新生成/覆盖 `pre_comd / comd`（以及归档 JSON），不生成新的 `.bwrk`，也不会改写 `bt.status`。

一些辅助选项（以 `--help` 输出为准）：

- `-d, --debug`：打开更详细的日志
- `-l, --log <path>`：指定日志文件输出路径

另外，如果你 **不提供 task file path**，`banetask` 会在 `BANETASK_TASK_PATH` 下递归搜索 `.bt` 并逐个处理（适合批处理目录）。

### btask 辅助工具

`btask` 是配套的模板/批处理工具，主要用于生成/合并 `.bt` 模板、重置状态、以及（可选）项目化批处理：

- `btask -t`：创建测试文件夹和示例文件
- `btask -r`：删除当前目录及子目录下的所有 `bt.status`
- `btask -l`：列出可用模板
- `btask -i`：交互式选择模板并生成 `.bt`
- `btask -m opt freq -o task.bt`：合并模板并输出

## 示例

下面给一个“Gaussian 优化 + ORCA 单点 + 简单后处理”的示例：

```text
autorun: false

define:
  func: B3LYP
  basis: 6-31G(d)

$opt
  %source origin
  %program gaussian
  %control
    totcore 16
    totmem 64000
  %keywords "opt freq [func]/[basis]"
  %process
    echo "OPT finished: [inputname]" 

$sp
  %source opt
  %program orca
  %control
    totcore 32
    totmem 96000
  %keywords "wB97M-V def2-TZVP def2/J RIJCOSX TightSCF"
  %process
    echo "SP finished: [inputname]"
```

如果你希望在 Windows/cmd 下使用，上面的 `%process` 直接写 cmd 命令同样可行；真正需要注意的是 `envs/*.conf` 里的 `ENV_SETUP`/`RUN_CMD_TEMPLATE` 也要写成 cmd 语法，或者把 `BANETASK_SHELL` 切到 `bash` 并在 Git Bash 中执行。

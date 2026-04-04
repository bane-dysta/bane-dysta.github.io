---
title: BaneTask
summary: 量子化学任务控制系统
---

Last Update: 2026/03/20

BaneTask 是一个用 **C++17** 编写的量子化学任务控制 / 工作流生成工具。它不替你直接算，而是把你从**输入文件批量生成、任务依赖串联、前后处理脚本拼装、结果快照与归档整理**这些重复劳动里解放出来：你只需要写一个相对简洁的 `.bt` 文本文件描述流程，BaneTask 会在目录中生成对应的输入文件、命令脚本与 workflow 文件。

- `gaussian` / `orca` / `script` / `other` 四类任务
- `runif` 条件生成
- `.bane.result.kv` 结果快照
- `banetask db` / `btask db` / `btask compare` 的 SQLite 派生库能力
- Windows `cmd` / `bat` 与 Linux `bash` 双栈脚本输出
- `.projbt` 项目模式与 Windows `btc` 快速入口

{% include embed/bilibili.html id='BV1QJPpzkEMY' %}

项目地址：

- **GitHub**: https://github.com/bane-dysta/banetask
- **Gitee**: https://gitee.com/bane-dysta/banetask2

> 文档里不再硬编码旧的安装包文件名。当前工程的打包方式是：Linux/Unix 生成 `TGZ` / `STGZ`，Windows 生成 `ZIP`；请以仓库 Release 页面中的实际产物为准。

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
  - [归档与结果快照](#归档与结果快照)
- [运行产物与目录约定](#运行产物与目录约定)
- [结果数据库与项目比较](#结果数据库与项目比较)
- [命令行工具](#命令行工具)
  - [banetask 主程序](#banetask-主程序)
  - [btask 辅助工具](#btask-辅助工具)
  - [btc（Windows 辅助入口）](#btcwindows-辅助入口)
- [示例](#示例)

<!-- /TOC -->

## 安装与快速开始

Release:

- Linux: [下载installer](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/release/banetask-Linux-x86_64-1.0.sh)
- Windows: [下载installer](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/release/banetask_setup.exe)

把发布的可执行文件加入 `PATH`：

```bash
export PATH=/path/to/banetask/bin:$PATH
```

帮助：

```bash
banetask --help
btask --help
```

> BaneTask 本身只负责生成输入与 workflow / command 脚本，不强绑定具体队列系统。你可以用自己的调度器，也可以把 `autorun: true` 配合 `BANETASK_SCRIPTS_PATH/run.sh` 或 `run.bat` 串起来用。

## 配置与目录结构

### banetask.conf 的查找规则与优先级

BaneTask 会按以下顺序查找 `banetask.conf`：

1. 当前目录（`.`）
2. `banetask` 可执行文件所在目录
3. `~/.banetask/`
4. `/etc/banetask/`

同一个配置项的优先级固定为：

**环境变量 > 配置文件 > 内置默认值**。

因此你可以把常用默认值写在 `~/.banetask/banetask.conf`，再在 CI / 集群节点上用环境变量做覆盖。

## 配置

建议把所有可移植、可复用的资源集中到 `~/.banetask/`（Windows 下对应 `%USERPROFILE%\.banetask\`），典型结构如下：

```text
~/.banetask/
  banetask.conf
  envs/                 # 各程序运行环境配置（*.conf）
  bt_templates/         # btask 用的 .bt 模板
  other_templates/      # %program other 用的输入模板
  scripts/              # run.sh / run.bat 及 scripts 指令入口
  multiwfn_templates/   # Multiwfn 输入流模板
  external/             # env.sh / env.bat / env.cmd 等外部环境初始化
  banewfn/              # 可选：banewfn 子系统模板 / 脚本
```

`banetask.conf` 是一个简单的 `KEY=VALUE` 文件。你不需要把所有变量都写满；只要写你需要覆盖的项即可。下面是与当前源码行为一致的说明：

- `BANETASK_TASK_PATH`：当你 **不带参数运行** `banetask` 时，用它作为任务搜索根目录（默认 `.`）。
- `BANETASK_LOG_PATH`：banetask 自己的日志输出目录（默认 `.`）。
- `BANETASK_ENVCONF_PATH`：程序环境配置目录（默认 `~/.banetask/envs`）。
- `BANETASK_TEMPLATE_PATH`：`btask` 模板目录（默认 `~/.banetask/bt_templates`）。
- `BANETASK_OTHER_TEMPLATES_PATH`：`%program other` 的输入模板目录（默认 `~/.banetask/other_templates`）。
- `BANETASK_SCRIPTS_PATH`：`scripts ...` 指令和 `autorun` 使用的 `run.sh` / `run.bat` 所在目录（默认 `~/.banetask/scripts`）。
- `BANETASK_EXTERNAL_SCRIPTS_PATH`：生成的 `pre_comd / comd` 会优先尝试加载这里的 `env.sh` / `env.bat` / `env.cmd`（默认 `~/.banetask/external`）。
- `BANETASK_WFN_EXAMPLES_PATH`：`multiwfn ...` 指令使用的模板目录（默认 `~/.banetask/multiwfn_templates`）。
- `BANETASK_BANEWFN_PATH`：`banewfn ...` 指令使用的模板 / 脚本目录（默认空）。
- `BANETASK_SHELL`：强制脚本输出 shell 类型，可取 `bash` / `sh` / `gitbash` 或 `cmd` / `bat` / `dos`。
- `USE_GITBASH=true`：在 Windows 上强制输出 bash 风格脚本。
- `BANETASK_CMD_ENABLE_DIRECTIVES=true`：在 cmd 模式下开启更多内置指令解析；默认关闭。
- `IF_WAIT_FREQ`：依赖完成性检查策略开关；不写时默认偏向看日志尾部，设为 `false` 时会退回全文件扫描。

### 量子化学程序环境

`BANETASK_ENVCONF_PATH` 目录下的 `*.conf` 用于告诉 BaneTask：

- 这个程序的输入文件后缀是什么；
- 跑前需要怎样 `ENV_SETUP`；
- 真正执行时要用怎样的 `RUN_CMD_TEMPLATE`。

源码要求每个环境配置文件至少包含：

- `SUFFIX`
- `ENV_SETUP`
- `RUN_CMD_TEMPLATE`

常用可选项：

- `CONF_CORES`
- `CONF_MEMORY`
- `OUTPUT_SUFFIX`

当前模板变量支持：

- `${ACTUAL_INPUT_FILE}`
- `${ACTUAL_OUTPUT_FILE}`
- `${ACTUAL_INPUT_FILENAME}`
- `${ACTUAL_OUTPUT_FILENAME}`
- `${ACTUAL_INPUT_STEM}`
- `${CORES}`

示例：

```conf
CONF_CORES=32
CONF_MEMORY=96000
SUFFIX=gjf
OUTPUT_SUFFIX=log

ENV_SETUP='source "$HOME/apprepo/gaussian/16-hy/scripts/env.sh"
export GAUSS_SCRDIR="$HOME/scratch"'

RUN_CMD_TEMPLATE='g16 "${ACTUAL_INPUT_FILE}" > "${ACTUAL_OUTPUT_FILE}"'
```

约定的配置文件名：

- Gaussian：优先找 `g16.conf`，找不到再找 `gaussian.conf`
- ORCA：`orca.conf`
- Script：`script.conf`
- Other：由 `.other_task` 中记录的程序名决定，例如 `xtb.conf`

### Windows 与 Shell 选择

为了让同一套 `.bt` 能在 Linux / macOS（bash）与 Windows（cmd）都能工作，源码里引入了脚本输出 shell 选择：

- 非 Windows 平台默认输出 **bash** 风格脚本
- Windows 平台默认输出 **cmd** 风格脚本

可用配置：

- `BANETASK_SHELL=bash` / `cmd`
- `USE_GITBASH=true`

`autorun: true` 的行为也随 shell 变化：

- bash 模式：尝试调用 `BANETASK_SCRIPTS_PATH/run.sh`
- cmd 模式：尝试调用 `BANETASK_SCRIPTS_PATH/run.bat`

在 **cmd 模式** 下，当前代码默认把大多数 `%preprocess` / `%process` 内容按原始命令行写入脚本，以避免和 Windows 内置命令冲突。`banewfn ...` 仍保留了内置适配；其余快捷指令若要展开，请显式打开：

```conf
BANETASK_CMD_ENABLE_DIRECTIVES=true
```

## bt 任务文件

### 文件头：元信息、define、include

一个 `.bt` 文件由两部分组成：

1. 文件头（YAML-like）：元信息与 `define:` 变量
2. 若干任务块（`$taskname`）

示例：

```yaml
autorun: true

#INCLUDE common.yaml

define:
  func: B3LYP
  basis: 6-31G(d)
```

当前解析器支持：

- `#INCLUDE path/to/file.yaml`：出现在头部，用于引入额外 metadata / define
- `&INCLUDE path/to/file.bt`：出现在任务区，用于并入另一份 `.bt` / `.projbt`

此外，如果 `.bt` 所在目录里存在以下文件，会被自动加载：

- `extra.yaml`：作为低优先级头部 / define 来源
- `extra.bt`：作为附加任务块并入当前文件

### 任务块：依赖、输入生成与控制

每个任务块以 `$任务名` 开头，例如 `$opt`、`$sp`。任务名会用于创建输出目录，也会参与生成输入文件名。

#### `%program`

- `gaussian`（默认）
- `orca`
- `other`
- `script`

#### `%source`

`%source` 同时决定“从哪里取结构”和“依赖哪些前置任务完成”。支持：

- `origin`
- `任务名`
- `任务名 guess`
- `restart`
- `xyz=文件名`
- 多依赖：用逗号分隔，例如 `opt,td,td_t1`

其中第一个依赖用于取结构，所有依赖都会参与完成性检查；多依赖时，`runif` 也需要显式写依赖名前缀。

#### `%control`

当前代码支持：

- `totcore 32`
- `totmem 96000`
- `runifdef [SOMEVAR]`
- `runif {{ nimag }} = 1`
- `verbosity p|t`

#### `%keywords` 与关键词展开

Gaussian 与 ORCA 当前都支持 `{a,b,c}` 形式的关键词集合展开，会按笛卡尔积生成多份输入文件。展开项也会成为文件名前缀的一部分。

#### `%extrakeywords`

以 `end exkwd` 结束。对于不同程序：

- Gaussian：写在坐标之后
- ORCA：写在关键词行之后
- Script：作为脚本正文
- Other：是否使用取决于模板

#### `%mod`

支持 `charge` / `spin` 的 `set` / `add` / `subtract`。

### 前后处理脚本：pre_comd 与 comd

`%preprocess` 与 `%process` 并不会在生成阶段执行，而是写入任务目录下的：

- `pre_comd`
- `comd`

占位符：

- `[taskname]`
- `[originname]`
- `[inputname]`
- `[rootname]`

在 bash 模式下，当前代码内置了一组快捷指令：

- `scripts ...`
- `multiwfn ...`
- `copy ...`
- `banewfn ...`
- `analysis ...`
- `result ...` / `results ...`
- `benv ...`

### 归档与结果快照

`%archive` 当前会触发两类动作：

1. 生成 `任务名_archive.json`
2. 在 bash 模式下，按属性写入 `banejs --archive ...` 或 `banejs --soc ...`

与此同时，如果结果记录链开启，`comd` 还会追加一条 `banejs` 命令，导出：

- `.bane.result.kv`
- `Results/DB/snapshots/*.kv`
- `Results/DB/records/*.json`
- `Results/DB/queue/*.ready`

`runif` 就是基于这些轻量快照工作的；`banetask db` / `btask db` 则基于记录 JSON 同步 SQLite 派生库。

## 运行产物与目录约定

假设你的 `.bt` 位于 `methane/methane.bt`，典型产物如下：

- 在 `.bt` 同级目录下，为每个任务块创建子目录：`opt/`、`sp/`……
- 在任务目录中生成输入文件、`.bwrk`、`pre_comd`、`comd`
- 条件满足且命令链完整时，生成 `.bane.result.kv`
- 在 case 根目录生成 `Results/DB/` 子树与 `project.db`
- `bt.status` 记录已经生成过 workflow 的任务块

如果你只想刷新 `pre_comd / comd`（以及归档 JSON），而不想改动 `.bwrk`，可以使用：

```bash
banetask your.bt --comd-only
```

## 结果数据库与项目比较

### `runif` 的写法

单依赖时可以直接写：

```text
runif {{ nimag }} = 1
runif {{ imag1 }} < -500
```

多依赖时必须显式写成：

```text
runif {{ td.energy }} > {{ td_t1.energy }}
```

当前常用别名：

- `energy`
- `scf_energy`
- `free_energy`
- `nimag`
- `imag1`, `imag2`, ...
- `converged`

### `banetask db`

当前代码支持：

```bash
banetask db init [--path <task_dir|file.bt>]
banetask db sync [--path <task_dir|file.bt>]
banetask db rebuild [--path <task_dir|file.bt>]
banetask db query --sql "SELECT * FROM task_flat_latest"
banetask db export --sql "SELECT * FROM task_flat_latest" --format csv --out runs.csv
```

默认数据库位置：

```text
<case_root>/Results/DB/project.db
```

### `btask db` 与 `btask compare`

项目模式下还支持：

```bash
btask db sync --path ./my_project
btask db query --sql "SELECT case_key, task_name, energy FROM task_flat_latest"
btask compare opt td --metric energy --path ./my_project
```

`btask compare` 默认比较 `energy`，也可以比较 `tddft.total_energy` 这类 JSON 扩展字段。

## 命令行工具

### banetask 主程序

常用方式：

- `banetask your.bt`
- `banetask some_dir/`
- `banetask your.bt --comd-only`
- `banetask db ...`

主选项：

- `-h, --help`
- `-v, --version`
- `-l, --log <path>`
- `-d, --debug`
- `--comd-only`

### btask 辅助工具

当前实现中的 `btask` 包含：

- `-t`：创建测试文件夹和示例文件
- `-r`：删除当前目录及子目录下的所有 `bt.status`
- `-l` / `-c`：列出模板
- `-i`：交互式模板选择器
- `-m`：合并模板
- `-v`：为 `.bt` 生成 define 部分
- `-b`：项目批处理模式
- `-u`：项目更新模式
- `db ...`：项目级 banedb
- `compare ...`：项目级横向比较
- `.projbt` 批处理执行 / 收集模式

### btc（Windows 辅助入口）

`btc.exe` 仅在 Windows 目标下构建。它会：

1. 找到 `.xyz`
2. 由 `.btc` 模板生成同名 `.bt`
3. 需要时备份旧 `.bt`
4. 默认调用 `run.bat -p <directory>`

## 示例

下面给一个“Gaussian 优化 + ORCA 单点 + 条件后续任务”的例子：

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
    scripts fchk

$sp
  %source opt
  %program orca
  %control
    totcore 32
    totmem 96000
  %keywords "wB97M-V def2-TZVP def2/J RIJCOSX TightSCF"

$ts_check
  %source opt
  %control
    runif {{ nimag }} = 1
    runif {{ imag1 }} < -500
  %keywords "freq [func]/[basis]"
```

如果你要查结果，可以直接：

```bash
banetask db sync --path ./methane
banetask db query --sql "SELECT task_name, energy, nimag FROM task_flat_latest"
```

## 其他
VS code高亮插件：[bt-highlight.vsix](/_file/banetask/bt-highlight.vsix)

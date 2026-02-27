---
title: BaneTask 
summary: 量子化学任务控制系统
---

Last Update: 26/2/27

BaneTask 是一个开源的量子化学任务控制系统，使用 C++17 编写，专注于简化和自动化量子化学计算工作流。如果你曾受困于手动准备大量输入文件、复杂计算流程需步步手操、结果散落难以管理，或者在切换不同量化程序时频繁重学输入格式，BaneTask 就是为了彻底解放你的双手而诞生的。

**核心理念**：用一个简洁统一的 `.bt` 文本文件描述计算流程，将依赖管理、结构提取、变量替换和结果归档全部交给程序。

项目地址：

* **GitHub**: [https://github.com/bane-dysta/banetask](https://github.com/bane-dysta/banetask)
* **Gitee**: [https://gitee.com/bane-dysta/banetask2](https://gitee.com/bane-dysta/banetask2)

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [安装与环境配置](#安装与环境配置)
    - [主程序与全局路径配置](#主程序与全局路径配置)
    - [量子化学程序环境配置](#量子化学程序环境配置)
- [任务控制文件 bt](#任务控制文件-bt)
    - [全局与变量定义](#全局与变量定义)
    - [任务块指令](#任务块指令)
    - [后处理引擎 (%process)](#后处理引擎-process)
- [场景示例](#场景示例)
- [命令行工具](#命令行工具)
    - [banetask 主程序](#banetask-主程序)
    - [btask 辅助工具](#btask-辅助工具)

<!-- /TOC -->

## 安装与环境配置

### 主程序与全局路径配置

将下载的二进制文件目录加入环境变量 `PATH`：

```bash
export PATH=path/to/banetask/bin:$PATH

```

在 `~/.banetask` 建立配置文件 `banetask.conf`。这里定义了 BaneTask 运行所需的各种脚本、模板和工作目录：

```conf
# BaneTask配置文件
BANETASK_BASE_PATH=$HOME/scripts/bin
BANETASK_SCRIPTS_PATH=$HOME/.banetask/scripts
BANETASK_WFN_EXAMPLES_PATH=$HOME/.banetask/multiwfn_templates
BANETASK_OTHER_TEMPLATES_PATH=$HOME/.banetask/other_templates
BANETASK_BANEWFN_PATH=$HOME/.banetask/banewfn
BANETASK_ENVCONF_PATH=$HOME/.banetask/envs
BANETASK_EXTERNAL_SCRIPTS_PATH=$HOME/.banetask/external
BANETASK_TASK_PATH=$HOME/AutoCalc/tasks
BANETASK_LOG_PATH=$HOME/AutoCalc/tasks
BANETASK_TEMPLATE_PATH=$HOME/.banetask/bt_templates
IF_WAIT_FREQ=TRUE

```

### 量子化学程序环境配置

BaneTask 允许你为不同程序自定义运行环境。在 `BANETASK_ENVCONF_PATH` 下创建 `.conf` 文件（例如 `g16.conf`）：

```conf
CONF_CORES=32
CONF_MEMORY=96000
SUFFIX=gjf
ENV_SETUP='source "$HOME/apprepo/gaussian/16-hy/scripts/env.sh"
export PGI_FASTMATH_CPU=sandybridge'
RUN_CMD_TEMPLATE='g16 "${ACTUAL_INPUT_FILE}" > "${ACTUAL_INPUT_FILE}"'

```

这里定义了程序的默认核数、内存、输入后缀，以及初始化环境变量（`ENV_SETUP` 支持跨行）和运行命令模板。

## 任务控制文件 bt

`.bt` 文件需与结构资源（如 `.xyz`）同名并放在同一目录。

### 全局与变量定义

文件头部采用 YAML 风格：

```yaml
autorun: true
define:
  func: B3LYP
  basis: 6-31G(d)
  solvent: water
```

开启 `autorun: true` 后，BaneTask 会在生成 `pre_comd / comd` 后，在任务结束阶段自动追加执行 `BANETASK_SCRIPTS_PATH/run.sh --path ..`（若 `run.sh` 存在），用于一键触发后续任务循环/队列提交。`define` 定义的变量可以在后续用 `[变量名]` 的形式全局调用。

### 任务块指令

每个任务块以 `$` 加任务名开头，支持以下核心指令：

* **`%source` (结构资源)**：
* `origin`: 使用原始配对的输入文件。
* `任务名`: 智能提取指定前置任务的输出结构（目前支持 Gaussian 和 ORCA）。
* `任务名 guess`: 对于 Gaussian，不仅提取结构，还会自动添加 `%oldchk` 并挂载 `guess=read`。
* `xyz=文件路径`: 指定特定结构文件。


* **`%program` (程序类型)**：默认 `gaussian`，支持 `orca`、`script`、`other`（调用外部模板）。
* **`%control`**：可局部覆盖 `totcore` / `totmem`，并支持：
  * `runifdef [变量名]`：条件任务块。当该占位符未被替换（变量未定义）时，自动跳过整个任务块。
  * `verbosity p|t`：Gaussian 路由行使用 `#p` / `#t`（默认仅 `#`）。
* **`%keywords`**：计算关键词。Gaussian 自动补 `#`，ORCA 自动补 `!`，脚本模式下用于写入 shebang（如 `/bin/csh`）。
* **`%extrakeywords`**：额外数据块（以 `end exkwd` 结尾）。可用于写入 Gaussian 坐标后的辅助输入（如 `.wfn` 文件名）、ORCA 的特殊控制块（如 `%tddft`），或 script 的具体脚本内容。
* **`%mod`**：强大的结构修改器，支持 `spin`、`charge` 的直接赋值或加减运算（如 `spin add 1`）。
* **`%archive`**：结果归档声明（可选）。用于生成 `任务名_archive.json` 并在后处理阶段自动调用 `banejs` 将关键产物沉淀到 `../Results/Archive`。
  * `strucid XXX`：写入结构 ID（便于后续索引/汇总）。
  * `properties {prop1,prop2,...}`：声明需要归档的性质/文件（例如 `freq`、`tddft`、`log_file`、`fchk_file`、`soc` 等）。其中 `soc` 会触发 SOC 专用归档流程；Gaussian 任务会自动补齐 `log_file / fchk_file`，频率/TD 任务会自动补齐 `freq / tddft`。

### 后处理引擎 (%process)

计算完成后，后处理指令会被写入 `comd` 脚本自动执行。

**内置占位符**：

* `[inputname]`：当前输入文件名（任务名_原始文件名）。
* `[taskname]`：当前任务名。
* `[originname]`：原始文件名。
* `[rootname]`：结构根名（通常为分子目录名，不含任务前缀），用于保持目录/文件基名一致。

**特殊处理器**：

1. `scripts`：直接调用 `BANETASK_SCRIPTS_PATH` 下的脚本（如 `scripts shermo -e [inputname].log`）。
2. `multiwfn`：自动从模板目录拉取输入流并调用 Multiwfn 分析（如 `multiwfn [inputname].fchk esp`）。
3. `banewfn`：深度联动 `banewfn` 子程序自动化提取波函数。
4. `copy`：通配符复制快捷命令（如 `copy fchk ../Archive` 等价于 `cp -r *.fchk ../Archive`）。
5. `analysis`：内置分析快捷入口：
   * `analysis td [2|3]`：提取 TD 结果（等价于 `banedata -td`，可选 2/3 控制输出）。
   * `analysis nimag`：检查虚频数量，异常时自动导出频率摘要（`banedata -i` / `banedata -x freq`）。
   * `analysis geom`：从最新 `.log` 提取几何并回写对应 `.gjf` 的电荷/自旋多重度。
   * `analysis soc` / `analysis scan` / `analysis irc`：SOC、扫描、IRC 的快捷分析/绘图入口。
6. `result / results`：结果收集器。自动创建 `../Results/[inputname]/` 并将给定的文件/目录复制进去（如 `result *.fchk *.log`）。
7. `benv`：快捷加载环境配置（如 `benv g16`）。

*(注：系统同时支持 `%preprocess` 指令，会在 QM 计算命令执行前将脚本写入 `pre_comd` 中运行。)*

## 场景示例

**场景：Gaussian 优化 + ORCA 高精度单点 + Shermo 热力学分析**

在这个工作流中，程序先用 Gaussian 优化，然后自动将结构传递给 ORCA 进行单点能计算，最后调用外部脚本进行后处理：

```
autorun: true
$opt
    %source origin
    %keywords "opt freq B3LYP/6-31G(d) scrf em=gd3bj"

$sp
    %program orca
    %source opt
    %keywords "wB97M-V def2-tzvp def2/J RIJCOSX verytightSCF defgrid3 SMD(water)"
    %process
        scripts shermo -e [inputname].log -f ../opt/opt_[originname].log

```

## 命令行工具

### banetask 主程序

基本用法：

* `banetask task.bt`：解析 `.bt` 并生成输入文件、`.bwrk` 与脚本。
* `banetask task.bt --comd-only`：只重新生成/覆盖 `pre_comd / comd`（以及归档相关 JSON），不生成新的 `.bwrk`，也不会改写 `bt.status`——适合你只想“刷新后处理/归档脚本”。

### btask 辅助工具

除了主程序外，内置的 `btask` 提供模板管理、项目化批处理与一键更新能力：

* `btask -t`：创建测试文件夹和示例文件。
* `btask -r`：删除当前目录及子目录下的所有 `bt.status`（重置任务完成状态）。
* `btask -l`：列出系统所有可用模板。
* `btask -c`：按分类列出模板。
* `btask -i`：交互式模板选择器（上下键选择、空格勾选、`v` 设变量）组合内置模板快速生成复杂 `.bt`。
* `btask -m opt freq`：合并指定模板（可配合 `-o` 指定输出文件名）。
* `btask -v task.bt mytemplate`：为已有 `.bt` 自动生成 `define` 变量段（使用变量模板）。
* `btask -d <dir>`：指定模板目录（覆盖默认模板路径）。

**项目模式（.projbt）**：

* `btask -b`：项目批处理模式。在 `$BANETASK_TASK_PATH` 下创建项目目录结构，生成一个 `.projbt` 项目模板文件；各任务目录中的 `.bt` 通过符号链接指向该 `.projbt`，修改一次即可同步所有任务。
* `btask -u`：项目更新模式（在包含 `.projbt` 的目录中运行）。选择任务块后可：
  1. 清除完成标记并重新执行 `banetask`（可选择是否立即执行 `comd` 开算）
  2. 在匹配的任务目录中批量执行自定义脚本

当你想对一个项目的所有分子“统一执行某条命令”或“统一收集结果文件”，可以直接：

* `btask xxx.projbt -n <taskname> --exec '<cmd>'`：在每个分子目录的 `<taskname>/` 下执行命令  
  例：`btask 123.projbt -n opt --exec 'grep "SCF Done" *.log'`
* `btask xxx.projbt -n <taskname> --collect '<glob...>'`：收集匹配文件/目录到 `<projbt_dir>/results/`，并自动追加 `_<moleculename>` 后缀  
  例：`btask 123.projbt -n soc --collect 'soc*.png *.txt'`
* `--dry-run`：只打印将要执行/收集的内容，不实际操作（建议首次先 dry-run 预演）。

## 脚本集

- bt模板入口在[这里](/_file/banetask/bt_template)
- 一些配套脚本入口在[这里](/_file/banetask/scripts)

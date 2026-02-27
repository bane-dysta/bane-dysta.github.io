---
title: BaneTask 
ummary: 量子化学任务控制系统
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

开启 `autorun: true` 后，BaneTask 会在后台将文件转换为作业调度脚本（`.bwrk` 文件）并自动开启任务循环。`define` 定义的变量可以在后续用 `[变量名]` 的形式全局调用。

### 任务块指令

每个任务块以 `$` 加任务名开头，支持以下核心指令：

* **`%source` (结构资源)**：
* `origin`: 使用原始配对的输入文件。
* `任务名`: 智能提取指定前置任务的输出结构（目前支持 Gaussian 和 ORCA）。
* `任务名 guess`: 对于 Gaussian，不仅提取结构，还会自动添加 `%oldchk` 并挂载 `guess=read`。
* `xyz=文件路径`: 指定特定结构文件。


* **`%program` (程序类型)**：默认 `gaussian`，支持 `orca`、`script`、`other`（调用外部模板）。
* **`%control`**：可局部覆盖 `totcore` 和 `totmem`。
* **`%keywords`**：计算关键词。Gaussian 自动补 `#`，ORCA 自动补 `!`，脚本模式下用于写入 shebang（如 `/bin/csh`）。
* **`%extrakeywords`**：额外数据块（以 `end exkwd` 结尾）。可用于写入 Gaussian 坐标后的辅助输入（如 `.wfn` 文件名）、ORCA 的特殊控制块（如 `%tddft`），或 script 的具体脚本内容。
* **`%mod`**：强大的结构修改器，支持 `spin`、`charge` 的直接赋值或加减运算（如 `spin add 1`）。

### 后处理引擎 (%process)

这是 BaneTask 最强大的功能之一。计算完成后，指令会被写入 `comd` 脚本自动执行。

**内置占位符**：

* `[inputname]`：当前输入文件名（任务名_原始文件名）。
* `[taskname]`：当前任务名。
* `[originname]`：原始文件名。

**特殊处理器**：

1. `scripts`：直接调用 `BANETASK_SCRIPTS_PATH` 下的脚本（如 `scripts shermo -e [inputname].log`）。
2. `multiwfn`：自动从模板目录拉取输入流并调用 Multiwfn 分析（如 `multiwfn [inputname].fchk esp`）。
3. `banewfn`：深度联动 `banewfn` 子程序自动化提取波函数。
4. `copy`：通配符复制快捷命令（如 `copy fchk ../Archive` 等价于 `cp -r *.fchk ../Archive`）。
5. `benv`：快捷加载环境配置（如 `benv g16`）。

*(注：系统同时支持 `%preprocess` 指令，会在 QM 计算命令执行前将脚本写入 `pre_comd` 中运行。)*

## 场景示例

**场景：Gaussian 优化 + ORCA 高精度单点 + Shermo 热力学分析**

在这个工作流中，程序先用 Gaussian 优化，然后自动将结构传递给 ORCA 进行单点能计算，最后调用外部脚本进行后处理：

```yaml
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

除了主程序 `banetask [文件路径]` 外，内置的 `btask` 辅助工具提供了完善的项目管理能力：

* `btask -t`：生成测试示例模板。
* `btask -b`：**批处理模式**。自动为当前目录下的所有分子创建独立工作目录与 `.projbt` 项目文件，修改项目文件即可同步所有子任务。
* `btask -u`：**项目批处理**。联动上述目录结构，可选择性重置某几个任务块的完成状态并重新跑计算。
* `btask -i`：**交互式模板生成**。通过终端 UI（上下键选择、空格勾选、`v` 设变量）组合内置的几十种模板，快速生成复杂的 `.bt` 文件。
* `btask -l`：列出系统所有可用模板。


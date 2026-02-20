---
title: baneMECP
summary: 面向多量化程序的 MECP/MECI 求解驱动器（模板调度 + 能量/梯度提取）
---

Last Update: 26/2/20

baneMECP 是个用于求解 **MECP（Minimum Energy Crossing Point）** 与 **MECI（Minimum Energy Conical Intersection）**的通用迭代器。本程序是driver程序，需要外部QM程序提供梯度与能量信息。

本程序提供了灵活接口，可以在任意级别搜索MECP，弥补QM软件功能缺陷。如GAMESS不支持同时计算单重态与三重态的Spin-Flip计算，可以通过本程序在MRSF-TDDFT级别搜索MECP。

公社介绍贴（部分内容过时，但有例子）：[适用于更多程序的sobMECP修改版](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=55740&fromuid=63020)

本站下载：[banemecp.tgz](/_file/banemecp/banemecp.tgz)

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [安装与运行](#安装与运行)
- [基本工作流](#基本工作流)
- [输入文件](#输入文件)
    - [%Prog](#prog)
    - [%Geom](#geom)
    - [%Control](#control)
    - [%InpTmplt](#inptmplt)
    - [%GrpTmplt：选择提取规则（可选）](#grptmplt选择提取规则可选)
- [配置文件](#配置文件)
    - [运行配置](#运行配置)
    - [提取规则](#提取规则)
- [梯度文件](#梯度文件)

<!-- /TOC -->

## 安装与运行

- 平台：Linux 64-bit
- 组件：
  - `banemecp.cpp`：迭代器
  - `baneMECP.f`：MECP/MECI 求解器
- 外部依赖：
  - 至少需要一个能输出能量与梯度的量化程序（具体由你的模板与 conf 决定）
  - gfortran编译器

安装时，先编译迭代器：
```
g++ banemecp.cpp -o banemecp
```
然后加入 `PATH`：
```bash
chmod +x banemecp
export PATH=/path/to/banemecp:$PATH
```
求解器无需预先编译，将在第一次运行时根据原子数 Nat 临时编译，以最大化运行速度。迭代器程序会在第一步读取当前结构的原子数，并运行：
```bash
gfortran -O3 -march=native -ffast-math -ffixed-line-length-none MECP_temp.f -o MECP.x
```
因此，baneMECP.f需要放在迭代器可以找到的位置。查找顺序：

- 1. **运行目录**（也就是你启动 `banemecp input.inp` 的目录）
- 2. **banemecp 可执行文件所在目录**
- 3. **用户目录：`~/.bane/mecp/`**

## 基本工作流

- 1. 准备初始结构 `start.xyz`
- 2. 编写主输入 `input.inp`（选择程序、收敛阈值、两态模板）
- 3. 准备配置文件 `<prog>.conf`（定义怎么运行、怎么提取能量/梯度）
- 4. 运行：`banemecp input.inp`

## 输入文件

主输入由多个段落组成，段名以 `%` 开头。

### %Prog
使用%Prog选择程序配置，如：

```
%Prog g16
```

程序会加载 `config/g16.conf`（或当前目录/指定路径下的同名 conf）。
如果找不到对应 conf，或 conf 中没有 `RUN_CMD`，则进入 **external 模式**：此时每一步不会由程序内置执行量化计算，而是由你在模板中提供的脚本自行完成“运行 + 提取 + 生成 grad 文件”。

### %Geom
使用%Geom提供初始结构：

```
%Geom start.xyz
```

要求标准 xyz 格式。后续每一步几何会写成 `astepN.xyz`。

### %Control

`%Control` 使用 `key=value` 键值对优化细节进行控制，以 `end` 结束。常用项分三类：

**(1) 迭代选项**

* `maxcyc`：最大步数
* `tmpdir`：工作目录（可为 `.` 或独立目录）
* `keeptmp`：是否保留中间文件
* `debug`：输出更多日志
* `restart`：是否尝试从已有工作目录继续

**(2) 收敛判据（本部分将传递给求解器）**

* `tde`：两态能量差阈值
* `tgmax/tgrms`：梯度最大值/均方根阈值
* `tdxmax/tdxrms`：位移最大值/均方根阈值
* `stpmx`：单步最大步长

**(3) 算法与数值策略**

* `algorithm`：MECP 求解形式
  可选：`harvey` / `bpupd` / `lagrange` = `pf`
* `opt_method`：步进策略/加速
  可选：`bfgs` / `gdiis` / `gediis`
* `ndiis`：DIIS 子空间维数（当 `opt_method` 为 `gdiis/gediis` 时生效）
* `hupd_method`：Hessian 更新方式
  可选：`bfgs` / `psb` / `sr1` / `bofill`
* 罚函数/拉格朗日相关参数（当 `algorithm=lagrange` 或 `algorithm=pf` 时使用）：
  `pf_alpha` `pf_sigma` `pf_tstep` `pf_tgrad` `pf_thresh`

一个可直接跑通的示例：

```ini
%Control
maxcyc=80
tmpdir=./tmp
keeptmp=false
restart=false
tde=5e-5
tgmax=7e-4
tgrms=5e-4
tdxmax=4e-3
tdxrms=2.5e-3
stpmx=0.10
algorithm=lagrange
opt_method=gdiis
ndiis=8
hupd_method=bofill
pf_alpha=0.50
pf_sigma=0.50
pf_tstep=0.20
pf_tgrad=0.20
pf_thresh=1e-4
end
```

### %InpTmplt

两态模板用于生成每一步的量化程序输入。

* `%InpTmplt1`：state 1 模板（必需）
* `%InpTmplt2`：state 2 模板（可选；若缺省则两态共用模板/或由 conf 控制生成策略）

`%InpTmplt`中可使用占位符（常用）：

* `[name]`：步名（`astepN`）
* `[xyzfile]`：当前几何文件（`astepN.xyz`）
* `[geom]`：坐标块（可直接嵌入输入）
* `[nstep]`：步号

在 **内置模式**（conf 提供 RUN_CMD）下，`%InpTmplt`主要用于“写输入文件内容”；
在 **external 模式**下，`%InpTmplt`通常写成脚本（或脚本片段），由你自行完成：提交作业/等待结束/解析输出/写 grad 文件。

### %GrpTmplt：选择提取规则（可选）

当你希望 baneMECP **自动从输出提取能量/梯度并生成 `.grad1/.grad2`** 时，使用 `%GrpTmplt` 指定两态分别使用 conf 中哪个 section：

```
%GrpTmplt
state1=scf
state2=td
end
```

其中 `scf` 与 `td` 必须在 `<prog>.conf` 中定义提取规则（见下一节）。

如果不写 `%GrpTmplt`，baneMECP 将不会自动生成 `.grad1/.grad2`，此时必须由 external 模板脚本自行产出这两个文件。

## 配置文件

conf文件与baneMECP.f的查找规则一致，需要解决两件事：

- 1. 如何运行量化程序（RUN_CMD）
- 2. 如何从输出提取能量与梯度（供 `%GrpTmplt` 引用）

### 运行配置
运行配置写在[main]块内，需要写入的有：
* `INPUT_SUFFIX`：输入后缀（如 `gjf`、`inp`）
* `OUTPUT_SUFFIX`：输出后缀（如 `log`、`out`）
* `env`：运行前环境（可多行，单引号包住）
* `RUN_CMD`：实际执行命令（单引号包住；可多行）
  支持变量：`${ACTUAL_INP}` `${ACTUAL_OUT}`

示例：

```ini
[main]
env='source ~/.bashrc
module load g16'
INPUT_SUFFIX=gjf
OUTPUT_SUFFIX=log
RUN_CMD='g16 ${ACTUAL_INP} > ${ACTUAL_OUT}'
```

### 提取规则

[main]后续的每个 section 都记录一种输出类型（例如 `scf`、`td`、`cas` 等），至少要定义：

* `E`：能量正则（第一个捕获组为数值）
* `GRAD.*`：梯度块提取规则

  * `GRAD.Locate`：梯度块定位行
  * `GRAD.NLineSkip`：定位后跳过行数
  * `GRAD.TargetColumns`：x/y/z 在哪几列（例如 `3,4,5`）
  * `GRAD.EndBy`：结束标记（可用分隔线/空行）
  * `GRAD.Type`：`force` 或 `grad`（

示例（Gaussian SCF 能量与受力）：

```ini
[scf]
E=SCF Done:\s+E\([^)]*\)\s*=\s*([-\d\.]+)
GRAD.Locate=Forces (Hartrees/Bohr)
GRAD.NLineSkip=2
GRAD.TargetColumns=3,4,5
GRAD.EndBy=----
GRAD.Type=force
```

## 梯度文件

求解器每一步需要两态的能量与梯度，这部分通常由`%GrpTmplt`指定提取方式，由baneMECP自动完成。但如果你使用 external 模式，你需要让你的脚本每一步都按照如下规则写入梯度数据文件：

* `astepN.grad1`：态 1（state1）能量与梯度
* `astepN.grad2`：态 2（state2）能量与梯度

文件格式固定为：

1. 第一行：原子数 `Nat`
2. 第二行：能量（Hartree）
3. 之后 `Nat` 行：`Element  gx  gy  gz`

其中 `gx gy gz` 表示梯度分量（单位依据 conf 的 `GRAD.Type` 与所提取文本；baneMECP 会按其内部约定做必要的符号/单位一致化），以保证 MECP.x 能直接读取并完成步进。

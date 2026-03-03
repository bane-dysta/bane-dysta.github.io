---
title: BaneTop
summary: Gaussian力场参数转换工具
---

Last Update: 2025-05-21 (v1.0)

BaneTop 是一个命令行工具，用于将 **Sobtop** 产生/补全的力场信息整理并转换为 **Gaussian 分子力学（Amber）与 ONIOM(QM:MM)** 可直接使用的输入片段与参数段，主要面向配体/非标准残基在 Gaussian 中出现 **缺失参数（Undefined parameters）** 的场景。

项目地址：https://github.com/bane-dysta/banetop

公社介绍贴：[BaneTop：Gaussian力场参数转换器](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=53665&fromuid=63020)

本站介绍贴：[BaneTop：Gaussian力场参数生成器(建议看公社的介绍贴，那个是手写的，本站这个是AI作品)](https://bane-dysta.top/posts/37/)

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [安装](#安装)
  - [依赖与环境](#依赖与环境)
  - [获取与权限](#获取与权限)
  - [配置](#配置)
- [快速开始](#快速开始)
- [功能与用法](#功能与用法)
  - [帮助与配置文件](#帮助与配置文件)
  - [写入 RESP 电荷](#写入-resp-电荷)
  - [提取/生成缺失参数](#提取生成缺失参数)
  - [调用Sobtop模板](#调用sobtop模板)
  - [从rtp生成Gaussian可用参数](#从rtp生成gaussian可用参数)
  - [从 fchk 生成 Gaussian 可用参数（-g fchk）](#从-fchk-生成-gaussian-可用参数-g-fchk)
- [输出文件与副产物](#输出文件与副产物)
- [注意事项与常见问题](#注意事项与常见问题)

<!-- /TOC -->

## 安装

### 依赖与环境

BaneTop 本体是命令行工具，按功能不同对外部软件的依赖不同：

- 需求**Sobtop**的功能：
  - `-s`（调用模板）必需。
  - `-g fchk` 必需（该模式内部会调用 Sobtop 的 `genrtp` 模板）。
  - `-g rtp` **若想自动生成包含坐标/连接信息的完整 `.gjf`**，也需要 Sobtop（依赖 `gengjf` 模板）。
- 需求**Open Babel / obabel（可选）**的功能：
  - 仅在 `-g fchk` 且目录中**没有同名前缀 `.mol2`** 时，用于从 `.fchk` 转换生成 `.mol2`。
- 需求**Gnuplot（可选）**的功能：
  - `-g rtp / -g fchk` 会为“谐振二面角 → 周期势”的拟合结果生成 `.plt` 绘图脚本；若你需要一键出图，再安装 Gnuplot。

### 获取与权限
从 GitHub release 下载对应版本并解压，将可执行文件加入 `PATH` 或设置别名，例如：
```bash
chmod +x banetop
# 例：把 banetop 所在目录加入 PATH
echo 'export PATH=/path/to/banetop:$PATH' >> ~/.bashrc
source ~/.bashrc
```
### 配置

BaneTop 通过配置文件定位 Sobtop 与模板目录，并控制日志输出。程序会按以下顺序查找 **banetop.conf**：

1. 当前目录 `./banetop.conf`
2. `~/.banetop/banetop.conf`
3. `/etc/banetop/banetop.conf`

也可以用 `--config` 显式指定任意路径的配置文件：

- `--config /path/to/banetop.conf`（`.conf`）
- `--config /path/to/banetop.yml` 或 `--config /path/to/banetop.yaml`（YAML）

> 注意：**自动查找只会找 `banetop.conf`**；如果你使用 YAML，请用 `--config` 指定。

日志输出说明（按当前代码实现）：

- 程序总是尝试把日志写入 `log.file_path` 指定的文件（能打开就写）。目前没有单独的“关闭写文件”开关。
- `log.to_console` 控制是否在终端输出日志。
- 配置项 `log.to_file` 在当前实现中会被用作 **终端彩色输出开关**（传入日志模块的 `enableColor` 参数）。
  - 如果你只是想“不要产生日志文件”，在 Linux/macOS 下可以把 `log.file_path` 设为 `/dev/null` 作为替代方案。


#### 最小配置示例（.conf）

```ini
# Sobtop 可执行文件路径
sobtop.path = /path/to/sobtop

# Sobtop 模板目录（通常是 release 自带 templates）
sobtop.templates_dir = /path/to/banetop/templates

# （可选）日志
log.file_path = banetop.log
# 日志级别：0=TRACE, 1=DEBUG, 2=INFO, 3=WARNING, 4=ERROR
log.level = 2
log.to_console = true
# 注意：当前版本中 log.to_file 实际用于控制“彩色输出开关”
log.to_file = true
```

#### 最小配置示例（YAML）

```yaml
sobtop:
  path: /path/to/sobtop
  templates_dir: /path/to/banetop/templates
log:
  file_path: banetop.log
  # 0=TRACE, 1=DEBUG, 2=INFO, 3=WARNING, 4=ERROR
  level: 2
  to_console: true
  # 注意：当前版本中 to_file 实际用于控制“彩色输出开关”
  to_file: true
```

## 快速开始

一个典型的“从 Sobtop/Gaussian 到可跑的 Gaussian Amber/ONIOM 输入”的思路如下：

1) **如果你已经有 Sobtop 的 `.rtp`**（并且也有对应 `.mol2`）：

```bash
banetop -g rtp molecule.mol2 molecule.rtp
```

2) **如果你只有频率计算得到的 `.fchk`**（并且愿意让程序调用 Sobtop 生成 `.rtp`）：

```bash
banetop -g fchk calculation.fchk
```

3) 如果只是补齐 Gaussian 报错的“Undefined parameters”（主要是键/键角）：

```bash
banetop -u gaussian.log FFderiv.txt
# 输出会打印到屏幕；需要时再手动复制/重定向
```

4) 把 Multiwfn 的 `.chg` 电荷写回 `.gjf`：

```bash
banetop -c molecule.gjf molecule.chg
```

## 功能与用法

### 帮助与配置文件

查看帮助：

```bash
banetop --help
```

指定配置文件（覆盖默认的 `banetop.conf` 查找规则）：

```bash
banetop --config /path/to/banetop.conf -g rtp molecule.mol2 molecule.rtp
banetop --config /path/to/banetop.yml  -s genpara molecule.mol2
```

### 写入 RESP 电荷

将 `.chg` 中的电荷写入 `.gjf` 的原子行中。

- **输入文件顺序不敏感**：`banetop` 会根据扩展名自动识别 `.gjf` 与 `.chg`。
- 如果两者原子数不一致，会提示是否继续。
- 如果 `.gjf` 某些原子缺少原子类型字段，会用元素符号兜底填充（避免后续 MM 参数引用时出错）。

命令：

```bash
# 两种顺序都可以
banetop -c molecule.gjf molecule.chg
banetop -c molecule.chg molecule.gjf
```

输出：

- `molecule_charged.gjf`

> `.chg` 文件格式：程序按行读取，每行应能解析为 5 列：`元素符号 x y z 电荷`（Multiwfn 常见输出格式）。

### 提取/生成缺失参数

从 Gaussian 输出（`.log/.out`）中提取未定义的 **键 / 键角** 参数项，并从 Sobtop 的力场导出文件中查找对应数值，生成可追加到 Gaussian 输入中的参数行。

- **输入文件顺序不敏感**：会自动识别哪个是 `.log/.out`。
- 输出默认打印到屏幕（stdout），并带有分隔标题，方便人工查看。
- 当前实现主要生成：
  - `HrmStr1`（键，harmonic stretch）
  - `HrmBnd1`（键角，harmonic bend）

命令：

```bash
banetop -u gaussian.log FFderiv.txt
# 或
banetop -u gaussian.out FFderiv.txt
```

如果你希望重定向到文件：

```bash
banetop -u gaussian.log FFderiv.txt > new_params_with_banner.txt
```

> 说明：重定向会把“====== Gaussian参数输出 ======”这类标题也一起写进去；如果你要把参数粘贴进 `.gjf`，通常只需要复制中间的参数行即可。

### 调用Sobtop模板

以“模板任务”的方式驱动 Sobtop 完成特定流程（例如 `genpara`、`genrtp`、`gengjf` 等，具体取决于你 templates 目录里有哪些任务模板）。

```bash
banetop -s genpara molecule.mol2
```

**模板与变量替换规则（按代码实现）：**

- 模板文件名为：`<模板名>.txt`，位于 `sobtop.templates_dir`。
- 程序会扫描模板内容中形如 `${xxx_file}` 的占位符：
  - 若 `molecule.mol2` 同目录下存在同名前缀的 `molecule.xxx`，则自动把变量 `xxx_file` 设为该文件的**绝对路径**。
  - 例如模板里写了 `${fchk_file}`，且同目录下存在 `molecule.fchk`，就会自动传入 `fchk_file=/abs/path/molecule.fchk`。
- 配置文件里 **除 `sobtop.*` 之外的所有键** 也会作为变量一并传给模板（便于你在模板中引用自定义参数）。

当模板名不存在时，程序会列出可用模板列表。

### 从rtp生成Gaussian可用参数

从 Sobtop 生成的 `.rtp`（可选再配合 `.mol2`）生成 Gaussian 可用的 MM 参数，并在可能的情况下拼装成可直接跑的 `_mm.gjf`。

```bash
banetop -g rtp molecule.mol2 molecule.rtp
# 顺序也可以反过来
banetop -g rtp molecule.rtp molecule.mol2
```

**智能配对：**

- 你也可以只给一个文件，程序会尝试在同目录下寻找“同名前缀”的另一个文件：
  - 只给 `molecule.mol2` → 自动找 `molecule.rtp`
  - 只给 `molecule.rtp` → 会尝试找 `molecule.mol2`（找不到时仍可继续，但只能生成参数段，且输出命名可能不理想）

**二面角拟合（交互式）：**

- 若 `.rtp` 中存在 `funcType = 2` 的“谐振二面角”，程序会提示你设置拟合范围（默认 ±60°），并自动尝试多组相位组合，为每个二面角选一个 RMSE 最优的组合。
- 随后会打印“拟合质量表”，并询问你是否要对某些二面角输入自定义相位重新拟合。
- 同时会输出一个提示：对于可旋转二面角，可以考虑用 ztop 做更严格的周期势拟合。

**输出：**

- 主输出文件一般为：`molecule_mm.gjf`
- 若同目录下存在 `molecule.chg`，会自动把电荷写入输出 `.gjf`。

> 关于“是否是完整 `.gjf`”：
>
> - 若配置了 Sobtop，且 templates 中存在 `gengjf` 模板：程序会先调用 Sobtop 生成 `molecule.gjf`（带坐标/连接信息），再把 MM 参数段追加到末尾，最终得到可直接用于 Gaussian 的 `molecule_mm.gjf`。
> - 若 Sobtop 配置不完整 / 找不到 `gengjf` 模板 / 调用失败：会退化为“只生成 MM 参数段”（仍然写到一个 `.gjf` 文件里，但内容主要是 `HrmStr1/HrmBnd1/AmbTrs/ImpTrs/VDW` 等参数行），你需要自行把它追加到你的 Gaussian 输入文件末尾。

### 从fchk生成Gaussian可用参数

从 `fchk` 出发生成 Gaussian 可用的 MM 参数与输入片段（该模式会调用 Sobtop 的 `genrtp` 模板生成 `.rtp`，因此需要正确配置 Sobtop）。

```bash
banetop -g fchk calculation.fchk
```

按代码实现，这个流程大致是：

1. 优先查找同名前缀 `.mol2`：例如 `calculation.mol2`
2. 若不存在，则尝试调用 `obabel` 转换生成 `calculation_converted.mol2`
3. 调用 Sobtop 模板 `genrtp` 生成 `.rtp`
4. 转入 `-g rtp` 的流程，生成 `_mm.gjf`

> 实用建议：尽量自己准备 **与 fchk 同名前缀** 的 `calculation.mol2`，这样 Sobtop 模板中若需要 `${fchk_file}` 或其他同名前缀文件，变量替换更稳。

## 输出文件与副产物

除了主输出文件，`-g rtp / -g fchk` 在进行“谐振二面角拟合”时，还会额外生成一些用于检查拟合质量的文件：

- `<参数输出文件>.fit_stats.txt`：二面角拟合统计表（RMSE、相位、V1~V4 等）。
- `<参数输出文件>_draw.sh`：一键执行所有 `.plt` 绘图脚本的 shell 脚本。
- `<参数输出文件>_plots/`：绘图目录，包含每个二面角的 `*.plt` 脚本与对应的 `*.dat` 数据。
  - 运行方式：`bash <参数输出文件>_draw.sh` 或进入目录后 `gnuplot xxx.plt`
  - 生成图片：`*_energy.png / *_diff.png / *_residuals.png`

> 小提示：当你走“先用 Sobtop 生成 `.gjf` 再追加参数”的路径时，程序内部会先把参数写到一个临时前缀（例如 `temp_mm_params.txt`）上，因此你可能会看到 `temp_mm_params.txt.fit_stats.txt`、`temp_mm_params.txt_plots/` 这类文件；它们只是拟合检查用的副产物，不影响最终 `_mm.gjf`，也可以手动删除。

## 注意事项与常见问题

1) **原子顺序必须一致**

- `.chg` ↔ `.gjf`：`-c` 按“行号/顺序”写电荷。
- `.rtp` ↔ `.gjf`：`-g` 最终把 RTP 的原子类型写回 GJF 也是按“顺序”覆盖。

如果上游工具改过原子顺序，请先对齐，否则电荷/类型会写错原子。

2) **`-g fchk` 找不到 mol2 / 转换失败**

- 确保系统里有 `obabel` 命令。
- 更推荐你自己准备与 `.fchk` 同名前缀的 `.mol2`，避免自动转换后出现“文件前缀不一致”，影响 Sobtop 模板占位符 `${xxx_file}` 的自动匹配。

3) **找不到模板 / Sobtop 配置不完整**

- 检查 `sobtop.path` 是否指向 Sobtop 可执行文件。
- 检查 `sobtop.templates_dir` 是否是“包含 `<模板名>.txt` 的目录”。
- `-g fchk` 需要 `genrtp` 模板；`-g rtp` 若想生成完整 `.gjf`，需要 `gengjf` 模板。

4) **`-u` 的力场参数文件是什么？**

`-u` 的第二个文件需要是 Sobtop 导出的、包含类似 `Number of bonds:` / `Number of angles:` 的力场参数文本（常见命名如 `FFderiv.txt`）。

5) **二面角拟合结果怎么看？**

- 先看屏幕上的 RMSE 表。
- 再运行生成的绘图脚本（需要 gnuplot）：

```bash
bash <参数输出文件>_draw.sh
# 然后查看 <参数输出文件>_plots/*.png
```


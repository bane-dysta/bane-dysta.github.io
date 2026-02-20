---
title: BaneTop
summary: Gaussian力场参数转换工具
---

Last Update: 25/5/21

BaneTop 是一个命令行工具，用于将 Sobtop 产生/补全的力场信息整理并转换为 **Gaussian 分子力学（Amber）与 ONIOM(QM:MM)** 可直接使用的输入片段与参数段，主要面向配体/非标准残基在 Gaussian 中出现 **缺失参数（Undefined parameters）** 的场景。

项目原地址：https://github.com/bane-dysta/banetop

公社介绍贴：[BaneTop：Gaussian力场参数转换器](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=53665&fromuid=63020)

本站介绍贴：[BaneTop：Gaussian力场参数生成器(建议看公社的介绍贴，那个是手写的，本站这个是AI作品)](https://bane-dysta.top/posts/37/)

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [安装](#安装)
    - [依赖](#依赖)
    - [获取与权限](#获取与权限)
    - [配置](#配置)
- [快速开始](#快速开始)
- [功能与用法](#功能与用法)
    - [写入 RESP 电荷（-c）](#写入-resp-电荷-c)
    - [提取/生成缺失参数（-u）](#提取生成缺失参数-u)
    - [调用 Sobtop 模板（-s）](#调用-sobtop-模板-s)
    - [从 fchk 生成 Gaussian 可用参数（-g fchk）](#从-fchk-生成-gaussian-可用参数-g-fchk)
    - [从 rtp 生成 Gaussian 可用参数（-g rtp）](#从-rtp-生成-gaussian-可用参数-g-rtp)

<!-- /TOC -->

## 安装

### 依赖
- [Sobtop](http://sobereva.com/soft/Sobtop/)：力场类型指认与参数生成
- Open Babel（可选）：在仅提供 `.fchk` 时用于生成/转换 `.mol2`
- Gnuplot（可选）：用于检查二面角周期势拟合曲线

### 获取与权限
从 GitHub release 下载对应版本并解压，将可执行文件加入 `PATH` 或设置别名，例如：
```bash
chmod +x banetop
echo 'export PATH=/path/to/banetop:$PATH' >> ~/.bashrc
source ~/.bashrc
```
### 配置

BaneTop 通过配置文件定位 Sobtop 与模板目录。程序会按以下顺序查找配置：

* 当前目录 `./banetop.conf`
* `~/.banetop/banetop.conf`
* `/etc/banetop/banetop.conf`

最小配置示例：

```ini
# Sobtop 可执行文件路径
sobtop.path = /path/to/sobtop

# Sobtop 模板目录（release 通常自带 templates）
sobtop.templates_dir = /path/to/banetop/templates

# （可选）日志
log.file_path = banetop.log
log.level = 1
log.to_console = true
log.to_file = true
```

## 快速开始

准备同一目录下的输入文件（按需求选择）：

* 已做频率计算的 `calculation.fchk`
* 与 `fchk` **原子顺序一致** 的 `molecule.mol2`
* （可选）包含RESP电荷的chg文件 `molecule.chg`

查看帮助：

```bash
banetop --help
```

## 功能与用法

### 写入 RESP 电荷（-c）

将 `.chg` 中的电荷写入 `.gjf`：

```bash
banetop -c molecule.gjf molecule.chg
```

输出：`molecule_charged.gjf`

### 提取/生成缺失参数（-u）

从 Gaussian 输出（`.log/.out`）中提取未定义参数项，并生成对应的参数片段（用于追加到输入中）：

```bash
banetop -u gaussian.log ff_params.txt > new_params.txt
```

适用于：Gaussian 能识别分子拓扑，但在力场参数表中缺项的情况。

### 调用 Sobtop 模板（-s）

以模板方式驱动 Sobtop 完成特定流程（例如 genpara）：

```bash
banetop -s genpara molecule.mol2
```

### 从 fchk 生成 Gaussian 可用参数（-g fchk）

从 `fchk` 出发生成 Gaussian 可用的 MM 参数与输入片段：

```bash
banetop -g fchk calculation.fchk
```

该模式面向 “已有量化结果 + 需要构建/补全 MM 参数” 的工作流。

> 注：若目录中没有同名 `.mol2`，程序可在配置正确且安装了 Open Babel 时尝试自动转换生成。

### 从 rtp 生成 Gaussian 可用参数（-g rtp）

当你已经有 Sobtop 生成的 `.rtp` 时，可直接转换得到 Gaussian 可用参数：

```bash
banetop -g rtp molecule.mol2 molecule.rtp
```

该模式适用于：Sobtop 已完成类型指认与参数生成，需要进一步适配 Gaussian 参数格式/单位体系的场景。


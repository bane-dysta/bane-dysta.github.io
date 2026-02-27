---
title: Starte
summary: Gaussian external：TD-DFT 激发态优化的态跟踪（adiabatic / SDNTO）
---

Last Update: 2025/11/20

Starte 是一个面向 **Gaussian external** 接口的激发态优化辅助程序：在 TD-DFT 几何优化过程中提供“态跟踪（state tracking）”，用于减少态交叉/态重排导致的跳态问题，让优化过程更稳定、更可控。

Starte 支持两类工作方式：

- **Adiabatic（绝热态）**：按给定 `root` 计算梯度，等价于“始终跟随第 n 个激发态标签”。
- **SDNTO（透热态 / diabatic 跟踪）**：在每一步对候选态做 NTO 相似性（SNTO）判别，自动选择“与上一几何最相似的态”继续跟随，用于在交叉区域保持同一电子性质的态不丢。

> 透热态模式的完整流程（iter1/iter2+ 的选择、近简并 5% 消歧、opt+freq 分支等）见 [post55](https://bane-dysta.top/posts/55/)。

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [安装](#安装)
- [依赖](#依赖)
- [使用方式](#使用方式)
- [参数](#参数)
  - [Starte 参数](#starte-参数)
  - [Gaussian 参数](#gaussian-参数)
- [示例](#示例)
- [输出与排错](#输出与排错)

<!-- /TOC -->

## 安装

release：[starte](/_file/55/starte_static.7z)

安装：解压后将`starte`可执行文件加入 `PATH` 或者在 Gaussian route 中使用相对/绝对路径调用即可。

## 依赖
下列两个计算SNTO的方案二选一：
* [baneSNTO（推荐）](https://bane-dysta.top/software/banesnto/)：Starte 直接调用 baneSNTO 生成 NTO 并做 SNTO 匹配（`banesnto=.T.`）
* [banewfn](https://bane-dysta.top/software/banewfn/) + Multiwfn：Starte 通过 banewfn 驱动 Multiwfn 来完成 NTO 与重叠积分（`banesnto=.F.`）

## 使用方式

1. 在 Gaussian route 行加入 external，例如：

```text
# opt(...) nosymm td(...) external='./starte_static'
```

2. 在 gjf 的 comment block（标题下面那块）写入 Starte 参数与 Gaussian 控制参数（见下一节）。
3. 正常提交 Gaussian 作业即可。Starte 会在每一步被 Gaussian 调用，完成：

   * 生成/读取所需文件
     -（若启用 SDNTO）计算候选态的 SNTO 相似性并选根
   * 输出该步应采用的 root 并返回梯度给 Gaussian

## 参数

> 所有参数均写在 gjf comment block（route 行下面那段文本），按 `key=value` 或 `key=...` 形式给出。

### Starte 参数

| 参数          | 默认值   | 说明   |
| ----------- | ----- | ----- |
| `sdnto`     | `.F.` | 是否启用 SDNTO 透热态跟踪  |
| `sntofirst` | `.F.` | iter2+：`.F.` force-first（先算力，若跳态则重算）；`.T.` sp-first（先单点+SNTO，再按正确 root 算力） |
| `banesnto`  | `.T.` | `.T.` 用 baneSNTO；`.F.` 用 banewfn+Multiwfn   |
| `ntothre`   | `0.3` | NTO 本征值阈值  |
| `sntorange` | `-1`  | SNTO 搜索范围：`-1` 用 `nadd`；`>=0` 用 `root±x`（并自动截断到 1..nstate）|
| `inttype`   | `1`   | 重叠积分形式：`1` 直接重叠；`2` 模重叠   |
| `debug`     | `.F.` | 调试输出 |

### Gaussian 参数

| 参数        | 说明                              |
| --------- | ------------------------------- |
| `mem`     | 内存设置（`%mem=` ）                  |
| `nproc`   | 核数设置（`%nprocshared=` ）          |
| `method`  | 泛函                              |
| `basis`   | 基组                              |
| `root`    | 初始 root                         |
| `nadd`    | `nstate = root + nadd`（候选态数量控制） |
| `triplet` | 是否三重态 TDDFT                     |
| `extra`   | 额外关键字（原样拼到 route 中）             |

## 示例

```text
%nprocshared=16
%mem=8GB
# opt(nomicro) nosymm td external='./starte_static'

method=pbe1pbe basis=6-31+g* root=1 nadd=4 extra='int=fine'
sdnto=.t. banesnto=.t. sntorange=2 inttype=2

0 1
...
```

## 输出与排错

* 建议 Gaussian 加 `nosymm`，减少标准取向/对称性处理带来的不一致。
* 若在交叉区域仍出现明显跳态：

  * 优先减小 opt 步长（例如 maxstep）
  * 增大候选态范围（`nadd` 或 `sntorange`）
  * 在近简并频发体系上优先用 `sntofirst=.T.`（先判态再算力）
* `debug=.T.` 会输出更完整的中间文件与判据，便于复现问题。




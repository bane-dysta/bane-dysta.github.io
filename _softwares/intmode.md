---
title: intmode
summary: Gaussian 重组能分解到冗余内坐标，输出键长、键角、二面角的贡献比例
math: true
---

Last Update: 26/2/27

intmode 是一个命令行工具，用来解析 Gaussian 的输出文件，并把重组能写成冗余内坐标的分解结果。程序会给出每一条键长、每一个键角、每一个二面角对总重组能的贡献百分比，同时也会把键长、键角、二面角三类贡献分别加总，方便快速判断结构变化主要来自哪一类自由度。

项目地址：https://github.com/bane-dysta/intmode  
公社介绍贴：http://bbs.keinsci.com/forum.php?mod=viewthread&tid=57134&fromuid=63020

公社贴附件提供了三个压缩包与源码文件。源码文件名为 intmode.cpp。预编译版与示例文件在 intmode.7z 里。Windows 用户可以直接使用 win.7z，这个版本由 mingw 编译。

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [原理](#原理)
  - [重组能的模式分解](#重组能的模式分解)
  - [简正模式到冗余内坐标的分解](#简正模式到冗余内坐标的分解)
- [安装](#安装)
- [Gaussian 计算设置](#gaussian-计算设置)
- [运行](#运行)
- [输出](#输出)
  - [lambda.dat](#lambdadat)
  - [intmode.dat](#intmodedat)
  - [int\_lowfreq.dat](#int_lowfreqdat)
- [绘图与整理](#绘图与整理)
- [常见问题](#常见问题)

<!-- /TOC -->

## 原理

### 重组能的模式分解

在简正坐标下，重组能可以写成各振动模式贡献之和：

$$
\lambda = \sum_{i=1}^{3N-6} S_i \hbar \omega_i
$$

这里的 $S_i$ 是第 $i$ 个模式的 Huang–Rhys 因子，$\omega_i$ 是该模式的频率。Gaussian 在 FCHT 输出中能够打印每个模式的 Huang–Rhys 因子，所以可以得到每个模式对 $\lambda$ 的贡献。

Huang–Rhys 因子与简正坐标位移的关系为：

$$
S_i = \frac{1}{2}\omega_i \Delta Q_i^2
$$

### 简正模式到冗余内坐标的分解

Gaussian 在使用 freq=intmodes 时，会打印每个振动模式在冗余内坐标上的权重，并且权重以百分比形式给出。intmode 会读取这些权重，并把每个模式的重组能贡献按权重分配到对应的冗余内坐标上。把所有模式累加以后，就能得到每个冗余内坐标对总 $\lambda$ 的贡献百分比。程序最后还会把键长、键角、二面角三类的贡献分别求和，输出三类占比。

## 安装

intmode 没有外部依赖，只需要支持 C++11 的编译器即可。Linux 与 macOS 直接编译：

```bash
g++ -O2 -std=c++11 -o intmode intmode.cpp
```

Windows 用户可以使用公社贴提供的 win.7z 预编译版本。如果希望自行编译，建议使用 mingw-w64 并开启 C++11 支持。

## Gaussian 计算设置

要让 intmode 能正常工作，你的 Gaussian 输出文件里必须同时包含两部分信息。第一部分是冗余内坐标权重信息，它来自 freq=intmode 或 freq=intmodes 的打印。第二部分是 Huang–Rhys 因子信息，它来自 FCHT 输出中的 print=huangrhys。缺少任意一部分，程序都无法完成分解。

输入文件示例：

```
%oldchk=opt_Azulene.chk
#p geom=allcheck freq(readfc,fcht,readfcht,intmode) IOp(7/75=-1)

initial=source=chk final=source=chk spectroscopy=onephotonemission print=(huangrhys,matrix=JK)

td_Azulene.chk
opt_Azulene.chk
```

要点：
- `freq(...,intmode)` 与 `IOp(7/75=-1)`让Gaussian输出冗余内坐标权重
- `print=huangrhys` 让Gaussian输出Huang–Rhys因子。

## 运行

Gaussian 任务结束后，对 log 文件直接运行即可：

```bash
./intmode huang-rhys.log
```

程序只接受一个参数，也就是 Gaussian 输出文件路径。

## 输出

intmode 会在屏幕打印排序后的贡献表，同时写出三个数据文件，文件名固定为 lambda.dat、intmode.dat、int\_lowfreq.dat。下面展示一次实际运行得到的文件片段，字段名与排列顺序保持程序原样。

### lambda.dat

```text
# Reorganization Energy Analysis
# Input file: intmode.log
#
# Mode  Frequency(cm-1)  Huang-Rhys  Lambda(cm-1)  %Contribution
     1       19.916900    4.952550e-06        0.000099        0.0000
     2       26.509300    3.773510e-06        0.000100        0.0000
     3       35.085900    2.918050e-05        0.001024        0.0001
     4       36.195700    1.224600e+00       44.325254        2.2643
     8      101.352800    8.600910e-02        8.717263        0.4453
    22      381.915500    1.326090e-01       50.645433        2.5871

...

#
# Summary:
# Total lambda: 1957.5862 cm-1
# Low freq (<200 cm-1) lambda: 58.3652 cm-1
# Low freq percentage: 2.98 %
# Low freq mode count: 15
```

这个文件面向振动模式层面的分析，用于绘制常见的λ/Huang-Rhys因子 vs 振动模式柱形图。

### intmode.dat

```text
# Internal Coordinate Contributions to Reorganization Energy
# Input file: intmode.log
#
# Coordinate  Type  Definition  Contribution(%)
#
# R coordinates:
       R21     R              R(10,11)      3.093960
       R18     R                R(8,9)      2.252255
       R12     R                R(5,6)      2.190783
       R23     R              R(11,12)      1.802210
       R14     R                R(6,7)      1.466665

...

#
# Summary:
# A_total: 58.9274 %
# D_total: 7.2384 %
# R_total: 33.6237 %
```

这个文件面向冗余内坐标层面的分析。R、A、D 三类坐标会分段输出，并在各自段落里按贡献从大到小排序。文件末尾的 Summary 给出三类总贡献，用来绘制常见的键长键角二面角饼图。

### int_lowfreq.dat

```text
# Low-frequency Internal Coordinate Contributions
# Input file: intmode.log
# Threshold: <= 208.5 cm-1
# Modes included: 15
#
# Coordinate  Definition  Contribution(%)
       D67        D(13,14,22,23)      3.817523
       D69        D(15,14,22,23)      3.741567
       D65        D(22,14,15,16)      3.131356
       D63        D(13,14,15,16)      3.070356
       D39          D(8,7,10,11)      2.754418

...
```

这个文件只统计低频范围内的贡献，并把低频范围内的内坐标贡献按从大到小排序。注意两个文件使用的低频阈值写法不同。lambda.dat 的 Summary 使用小于 200 cm-1。int_lowfreq.dat 使用小于等于 208.5 cm-1。它们分别对应模式层面的低频统计与低频范围内的内坐标排序。

## 绘图与整理

如果你关心重组能由哪些振动模式主导，直接用 lambda.dat 画图最方便。横轴用模式编号或频率，纵轴用 Lambda 或 %Contribution 都可以。如果你关心结构变化集中在哪些键、角与二面角，直接用 intmode.dat 抽取 Top-N 作条形图最直观。若想专门讨论低频主导的结构变化，就用 int\_lowfreq.dat 的排序结果定位贡献最大的内坐标，再回到结构上标注对应的键、键角或二面角。

## 常见问题

如果总贡献不是严格 100%，通常是因为 Gaussian 输出的权重是百分比形式，叠加时会受到数值打印精度与输出截断的影响。总和接近 100% 即正常。如果结果为空，优先检查 Gaussian 输出是否同时包含冗余内坐标权重段落与 Huang–Rhys 因子段落。两者缺一都会导致无法完成分解。



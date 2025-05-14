---
layout: page
title: oniom
date: 2025-5-14 12:00:00 +0800
---

## UFF
最省事的一集
```
# opt oniom(hf/3-21g:uff) geom=connectivity

Title Card Required

0 1 0 1 0 1
 C-C_3            0    0.26396373   -0.76918113    1.35914510 L
 S-S_3+2          0    0.26396373    0.42288469    0.00000000 L
...

 H-H_             0    3.09572041    3.06530397   -3.12155991 H
 H-H_             0    4.11373536    1.90760083   -2.19496084 H
 H-H_             0    2.30436088    1.82578593   -2.08403683 H

 1 2 1.0 5 1.0 6 1.0 7 1.0
 2 3 1.0 4 2.0
...

 18
 19
 20

```

## Amber
首先，原子类型的指定是第一个问题：
```
# opt oniom(hf/3-21g:amber=SoftFirst) geom=connectivity

Title Card Required

0 1 0 1 0 1
 C-CT             0   -1.77321200   -1.40136100   -0.60878200 L
 S-               0   -1.78789000    0.09788200    0.43239600 L
 C-CT             0   -1.96683100    1.25588300   -0.96720800 L
 O-               0   -3.30457900    0.01966700    0.67268000 L
 H-H1             0   -0.82770000   -1.43975400   -1.18771800 L
 H-H1             0   -1.82487700   -2.29705200    0.04405400 L
 ...

```
像这个`S- `就是没能指认S的原子类型，需要手动指认。既然指认不了基本上就是缺参数，填上默认的拉倒吧。

继续提交，显然，刚刚瞎指认的类型是找不到力场参数的：
```
 Include all MM classes
 Bondstretch undefined between atoms      2      4 S-O [L,L]  
 Bondstretch undefined between atoms     12     14 S-O [H,H] *
 Angle bend  undefined between atoms      1      2      4 CT-S-O [L,L,L]  
 Angle bend  undefined between atoms      3      2      4 CT-S-O [L,L,L]  
 Angle bend  undefined between atoms     11     12     14 CT-S-O [H,H,H] *
 Angle bend  undefined between atoms     13     12     14 CT-S-O [H,H,H] *
 * These undefined terms cancel in the ONIOM expression.
 MM function not complete
 Error termination via Lnk1e in /apps/gaussian16//g16/l101.exe at Wed May 14 09:22:55 2025.
 Job cpu time:       0 days  0 hours  0 minutes  9.1 seconds.
 Elapsed time:       0 days  0 hours  0 minutes  0.3 seconds.
 File lengths (MBytes):  RWF=      6 Int=      0 D2E=      0 Chk=      2 Scr=      1
```
这个时候就要手动补力场参数了。

使用sobtop导出参数文件，找到缺的项：
```
 Number of bonds:       9
    ...
    5       2S     3C         1.807843          1766.744          422.262
⇒  6       2S     4O         1.515343          4175.575          997.986
    7       3C     8H         1.097269          3163.068          755.991
    8       3C     9H         1.098274          3140.462          750.588
    9       3C    10H         1.098522          3134.395          749.138
 
 Number of angles:      15
    #         Atoms           Angle (Deg.)   k (kJ/mol/rad^2  kcal/mol/rad^2)
    ...
    7    1C     2S     3C        97.4939          1768.385         422.654
⇒  8    1C     2S     4O       105.7596          1191.309         284.730
    9    3C     2S     4O       105.7596          1191.309         284.730
    ...
```
力场参数写在拓扑关系的后面，同时加上amber=SoftFirst读取参数：
```
# opt oniom(hf/3-21g:amber=SoftFirst) geom=connectivity
...

 18
 19
 20

HrmStr1 S O 997.986  1.515343
HrmBnd1 CT S O  284.730   105.7596

```
这样理论上就应当可以正常进行计算了。



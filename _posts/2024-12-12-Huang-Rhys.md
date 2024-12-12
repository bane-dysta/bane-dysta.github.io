---
title: "Study note：Huang-Rhys因子的计算方法"
date: 2024-12-12 12:00:00 +0800
categories: [Quantum Chemistry,note]
tags: [note,Huang-Rhys]   
math: true     
---
## Gaussian
输入文件：
```
%oldchk=final.chk
#p geom=allcheck freq(readfc,fcht,readfcht)

initial=source=chk final=source=chk spectroscopy=onephotonemission
print=(huangrhys,matrix=JK)

initial.chk
final.chk
```
其中：
initial.chk为含有S1态freq信息的chk文件，final.chk为含有S0态freq信息的chk文件。

该任务计算振动分辩光谱可能失败，但Huang-Rhys因子会正常打印出来。
## ORCA
```
! wb97x-d3 DEF2-SVP TIGHTSCF ESD(fluor) 
%maxcore  3125
%pal nprocs   64 end
%TDDFT 
    NROOTS 5 
    IROOT 1 
END 
%ESD 
    GSHESSIAN "IPR.hess" 
    ESHESSIAN "td-IPR.hess" 
    PRINTLEVEL 4
    COORDSYS CARTESIAN
    USEJ TRUE
    LINES      VOIGT
    LINEW      75
    INLINEW    200
END 
* XYZFILE 0 1 IPR.xyz
```

其中：
 - ESD(fluor)：可选fluor、abs
 - GSHESSIAN "IPR.hess" & ESHESSIAN "td-IPR.hess" ：提供hess文件后默认AH模型，Fchk2hess脚本：[fhess.py](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2024/11/fhess.py)
 - PRINTLEVEL 4：要求打印Huang-Rhys Factor
 - COORDSYS：切换坐标模式。可选项
  
   |     KEYWORDS      |                        EXPLAIN                         |
   | :---------------: | :----------------------------------------------------: |
   |     CARTESIAN     |                           -                            |
   | INTERNAL(default) |                   Baker delocalized                    |
   |       WINT        | for weighted internals following Swart and Bickelhaupt |
   |       FCWL        |        force constant weighted following Lindh         |
   |       FCWS        |    same as before, but using Swart’s model Hessian     |

ORCA默认采用Delocalized Internal Coordinate，消除了duschinsky混合的影响。因此基于四种INTERNAL计算的Huang-Rhys都会非常接近0。想要利用Huang-Rhys Factor判断振动模式与声子的耦合，需要手动切换为CARTESIAN。

## FCclasses3
```
$$$
PROPERTY = EMI ; OPA/EMI/ECD/CPL/RR/TPA/MCD/IC 
MODEL = AH ; AS/ASF/AH/VG/VGF/VH 
DIPOLE = FC ; FC/HTi/HTf 
TEMP = 298.0 ; (temperature in K) 
BROADFUN = GAU ; GAU/LOR/VOI 
HWHM = 0.01 ; (broadening width in eV) 
METHOD = TD ; TI/TD 
NORMALMODES = COMPUTE ; COMPUTE/READ/IMPLICIT 
COORDS = CARTESIAN ; CARTESIAN/INTERNAL 
STATE1_FILE = td_YMT-.fcc
STATE2_FILE = opt_YMT-.fcc 
ELDIP_FILE = eldip_td_YMT-_fchk
```
输入文件都可以从fchk文件中获得，用fcc工具转换一下格式就行。笔者写过一个[脚本](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=49173&fromuid=63020)，可以生成输入文件。
---
title: "Study note：振动分辨光谱+Huang-Rhys因子的计算"
date: 2024-12-12 12:00:00 +0800
categories: [Quantum Chemistry,note]
tags: [note,Huang-Rhys]   
math: true     
---
## Gaussian
gaussian只支持笛卡尔坐标系下的计算，此时若体系激发时存在基团旋转，算出的重组能会无比巨大，甚至远超激发能，顺带着也把Huang-Rhys因子弄得很大。输入文件：
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

若低频振动对跃迁贡献大，该任务计算振动分辩光谱可能失败，但Huang-Rhys因子会正常打印出来，需要自行去除低频模式。虽然普适性差些，但优点是Gaussian算的很快。

### 绘图
打开log文件，results-vibronic打开振动分辨光谱，右键save data保存。
```
# Vibronic OPE - Temperature 0 K
# X-Axis:  Wavelength (nm)
# Y-Axis:  Intensity (10-6 J mol-1)
# Y-Axis2: Dipole Strength (a.u.)

# Peak information
#                  X                   Y                  Y2
#     577.9447365082        0.9445000000     8701.7956724077
#     577.3780630505        0.3413000000     3156.8714869060
#     576.6340978538        0.3927000000     3651.8892444737
#     574.2297065944        0.7972000000     7537.6879787870
#     573.3779318921        0.3392000000     3223.9618056972
#     571.7586591377        0.2586000000     2485.9682989937
#     571.4925524691        0.3016000000     2903.0162266149
#     570.5839734682        0.2800000000     2716.2512851150
#     570.3580614942        8.0760000000    78459.4079485477

# Spectrum
#                  X                   Y              ~DY/DX
      555.1593599099        0.0000000000        0.1357497010
      556.1473612318        2.2486700000        3.0473920206
      556.8906730998        5.2759900000        5.3165190126
      557.3873191787        8.8409300000        8.1442347301
      557.6359745555       11.3459000000       12.8132283388
      558.1339514674       18.4077000000       16.0156768883
      558.3832735978       23.3144000000       21.8725584965
      558.6328185754       29.3192000000       26.8168409059

```
得到的txt文件第一部分是跃迁线，第二部分是光谱，使用origin对前两列绘图。

首先用第二部分数据绘制光谱。绘制完毕后，在插入-新图层(轴)中点击右Y轴(关联X轴的刻度和尺寸)建立新图层，在图层2中对第一部分数据绘图，即可得到有振动跃迁指示的振动分辨光谱。

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

优点是支持DIC，缺点是考虑HT效应时要算频率，ORCA截至6.0.1仍不支持激发态解析Hessian，要使用数值频率，这非常抽象，会导致一个振动分辨光谱要算十几几十个小时。

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

优点是灵活，但FCclasses3的内坐标不是DIC，算激发时基团旋转的体系要差一些。
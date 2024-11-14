---
layout: page
title: "orca任务记录"
date: 2024-11-1 12:00:00 +0800
hidden: true
---

### FCHT计算

输入文件示例：

~~~
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
    COORDSYS fcwl
    USEJ TRUE
    LINES      VOIGT
    LINEW      75
    INLINEW    200
END 
* XYZFILE 0 1 IPR.xyz
~~~

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

### SF-TDDFT找MECI

输入文件示例：

~~~
! ci-opt WB97X-D3 def2-SVP rijcosx def2-SVP/c miniprint # 话说def2-tzvp/c能加速tddft吗？输出文件里面好像并没有体现tddft应用了/C辅助基组。
%maxcore 4000
%pal
 nproc 40
end
%tddft
 sf true # 使用SF-TDDFT。
 nroots 5
 iroot 2 # SF-TDDFT的基态是1号，第一激发态是2号。
 jroot 1
end
%geom
 maxstep 0.05 # 经验表明，优化交叉点，步长不能太长，否则容易振荡。
 trust -0.05
end
*xyzfile 0 3 CASprobe.XYZ # SF-TDDFT 的参考态必须设为高自旋态。我的体系是单重态，所以参考态要设为三重态（应该也可以是五重或更高，没试
~~~

### CASSCF

DLPNO-NEVPT2 示例：
~~~
! DLPNO-NEVPT2 cc-pVTZ cc-pVTZ/JK  miniprint noautostart
%maxcore 12500
%pal nprocs 8 end
%casscf
nel 6
norb 6
nroots 4
weights[0] = 1,1,0,0
end
%moinp "gs_CN2_NEVPT2.gbw"
*xyzfile 0 1 abs_benzene-kun-ToneTo2CN-probe.xyz
~~~


### CCSD

CCSD/cc-pVDZ示例：
~~~
! CCSD cc-pVDZ tightSCF opt noautostart miniprint nopop
%maxcore  3000
%pal nprocs  32 end
*xyzfile 0 1 YMT-.xyz
~~~

### SOC计算
输入文件示例：
~~~
! WB97X-D3 def2-SVP miniprint tightSCF
%pal
nprocs 32
end
%maxcore 3000
%tddft
nroots 5
dosoc true
tda false
printlevel 3
end

* xyzfile 0 1 coumarin.xyz
~~~



###







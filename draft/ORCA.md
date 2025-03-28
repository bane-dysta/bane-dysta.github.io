---
layout: page
title: "orca任务记录"
date: 2024-11-1 12:00:00 +0800
---

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

## 2. Coupled Cluster系列

### 1. CCSD

ORCA的CCSD有解析梯度，做几何优化示例：
~~~
! CCSD cc-pVDZ tightSCF opt noautostart miniprint nopop
%maxcore  3000
%pal nprocs  32 end
*xyzfile 0 1 YMT-.xyz
~~~

### STEOM-DLPNO-CCSD
高精度计算激发能的方法，对双激发和三激发有一定描述。对内存和IO的需求很大，对高于1500个基函数的分子，计算消耗指数增长。基组用到def2-TZVP(-f)就够
~~~
! STEOM-DLPNO-CCSD RIJK def2-TZVP(-f) def2/JK def2-TZVP/C noautostart miniprint nopop
%maxcore  6250
%pal nprocs  16 end
! CPCM(Ethanol)
%mdci
nroots 3
DoSolv true
end
* xyzfile -1 1 YMT-.xyz
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

double check

http://bbs.keinsci.com/forum.php?mod=viewthread&tid=49196&highlight=DSD




---
layout: page
title: CIopt
date: 2024-11-1 12:00:00 +0800
---
## sobMECP
从原理上讲，DFT没有办法正确描述圆锥交叉点，只能勉强描述圆锥避免交叉。要使用sobMECP搜索圆锥避免交叉，首先要把能量收敛判据给删掉。找到：
```
IF (PConv(1) .and. PConv(2) .and. PConv(3) .and. PConv(4) .and. PConv(5)) THEN
    Conv = 1
ELSE
    Nstep = Nstep + 1
END IF
```
改为
```
IF (PConv(1) .and. PConv(2) .and. PConv(3) .and. PConv(4)) THEN
    Conv = 1
ELSE
    Nstep = Nstep + 1
END IF
```
然后准备头文件。对于静态相关比较强的圆锥避免交叉，最好用纯泛函来描述：
```
%mem=192GB
%nproc=64
%chk=S1.chk
#n MN15L/6-31g* td force guess(read)

Second State

1 1
```
由于使用TDDFT计算state2，需要一个extract_energy2文件：
```
{
	if ($3 == "E(TD-HF/TD-DFT)") {
		print $5
	}
}
```
完成后，依次运行：
```
./prepare.sh
./runfirst.sh
./runMECP.sh
```

## SF-TDDFT
参考态需要三重态。准备好xyz文件，使用ORCA输入文件：
~~~
! CI-opt WB97X-D3 def2-SVP RIJCOSX def2-SVP/C miniprint 
%maxcore 3000
%pal
 nproc 32
end
%tddft
 sf true
 nroots 5
 iroot 2 
 jroot 1
end
%geom
 maxstep 0.05
 trust -0.05
end
*xyzfile 0 3 probe.xyz

~~~
NOTE：SF-TDDFT的基态是1号，第一激发态是2号。

## MRSF-TDDFT
首先，要在RODFT下计算一个三重态作为参考态。

```
%chk=SRR.chk
%mem=96GB
%nprocshared=32
#p ROBHandHLYP/6-31g* nosymm int=nobasistransform

title

1 3
 C                 -0.59562400   -0.17774100    0.00000000
 C                  0.04669800   -0.09509800    1.24125300
...

```

> 这里用的基组一会还要做opt，不要太大

将收敛的波函数传给GAMESS：

```
fch2inp SRR.fchk -mrsf
```
产生的inp文件中，`MWords`是每个核分配的内存，类似于ORCA的%maxcore，但单位为MW(1MW=8MB)，可能需要修改：
```
 $CONTRL SCFTYP=ROHF RUNTYP=ENERGY ICHARG=1 MULT=3 NOSYM=1 ICUT=11
  MAXIT=200 DFTTYP=BHHLYP TDDFT=MRSF $END
 $SYSTEM MWORDS=600 $END
 $SCF DIRSCF=.T. $END
 $GUESS GUESS=MOREAD NORB=640 $END
 $DFT NRAD0=99 NLEB0=590 NRAD=99 NLEB=590 $END
 $TDDFT NSTATE=5 $END
 $DATA
GAMESS inp file produced by MOKIT,na=136,nb=134,nif=640,nbf=640
...

```

运行命令：

```
rungms SRR-CI.inp 00 64 > SRR-CI.gms
```

其中第一个数字是版本号，第二个数字是并行核数。该文件是单点计算，可能耗时稍高于普通TDDFT单点。由于使用了Gaussian传递轨道，SCF通常会在几圈内收敛。然而，由于GAMESS的SCF收敛性并不出色，也可能出现这种情况：

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2024/12/20241222235859.png)

笔者将该GAMESS计算45分钟迭代200圈后收敛失败的结构交给Gaussian，被Gaussian用1分45秒，30圈拿下，只能说Gaussian不愧是主流量化程序。这种情况下，也许可以尝试切换SCF算法：
```
 $SCF DIRSCF=.T. DIIS=.F. SOSCF=.T. $END
```
如果还是不行，建议求助大师。这里假设顺利运行完毕，在输出文件中找到：

```
          ----------------------------
          SUMMARY OF MRSF-DFT RESULTS
          ----------------------------

   STATE             ENERGY     EXCITATION      <S^2>    TRANSITION DIPOLE, A.U.  OSCILLATOR
                    HARTREE         EV                      X        Y        Z    STRENGTH

 1 NEGATIVE ROOT(S) FOUND.
   1  A        -1608.7798225490   -1.153        0.0000   0.0000   0.0000   0.0000   0.0000
   0  A        -1608.7374375718    0.000               (REFERENCE STATE)
   2  A        -1608.6970167917    1.100        0.0000   0.0000  -0.0000   6.4967   2.3300
   3  A        -1608.6757530133    1.679        0.0000  -0.1573  -0.0340   0.0000   0.0018
   4  A        -1608.6528024556    2.303        0.0000  -0.0000  -0.0000  -0.9923   0.0834
   5  A        -1608.6417893495    2.603        0.0000  -1.0486  -0.1358   0.0000   0.1029
```

要优化S0与S1的势能面交叉点，即搜索态1和态2的圆锥交叉，将输入文件改为：

```
 $CONTRL SCFTYP=ROHF RUNTYP=CONICAL ICHARG=1 MULT=3 NOSYM=1 ICUT=11
  MAXIT=200 DFTTYP=BHHLYP TDDFT=MRSF $END
 $SYSTEM MWORDS=600 $END
 $SCF DIRSCF=.T. $END
 $GUESS GUESS=MOREAD NORB=640 $END
 $DFT NRAD0=99 NLEB0=590 NRAD=99 NLEB=590 $END
 $CONICL OPTTYP=PENALTY IXROOT(1)=1,2 SIGMA=8.0 $END
 $TDDFT NSTATE=5 $END
 $DATA
GAMESS inp file produced by MOKIT,na=136,nb=134,nif=640,nbf=640
...

```
再次提交计算。

这玩意很难收敛，也不知道是GAMESS的问题还是圆锥交叉本身难找的问题。若计算失败想改变SIGMA值续跑，可以去临时文件目录找到输入文件同名的.dat文件，其中有当前结构坐标。把该坐标复制出来，写成RODFT输入文件，重复上述步骤再次提交计算即可。








---
title: Gaussian入门：激发态计算
date: 2024-11-2 12:00:00 +0800
categories: [Calculation, Quantum Chemistry]
tags: [Gaussian]     
---
计算激发态的理论方法很多，上至EOM-CCSD，下至sTDA-xtb，各有特色，不过目前最常用的计算方法还要属TD-DFT。截至目前，ORCA 6.0.0版本仍未支持TD-DFT的解析Hessian，而且在溶剂模型的支持上做的不尽人意，因此当下Gaussian仍然是进行TD-DFT任务最好的软件，也是研究激发态首先应当掌握的软件。总之，本文将简单介绍如何用Gaussian进行TD-DFT水平的结构优化以及单点能计算。

进阶的激发能计算笔记：[Study notes：精确计算激发能的方法](https://bane-dysta.github.io/posts/excitation_energy/)
## 1. 结构准备
对于几何优化，若没有特殊需求，一般取S<sub>0</sub>极小点结构进行激发态优化的初猜结构，S<sub>0</sub>极小点结构优化方法参考[Gaussian入门：几何优化、振动分析和能量计算](https://bane-dysta.github.io/posts/Gaussian_opt/)。

对于激发能计算，可以采用S<sub>0</sub>极小点结构计算，此时得到的激发能对应S<sub>0</sub>吸收情况；也可以采用某激发态极小点结构计算，此时得到的激发能对应发射情况。

##  2. 计算设置
```
%mem=16gb                           //分配内存
%nproc=6                            //分配CPU核心数
%chk=D:\test\Coumarin-td.chk        //chk文件保存路径
# opt td freq wB97XD/def2SVP        //关键词行

title                               //title行

 0 1                                //电荷与自旋多重度
O          -1.05750         1.12680         0.00040
O          -3.31910         0.76440        -0.00070
C           0.44750        -0.78620        -0.00010
...
H           3.45870         1.67230         0.00000
H          -2.81290        -1.79660         0.00060

                                    //几何坐标输入结束后，留空两行
```
### 2.1 计算级别
根据电荷转移情况的不同，可以将价层激发分为两类：
- 局域激发(LE激发)：特征为电子被激发前后，其分布区域没有明显变化。
- 电荷转移激发(CT激发)：特征为电子被激发后，分布区域发生了明显转移。

具体属于什么激发，需要根据经验判断，或是进行计算后进行分析和指认。图解参考[Sobereva老师的博文](http://sobereva.com/284)。对于电荷转移特征不同的激发态，需要格外注意泛函的选择。对于LE激发，PBE0表现不错，误差约在0.1~0.3eV，B3LYP也还行。而对于CT激发，由于传统的DFT泛函对长程行为描述失败，需要使用长程校正泛函ωB97X-D或cam-B3LYP进行计算，HF成分高的M062X也可以考虑。

> 如果你想直接对比基态与激发态的结构，如分析体系激发前后BLA的变化规律，则**计算级别必须统一**。而如果只需要得到激发能、跃迁情况等，则基态与激发态的结构优化级别无需统一。
{: .prompt-info }

基组的选择上，激发态大致与基态一致，不做额外补充了。

### 2.2 关键词
#### 激发态关键词
在Gaussian中，激发态的关键词是``td``，在基态任务的基础上加上td即可将基态的任务改为激发态的。td的常用选项有：
- Root=i：指定要计算第几激发态，默认为i=1。
- Singlet/Triplet/50-50：指定要计算单重态、三重态还是一起计算，默认为Singlet。
- Nstates=x：指定一共要计算多少个激发态，默认为x=3。推荐设定为i+2，i是要研究的态。
- Restart：用于重启任务。
- Eqsolv：是否计算平衡溶剂效应，对几何优化任务默认启用，对单点任务默认不启用。
- NonAdiabaticCoupling：指定是否计算非绝热耦合，对freq任务默认计算，对单点任务默认不计算。

对于仅研究第一激发态的情况来说，td的默认设置不需要更改，直接加上就行。

#### 任务关键词：
- 单点能：无关键词。注意是否需要使用td=eqsolv，若计算吸收情况则不需要，以激发态结构单独进行单点任务计算荧光情况则需要。
- 几何优化+频率分析：添加关键词``opt freq``。注意Gaussian 09不支持TD-DFT的解析Hessian，若用数值梯度计算freq，耗时不是一般的高。
- 核磁：目前Gaussian并不支持TD-DFT下计算激发态NMR，实在需要时，必须采用ΔSCF得到激发态波函数，再计算NMR。

### 2.3 溶剂模型
对于CT激发，尤其是TICT类分子，笔者不建议像类似基态那样先算气象构型再加溶剂算能量，**强烈建议在几何优化时就要恰当选择溶剂**，因为此时溶剂已经可以对分子的平衡结构产生可查觉的影响了。

除了线性响应模型外，还可以考虑校正的线性响应模型和态特定模型。根据[*Angew.Chem.Int.Ed.2020, 59,10160–10172*](https://onlinelibrary.wiley.com/doi/10.1002/anie.201916357)，计算TICT能垒使用基于校正线性响应(corrected-Linear Response, cLR)的SMD溶剂模型是最合适的，可以考虑使用IEFPCM溶剂模型优化结构，再用cLR-SMD计算能量。

### 2.4 其他
许多初学者执着于轨道，笔者曾经也是。然而TD-DFT任务产生的轨道是激发态极小点结构下DFT级别的KS轨道，并不是“激发态轨道”。经过半年时间的学习，笔者认为与自己当初想得到的“激发态轨道”最接近的概念可能是激发态的自然轨道(Natural Orbital, NO)。若要绘制NO，需要额外在激发态计算时添加关键词``density``，然后将计算得到的fch文件[用multiwfn导出NO轨道](http://sobereva.com/403)。


## 3.输出
通常来说，输出文件中笔者比较关心的部分位于末次TD-DFT计算，由“Excited State   1”起始的这一部分：
~~~
 Excited State   1:      Singlet-A      2.0573 eV  602.65 nm  f=0.8145  <S**2>=0.000
      79 -> 80         0.70269
 This state for optimization and/or second-order correction.
 Total Energy, E(TD-HF/TD-DFT) =  -1009.14907641    
 Copying the excited state density for this state as the 1-particle RhoCI density.
 
 Excited State   2:      Singlet-A      3.1635 eV  391.92 nm  f=0.0477  <S**2>=0.000
      78 -> 80         0.70027
 
 Excited State   3:      Singlet-A      3.4266 eV  361.83 nm  f=0.0997  <S**2>=0.000
      77 -> 80         0.69361
~~~
由输出可以看出，第一激发态的激发能是2.0573 eV，换算成波长是602.65 nm，振子强度是0.8145，S<sup>2</sup>算符的值为0，表明这个态是单重激发态。跃迁轨道对为79→80，可以从用multiwfn读取fchk文件观看对应轨道图像。E(TD-HF/TD-DFT)输出的是激发态的绝对能量

这些输出反映了基础的激发情况，若要得到更详细的信息，可以使用multiwfn对fchk文件和log文件进行进一步分析。




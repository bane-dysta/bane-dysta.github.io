---
layout: page
title: Study Note：激发态的分析
date: 2024-11-1 12:00:00 +0800
math: true  
---
记录下使用Gaussian与Multiwfn如何做激发态分析。

> 注意：理论部分内容是一位初学者的思考，未必完全正确，会随笔者学习理解过程随时更新。如果读者发现任何地方与已有认识不符，不要怀疑，一定是笔者理解有误，请务必在评论区指出！

## 跃迁密度
一个比较简单的抽象概念，定义：

$$
\rho_{ij}(r) = \psi_{i}^*(r)\psi_{j}(r)
$$

跃迁密度描述的是在空间位置r处态i与态j波函数的重叠程度，可以反映态i跃迁到态j的贡献权重。为了让Multiwfn绘制出跃迁密度等值面，我们需要进行TD-DFT计算：
```
%chk=ethene.chk
# td HF/def2TZVP

opted by HF/def2TZVP
...
```
然后取fchk与log文件，使用Multiwfn分析
```
ethene.fchk
18
1
ethene.log    // 载入log
1               // 分析第一激发态
1               // 可视化
1               // 此例乙烯 是小分子 low就够了
5               // 绘制跃迁密度等值面
```
最终效果：

[]!(https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/ethene_trimmed.png)

跃迁密度只出现在激发过程涉及的位置，且全空间积分为0，体现了跃迁过程中总体电子守恒。

Ref:
- [使用Multiwfn绘制跃迁密度矩阵和电荷转移矩阵考察电子激发特征](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=11383&fromuid=63020)
- [Gaussian中用TDDFT计算激发态和吸收、荧光、磷光光谱的方法](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=2413&fromuid=63020)
- [请问跃迁密度与电荷转移跃迁的关系](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=1467&fromuid=63020)

## 跃迁偶极矩密度
跃迁密度展示了偶极的雏形。回忆偶极矩的计算方法$ \mu = \boldsymbol{r} \times e $，要描述跃迁偶极，我们还需要引入位置和电荷两个量。这里我们首先对跃迁密度引入位置矢量$\boldsymbol{r}$，得到跃迁偶极矩密度: 

$$
\boldsymbol{\rho}_{ij}^{dip(r)}(r) = \psi_{i}^*(r) {\boldsymbol{r}} \psi_{j}(r)
$$

跃迁偶极矩密度反映了体系位置$\boldsymbol{r}$处对跃迁偶极矩的贡献。绘制跃迁偶极矩密度等值面时，Gaussian计算与前述一致。使用Multiwfn分析：
```
ethene.fchk
18
1
ethene.log    
1               
1               
1               // 到此处为止操作不变
6               // 绘制跃迁偶极矩等值面
{1,2,3,4}       // 根据需求选择绘制的分量
```
为了在三维空间展示出跃迁偶极矩密度等值面，我们每次只能绘制一个分量。假设乙烯双键的方向为X，垂直于双键方向为Y，垂直于乙烯平面的方向为Z，那么对于X分量，X=0平面将横穿乙烯分子，上侧的跃迁偶极矩乘以负值坐标，于是对应等值面发生了变号：
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/20250604224446.png)
由于跃迁密度关于Y=0平面反对称，Y分量的跃迁偶极矩是这样的：
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/20250604224841.png)
而Z方向跃迁密度与X方向一样关于Z=0对称，因此Z分量的分布也产生了变号：
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/ethene_z_trimmed.png)

跃迁偶极矩密度可以单独考察XYZ三个分量跃迁偶极矩贡献分布情况，实际用的比较少。除了绘制等值面图，还可以绘制矩阵热图：

```
ethene.fchk
18
2         // 绘制原子/片段跃迁矩阵的热图
ethene.log  
1
n
1         // 收缩模式1
-1        // 定义片段
0         // 读入外部文件
frag.txt  // 为了演示随便定义的，两个碳是片段1和3，两头氢原子是2和4
2         // 也可以用选项1来观看，5来改色彩刻度
```
此时当前目录下保存了刚刚绘制的热图
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/dislin.png)

看到对跃迁起贡献的是1和3，就是两个碳，因为是对称的所以没什么电荷转移。这里为了演示随便定义了一下，实际体系中可以按照需要进行划分。

## 跃迁偶极矩(TDM)
对跃迁偶极矩密度积分，并引入电荷，得到跃迁电偶极矩$\mu_{ij}^e$：

$$
\boldsymbol{\mu}_{ij}^e = -e \int \boldsymbol{\rho}_{ij}^{dip}(\boldsymbol{r}) d^3r
$$

或者定义跃迁电偶极算符：

$$
\hat{\boldsymbol{\mu}^e} = −e \hat{\boldsymbol{r}}
$$

则TDM表达式为：

$$
\boldsymbol{\mu}_{ij}^e = \langle \psi_i|\hat{\boldsymbol{\mu}^e}|\psi_j \rangle
$$

$\mu_{ij}^e$反映了分子吸收电磁辐射的能力，只有当$\mu_{ij}^e ≠ 0$时，跃迁才是电偶极允许的。若$\mu_{ij}^e = 0$，跃迁电偶极禁阻，意味着跃迁很难(也许能通过磁偶极跃迁、电四极跃迁)发生或根本不发生。

> 注意到计算TDM时对跃迁偶极矩密度进行了积分。当跃迁偶极矩密度等值面呈现奇对称时，积分结果为0，则跃迁禁阻，反之跃迁允许；
> 
> 由于跃迁偶极矩密度来自于跃迁密度，进一步反推可知当跃迁密度关于YZ平面对称时，由于$\boldsymbol{x}$是奇对称的，最终被积函数为奇×偶=奇函数，积分得到的X分量跃迁偶极矩将为0，对Y、Z分量同理；
> 
> 跃迁密度被定义为两个电子态波函数的积，可知两个电子态波函数的对称性可能最终影响跃迁是否能发生，这是对称性选择定则的来源。
{: .prompt-tip }

TDM的计算只需要Gaussian进行TD-DFT计算即可，在输出文件中将直接打印：
```
 Ground to excited state transition electric dipole moments (Au):
       state          X           Y           Z        Dip. S.      Osc.
         1         0.0000     -1.5153      0.0000      2.2960      0.4369
         2         0.0000      0.0000      0.3430      0.1176      0.0255
         3         0.0000      0.0000      0.0000      0.0000      0.0000
```
可以看到，S1只有Y分量的有非零TDM，与前面看到Y分量的跃迁偶极矩密度偶对称相符。

# Hole-Electron Analysis



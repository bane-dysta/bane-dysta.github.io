---
layout: page
title: 激发态的分析
date: 2024-11-1 12:00:00 +0800
---
使用Gaussian与Multiwfn做一些激发态分析。
## 跃迁密度
一个比较简单的抽象概念，定义：

$$
\rho_{ij}(r) = \psi_{i}^*(r) \times \psi_{j}(r)
$$

跃迁密度描述的是在空间位置r处态i与态j波函数的重叠程度，可以反映态i跃迁到态j的贡献权重。为了让Multiwfn绘制出跃迁密度等值面，我们需要进行TD-DFT计算：
```
%chk=transden.chk
# td HF/def2TZVP

opted by HF/def2TZVP
...
```
然后取fchk与log文件，使用Multiwfn分析
```
transden.fchk
18
1
transden.log    // 载入log
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
跃迁密度展示了偶极的雏形。回忆偶极矩的计算方法$ \mu = \bm{r} \times e $，要描述跃迁偶极，我们还需要引入位置和电荷两个量。这里我们首先对跃迁密度引入位置矢量$\bm{r}$，得到跃迁偶极矩密度: 

$$
\bm{\rho}_{ij}^{dip(r)}(r) = \psi_{i}^*(r)  \bm{r}  \psi_{j}(r)
$$

跃迁偶极矩密度反映了体系位置$\bm{r}$处对跃迁偶极矩的贡献。绘制跃迁偶极矩密度等值面时，Gaussian计算与前述一致。使用Multiwfn分析：
```
transden.fchk
18
1
transden.log    
1               
1               
1               // 到此处为止操作不变
6               // 绘制跃迁偶极矩等值面
{1,2,3,4}       // 根据需求选择绘制的分量
```
为了在三维空间展示出跃迁偶极矩密度等值面，我们每次只能绘制一个分量。假设乙烯双键的方向为X，垂直于双键方向为Y，垂直于乙烯平面的方向为Z，那么对于X分量，X=0平面将横穿乙烯分子，上侧的跃迁偶极矩乘以负值坐标，于是对应等值面发生了变号：
[]!(https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/20250604224446.png)
由于跃迁密度关于Y=0平面反对称，Y分量的跃迁偶极矩是这样的：
[]!(https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/20250604224841.png)
而Z方向跃迁密度与X方向一样关于Z=0对称，因此Z分量的分布也产生了变号：
[]!(https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/ethene_z_trimmed.png)

跃迁偶极矩密度等值面的对称性影响着跃迁是否禁阻，我们在下一节中讨论。
## 跃迁偶极矩
对跃迁偶极矩密度积分，并引入电荷，得到跃迁电偶极矩$\mu_{ij}^e$：

$$
\bm{\mu}_{ij}^e = -e \int \bm{\rho}_{ij}^{dip}(\bm{r}) d^3r
$$

或者定义跃迁电偶极算符$\hat{\mu^e}$：
$$
\hat{\bm{\mu}^e} = −e \hat{\bm{r}}
$$

则跃迁偶极矩表达式为：

$$
\bm{\mu}_{ij}^e = \langle \psi_i|\hat{\bm{\mu}^e}|\psi_j \rangle
$$

$\mu_{ij}^e$反映了分子吸收电磁辐射的能力。

由于位置矢量r本身是奇对称的，当跃迁偶极矩密度等值面呈现偶对称时(即$\psi_{i}^*(r) \times \psi_{j}(r)$为偶函数)，则被积函数为奇×偶=奇函数，积分结果为0，引起跃迁禁阻。

# Hole-Electron Analysis



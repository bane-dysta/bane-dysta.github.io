---
layout: page
title: Study Note：激发态的分析
date: 2024-11-1 12:00:00 +0800
math: true  
---
记录下使用Gaussian与Multiwfn如何做激发态分析。

> 注意：理论部分内容是一位初学者的思考，未必完全正确，会随笔者学习理解过程随时更新。如果读者发现任何地方与已有认识不符，不要怀疑，一定是笔者理解有误，请务必在评论区指出！
# 前线轨道(Frontier Molecular Orbital, FMO)
由于荧光通常感兴趣的激发态都是较低的价层激发，前线轨道常常是激发的主要参与者。我们可以利用Gaussian布居分析和TD-HF/TD-DFT计算打印的组态系数来检查参与激发的轨道，从而推断电子的流向。以乙烯为例，我们首先需要进行结构优化：
```
%chk=ethene.chk
# opt freq HF/def2TZVP
...
```
由于我们接下来会反复使用分子轨道的概念，这里就使用HF进行演示，避免杂化泛函给出一些偏离分子轨道理论的不美观的图形；实际研究体系时仍然应当根据体系选择合适的泛函。优化结构后，进行TD-HF/TD-DFT计算：
```
%chk=ethene.chk
# td HF/def2TZVP
```
log文件中会打印组态系数：
```
Excited State   1:      Singlet-BU     7.7662 eV  159.65 nm  f=0.4369  <S**2>=0.000
       8 ->  9         0.69503
 This state for optimization and/or second-order correction.
 Total Energy, E(TD-HF/TD-DFT) =  -77.7801148629    
 Copying the excited state density for this state as the 1-particle RhoCI density.
```
我们看到，乙烯的第一激发态由MO8 → MO9主导，组态系数0.69503，因此MO8 → MO9跃迁对S1的贡献大约是96.6%，我们可以通过MO8、9的形状来了解这个激发是什么性质。使用Multiwfn导出分子轨道：
```
ethene.fchk
200
3     // 导出分子轨道
h     // HOMO
1     // 小分子，低质量格点就够
3
l     // LUMO
1
```
HOMO是乙烯的$π$成键轨道：
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/h_trimmed.png)
LUMO是乙烯的$π$反键轨道：
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/l_trimmed.png)

由此，我们可以知道乙烯的S1激发时，双键会被削弱，此时中央C-C键应当可以自由旋转。

## 跃迁密度(Transition Density)
一个比较简单的抽象概念。如果假设激发态可以用单对MO跃迁来描述，则跃迁密度可以表示为：

$$
\rho_{ij}(r) = \psi_{i}^*(r)\psi_{j}(r)
$$

跃迁密度描述的是在空间位置r处态i与态j电子与空穴的重叠。为了让Multiwfn绘制出跃迁密度等值面，我们进行TD-HF/TD-DFT计算同上，然后取fchk与log文件，使用Multiwfn分析
```
ethene.fchk
18
1
ethene.log      // 载入log
1               // 分析第一激发态
1               // 可视化
1               
5               // 绘制跃迁密度等值面
```
最终效果：

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/ethene_trimmed1.png)
我们看到，跃迁密度只出现在激发过程涉及的位置。跃迁密度全空间积分为0，体现了跃迁过程中总体电子守恒。

Ref:
- [使用Multiwfn绘制跃迁密度矩阵和电荷转移矩阵考察电子激发特征](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=11383&fromuid=63020)
- [Gaussian中用TDDFT计算激发态和吸收、荧光、磷光光谱的方法](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=2413&fromuid=63020)
- [请问跃迁密度与电荷转移跃迁的关系](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=1467&fromuid=63020)

## 跃迁偶极矩密度(Transition Dipole Moment Density)
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

跃迁偶极矩密度可以单独考察XYZ三个分量跃迁偶极矩贡献分布情况，实际用的比较少。

## 跃迁偶极矩(Transition Dipole Moment, TDM)
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
> 由于跃迁偶极矩密度来自于跃迁密度，进一步反推可知当跃迁密度关于X=0偶对称时，由于$\boldsymbol{x}$是奇对称的，最终被积函数为奇×偶=奇函数，积分得到的X分量跃迁偶极矩将为0，对Y、Z分量同理；
> 
> 跃迁密度被定义为两个电子态波函数的积，可知两个电子态波函数的对称性可能最终影响跃迁是否能发生，这是对称性选择定则的来源。
{: .prompt-tip }

TDM本身的计算只需要Gaussian进行TD-HF/TD-DFT计算即可，在输出文件中将直接打印：
```
 Ground to excited state transition electric dipole moments (Au):
       state          X           Y           Z        Dip. S.      Osc.
         1         0.0000     -1.5153      0.0000      2.2960      0.4369
         2         0.0000      0.0000      0.3430      0.1176      0.0255
         3         0.0000      0.0000      0.0000      0.0000      0.0000
```
可见S1只有Y分量的有非零TDM，与前面看到Y分量的跃迁偶极矩密度偶对称相符。

利用Gaussian输出文件，可以使用Multiwfn绘制矩阵热图。因为乙烯就俩重原子，画出来没啥意义，展示的是笔者做的其他体系。
```
othersys.fchk
18
2         // 绘制原子/片段跃迁矩阵的热图
othersys.log  
1
n
1         // 收缩模式1
-1        // 定义片段
0         // 读入外部文件
frag.txt  
2         // 也可以用选项1来观看，5来改色彩刻度
```
此时当前目录下保存了刚刚绘制的热图
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/transdipden.png)

图片横坐标对应空穴位置，纵坐标对应电子位置。从图中可以看到主要出现在片段5，其余片段只有少部分分布；而电子则几乎只分布在片段1处，由此我们可以推测此处主要是片段5向片段1转移了电子。

# 自然跃迁轨道(Natural Transition Orbital, NTO)
在TD-HF/TD-DFT中，激发态通常写作多个基态MO对的线性组合：

$$
|\Psi_{\text{exc}}\rangle = \sum_{ia} c_{ia} \hat{a}^\dagger_a \hat{a}_i |\Psi_0\rangle
$$

式中：
- $i$: 占据轨道（occupied）
- $a$: 未占轨道（virtual）
- $c_{ia}$: 组态系数
- $\hat{a}^\dagger_a \hat{a}_i$: 从轨道 $i$ 激发到 $a$

这里的MO是从基态自洽场计算得到的，适合描述基态电子分布，却不一定最适合描述激发态的电子跃迁。因此在一些情况下，电子激发是没有主导的MO对的：
```
 Excitation energies and oscillator strengths:
 
 Excited State   1:      Singlet-A      2.1855 eV  567.31 nm  f=1.4596  <S**2>=0.000
     209 -> 211        0.50093
     210 -> 211       -0.46903
 This state for optimization and/or second-order correction.
 Total Energy, E(TD-HF/TD-DFT) =  -2799.53472176    
 Copying the excited state density for this state as the 1-particle RhoCI density.
```
此时，基于MO进行分析并不直观。为了解决这个问题，首先定义跃迁密度矩阵：

$$
T_{ia} = c_{ia}
$$

它记录了从每个占据轨道激发到每个虚轨道的权重。随后，对其进行奇异值分解：

$$
T = U \, \Lambda \, V^\dagger
$$

式中：
* $U$：可以将正则占据轨道变换为占据NTO的神奇妙妙酉矩阵
* $V$：可以将正则虚轨道变换为虚NTO的神奇妙妙酉矩阵
* $\Lambda$：对角矩阵，包含奇异值，描述了跃迁的强度

奇异值分解的目的是找到一个投影方向，使得激发态可以尽可能由一对轨道描述：

$$
|\Psi_{\text{exc}}\rangle \approx \lambda \, |\phi^{\text{occ}}_{NTO} \rightarrow \phi^{\text{vir}}_{NTO}\rangle
$$

NTO的产生方式见[从量子化学软件中产生波函数](https://bane-dysta.top/posts/40/)。以Gaussian输出为例，使用`pop=(NTO,saveNTO)`进行计算后，原本是占据数的地方写入的是NTO对的本征值，乘以100%就是该NTO对占激发的百分比。
```
 Alpha  occ. eigenvalues --    0.00018   0.00021   0.00022   0.00022   0.00026
 Alpha  occ. eigenvalues --    0.00027   0.00027   0.00028   0.00029   0.00035
 Alpha  occ. eigenvalues --    0.00049   0.00092   0.00293   0.01679   0.97920
 Alpha virt. eigenvalues --    0.97920   0.01679   0.00293   0.00092   0.00049
 Alpha virt. eigenvalues --    0.00035   0.00029   0.00028   0.00027   0.00027
 Alpha virt. eigenvalues --    0.00026   0.00022   0.00022   0.00021   0.00018
```
可以看到，原本必须要两个轨道对才能描述的跃迁现在可以通过单对NTO轨道来描述了(HONTO→LUNTO=97.92%)，如此讨论时就方便多了。

另外，NTO本身也是一种自然轨道，可以仿照MO进行可视化。

Ref:
- [*J. Chem. Phys. 2003, 118, 4775*](https://pubs.aip.org/aip/jcp/article/118/11/4775/535868/Natural-transition-orbitals)
- [自然跃迁轨道分析](https://cloud.tencent.com/developer/article/1794302)

# 空穴-电子分析(Hole-Electron Analysis)
有时候，仅仅对跃迁密度矩阵进行SVD分解仍然不能构造出一对主导的轨道，此时NTO变换就失去了本身的意义。这种情况下，可以采用空穴-电子分析来

空穴-电子分析是一种相较于NTO更激进的约化方法，思想是是舍弃掉波函数相位信息，单独构造一对"轨道"将所有轨道跃迁纳入考虑，使得电子与空穴均可以通过这对"轨道"进行描述。本节记录的是在Multiwfn中实现，基于TDDFT/CIS的空穴-电子定义。

总空穴密度：

$$
\rho^{\text{hole}}(\mathbf{r}) = \rho^{\text{hole}}_{\text{loc}}(\mathbf{r}) + \rho^{\text{hole}}_{\text{cross}}(\mathbf{r})
$$

其中，局域空穴密度是组态函数自身的贡献，定义为：

$$
\rho^{\text{hole}}_{\text{loc}}(\mathbf{r}) = \sum_{i \to a} (w_i^a)^2 \varphi_i \varphi_i - \sum_{i \leftarrow a} (w_i'^{a})^2 \varphi_i \varphi_i
$$

式中：
- $w_i^a$：从占据轨道 $i$ 到虚轨道 $a$ 的激发组态系数
- $\varphi_i$：占据轨道
- $(w_i^a)^2$、$(w_i'^a)^2$：激发组态的权重
- $i \to a$：表示激发贡献
- $i \leftarrow a$：表示去激发贡献

交叉空穴密度体现组态函数之间的耦合对空穴和电子分布的影响，定义为：

$$
\rho^{\text{hole}}_{\text{cross}}(\mathbf{r}) = \sum_{i \to a} \sum_{j \neq i \to a} w_i^a w_j^a \varphi_i \varphi_j - \sum_{i \leftarrow a} \sum_{j \neq i \leftarrow a} w_i'^{a} w_j'^a \varphi_i \varphi_j
$$

式中：
- $i \neq j$：不同的占据轨道
- $w_i^a w_j^a$：不同激发组态间的交叉权重
- $\varphi_i \varphi_j$：不同轨道间的交叉项

电子项形式跟空穴类似：

$$\rho^{\text{ele}}(\mathbf{r}) = \rho^{\text{ele}}_{\text{loc}}(\mathbf{r}) + \rho^{\text{ele}}_{\text{cross}}(\mathbf{r})$$

$$\rho^{\text{ele}}_{\text{loc}}(\mathbf{r}) = \sum_{i \to a} (w_i^a)^2 \varphi_a \varphi_a - \sum_{i \leftarrow a} (w_i'^{a})^2 \varphi_a \varphi_a$$

$$\rho^{\text{ele}}_{\text{cross}}(\mathbf{r}) = \sum_{i \to a} \sum_{i \to b \neq a} w_i^a w_i^b \varphi_a \varphi_b - \sum_{i \leftarrow a} \sum_{i \leftarrow b \neq a} w_i'^{a} w_i'^{b} \varphi_a \varphi_b$$

进行空穴-电子分析需要进行TD-HF/TD-DFT计算，与前述一致。然后使用Multiwfn进行分析：
```
ethene.fchk
18
1
ethene.log    
1               
1               
1               // 到此为止与跃迁密度等值面一致
{1,2,3}         // 可视化电子-空穴
```
空穴：
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/hole_trimmed.png)
电子：
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/electron_trimmed.png)
我们看到空穴形状像乙烯的$π$成键轨道，而电子像$π$反键轨道，与MO的结果是一致的。

# 电子-空穴热图

# 片段电荷转移分析(Interfragment Charge Transfer Analysis, IFCT)














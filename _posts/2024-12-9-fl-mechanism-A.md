---
title: "Study note：Fluorescence Probe - part A"
date: 2024-12-9 12:00:00 +0800
categories: [Quantum Chemistry,note]
tags: [note,excited state]   
math: true     
---
> tips：荧光探针的机理很杂很碎，而错误解读又很多，难以分辨。本文记录一下笔者学习过程中对各种基本原理的总结，内容仅供参考，未必完全正确，会随笔者学习理解过程随时更新。

荧光过程可以用经典的Jablonski图来表示。简单来讲，基态分子可以吸收一个光子跃迁到激发态，随后通过快速内转换和振动弛豫回到第一激发态的最低振动能级，再释放一个光子回到基态。
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2024/12/Jablonski-Diagram-1-1024x604.png)
这个能级图虽然很直观，但是几乎没有描述几何行为。为了更好地理解荧光，这里需要先引入势能面的概念。

## 1 势能面
势能面（Potential Energy Surface, PES）描述了一个分子系统中原子之间相互作用势能随它们空间位置变化而变化的趋势。简单来说，在Born-Oppenheimer近似下，核运动的时间尺度上电子结构始终处于基态，因此势能面是**体系势能关于核坐标的函数**图像，描述了分子在不同的几何结构下的能量分布，可以用来分析分子的动力学和热力学行为：

$$
V(\mathbf{R}) = \sum_{i=1}^N \sum_{j>i}^N V_{ij}(|\mathbf{R}_i - \mathbf{R}_j|)
$$

式中：
- $V(\mathbf{R})$ 为系统的总势能
- $V_{ij}$ 表示粒子$i$和粒子$j$之间的相互作用势，根据系统的具体特性可以采用不同的形式，如Morse势、Lennard-Jones势、库仑势等。
- $\mathbf{R}_i$ 和 $\mathbf{R}_j$ 分别是第$i$个和第$j$个粒子的位置向量
- $N$ 为系统中粒子的总数

可以发现，对于多原子分子来说，由于每个粒原子的三个坐标($x,y,z$)都会影响势能，一个N原子分子的每个电子态的势能面都有3N个自由度。除去不影响能量的整体平移和整体旋转，N原子分子的势能面将是3N-6维的超曲面。由于势能面的高维性，多原子分子的完整势能面是无法用图像或是常规手段进行描述的，实际研究中一般会选择某一个或几个反应坐标(Reaction Coordinate)进行研究。

## 2 Franck-Condon原理
Jablonski图上的跃迁过程也可以完整地用势能面来表示，但初看时会比较凌乱，因此这里从一个简化的模型入手。我们假设分子总是处于势能面极小点结构，且只考虑第一激发态，则跃迁过程可以简单表示为下图的a → b → c → d：

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2024/12/%E5%9B%BE%E7%89%871.png)

假设分子的S<sub>0</sub>平衡结构为a点，分子在a点处吸收光子跃迁，可以到S<sub>1</sub>激发态势能面上的b点。由于电子跃迁发生的时间尺度远短于核振动周期的时间尺度，在Born-Oppenheimer近似下，可以认为电子跃迁是瞬时发生的，a点与b点的几何结构一致，这称为Franck-Condon原理。又因为a点与b点的几何结构一致，该模型被称为垂直激发模型，跃迁时的核构型点被称为Franck-Condon点。

FC点通常不是S1势能面上的极小点，即在S1态下，S0极小点的几何结构并不稳定。因此，分子将自发调整结构，从FC点沿某些反应坐标向S1势能面极小点c滑落，这对应Jablonski图中的振动弛豫。在S1平衡结构，分子可以发生辐射跃迁，释放出一个光子并跃迁回S0态的d点。类似地，d点不是S0的极小点，将沿势能面滑落回到S0极小点a。这样，就完成了一整个荧光过程。

## 3 振动能级
我们刚刚假设分子总是处于势能面极小点结构来理解垂直激发，而在实际过程中这个假设并不成立。事实上由于不确定性原理，原子不能同时具有精确的位置和动量，分子总是在不断振动的。因此，在某一时刻下，一个宏观体系中必然含有处于不同振动相位的分子。考虑这一点，跃迁过程可以表示为：

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2024/12/20241208135419.png)

Fig. n. 光谱形状的产生原因 *Chem. Eur. J. 2012, 18, 8140 – 8149*

不同振动相位的分子在垂直激发时，会落到激发态的不同振动能级上，吸收的光子能量也不完全相同，这是光谱精细结构(如肩峰)产生的原因。

图中只考虑了振动基态，事实上当体系不处于0K时，还会存在处于各振动激发态的分子，其布居数服从Boltzmann分布。我们可以引入Franck-Condon因子来描述不同振动能级之间跃迁的概率：

$$
F_{ij} = |\langle \psi_{i}|\psi_{j} \rangle|^2
$$

式中：
- $F_{ij}$是态$i$与态$j$之间的Franck-Condon因子
- $\langle \psi_{i} \|\psi_{j} \rangle$表示态$i$与态$j$波函数的重叠积分

FC因子可以描述振动跃迁的强度。考虑FC因子修正后，计算得出的光谱峰形常常可以与实验值进行比较，来指认振动峰的本质。

## 4 Herzberg-Teller效应
前述垂直激发过程可以正确描述多数跃迁过程，但有少数情况例外。以苯为例，苯分子具有$D_{6h}$高阶点群对称性，它的激发由于跃迁偶极矩的相互抵消，会导致FC项精确为0，跃迁受到对称性禁阻。然而，实际上可以观察到苯分子的激发，因为真正的激发过程并非像Franck-Condon原理描述的一样是完全垂直的。

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2024/12/images_large_jp0c07896_0012.jpeg)

Fig. n. Herzberg-Teller效应 *J. Phys. Chem. A 2020, 124, 44, 9156–9165*

由于核运动事实上会扰动电子态，导致电子波函数在扰动下不再是严格的绝热近似下的本征态，这使得某些在绝热近似下禁阻的跃迁可以变为允许。我们引入Herzberg-Teller效应来描述这种扰动，考虑电子跃迁偶极矩对核坐标的依赖性。在平衡构型附近，电子跃迁偶极矩可以对核坐标进行泰勒展开：

$$
\mu_{ij} = \mu_{ij}^0 + \sum_k (\frac{\partial \mu_{ij}}{\partial Q_k})_0 Q_k + \frac{1}{2}\sum_{k,l} (\frac{\partial^2 \mu_{ij}}{\partial Q_k \partial Q_l})_0 Q_k Q_l + ...
$$

式中：
- $\mu_{ij}$ 是电子跃迁偶极矩
- $\mu_{ij}^0$ 是平衡构型下的跃迁偶极矩，$Q_k$ 是第k个简正坐标
- $(\frac{\partial \mu_{ij}}{\partial Q_k})_0$ 是跃迁偶极矩对简正坐标的一阶导数

通常Herzberg-Teller高阶项贡献相对较小，在小振幅的情况下很少考虑二阶项或更高的项。考虑一阶Herzberg-Teller效应的跃迁强度可以表示为：

$$
I_{i \leftarrow j} \propto |\langle \Psi_i|\mu|\Psi_j \rangle|^2 = |\mu_{ij}^0\langle \chi_i|\chi_j \rangle + \sum_k (\frac{\partial \mu_{ij}}{\partial Q_k})_0 \langle \chi_i|Q_k|\chi_j \rangle|^2
$$

式中：
- $\mu_{ij}^0\langle \chi_i \|\chi_j \rangle$是Franck-Condon项，对应于零阶近似
- $\sum_k (\frac{\partial \mu_{ij}}{\partial Q_k})_0 \langle \chi_i \|Q_k \|\chi_j \rangle$是Herzberg-Teller一阶校正项，包含了电子-振动耦合效应

当$\mu_{ij}^0 = 0$时（即跃迁在FC近似下被禁阻），Herzberg-Teller项可能会成为跃迁的主要贡献，例如：
- 跃迁过程会受到受到宇称选择规则的限制。电偶极跃迁算符的宇称是奇宇称，只能发生在初态和末态的宇称不同的情况下，否则该跃迁是禁阻的。如苯分子的 $A_{1g} \rightarrow B_{2u}$ 跃迁。
- 跃迁过程会受到对称性选择定则的限制。两个跃迁轨道不可约表示$\Gamma_A$和$\Gamma_B$的直积需要包含完全对称的表示，否则该跃迁是禁阻的。如苯分子的$B_{2u} \rightarrow B_{1u}$ 跃迁。
- 跃迁要求两个轨道存在重叠，否则不能产生非零的跃迁偶极矩，如如羰基孤对电子的$n \rightarrow \pi^*$跃迁是禁阻/弱允许的。

>这些禁阻不在HT效应的影响范围内：  
>- 跃迁过程的自旋角动量变化是受自旋选择定则限制的。在电偶极跃迁中，要求$\Delta S = 0$，即自旋角动量不能变化，否则跃迁是禁阻的。如蒽的系间窜越过程。(但如果把HT的哈密顿微扰项算进来，也算是产生了旋轨耦合打破禁阻)  
>- 根据角动量耦合的守恒定律，跃迁过程的轨道角动量变化是受限的。对于电偶极跃迁，由于光子携带1的角动量，要求$\Delta \lambda = \pm 1$，否则该跃迁是禁阻的。如氢原子$1s \rightarrow 2s$的跃迁。

## 5 辐射跃迁
考虑前述FC与HT效应后，我们对跃迁的描述已经比较完善了(大概？)。然而，研究荧光发射时还需要对跃迁的类型做一下划分，因为跃迁并不总是释放光子。

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2024/12/20241209101241.png)

Fig. n. 势能面上的荧光过程 *Chem. Asian J. 2019, 14, 700.*

如图中三个虚线箭头所示，当跃迁偶极矩非零且初末态能量差较大时，通常会发生辐射跃迁，即激发态体系释放光子来回到基态。这个过程的速率可以用爱因斯坦辐射速率公式来计算：

$$
A_{ji} = \frac{8\pi^2e^2\nu^2}{m_ec^3}f_{ij} \tag{5.1}
$$

式中：
- $e$ 是元电荷；$m_e$ 是电子质量；$c$ 是光速；
- $f_{ij}$ 是振子强度，它的数学表示为：
  $$
  f_{ij} = \frac{2m_e\nu}{3\hbar e^2} |\langle \psi_i|\hat{\mu}|\psi_j \rangle|^2 \tag{5.2}
  $$
  式中：
  - $\hat{\mu}$是偶极矩算符，数学表示为$\hat{\mu} = e\sum_k \vec{r}_k$，$\vec{r}_k$ 是第k个电子的位置矢量。
  - $\langle \psi_i\|\hat{\mu}\|\psi_j \rangle$ 是跃迁偶极矩矩阵元
  - $\nu$ 是电磁辐射频率，可以用能量表示：$\nu = \frac{E}{h}$，$E$是以波数(cm⁻¹)为单位的能量。

代入所有常数，原公式可近似简化为：

$$
A_{ji} \approx \frac{3}{2}f_{ij}E \tag{5.3}
$$

由$(5.1)$ - $(5.3)$式可知，振子强度决定于初末态波函数在跃迁偶极矩算符作用下的重叠积分，而辐射跃迁速率又与振子强度成正比关系。若初末态波函数正交，或是跃迁偶极矩由于高点群对称性相互抵消精确为0，则辐射跃迁速率也将为0，即不能发生辐射跃迁。

## 6 非辐射跃迁
然而，从激发态回到基态的通道并不仅限于辐射跃迁，还包括一类不发射光子的跃迁过程。这类跃迁被称为非辐射跃迁，特征是体系会通过非光子途径将激发态的能量耗散到周围环境中，回到基态。非辐射跃迁速率可以用费米黄金定则(Fermi's Golden Rule)来计算。设初态为 $|\psi_i\rangle$，末态为 $|\psi_f\rangle$，对应能量为 $E_i$ 和 $E_f$，则：

$$
k_{\text{nr}} = \frac{2\pi}{\hbar} \sum_{i} \bigl|\langle \psi_i | \hat{H} | \psi_j \rangle \bigr|^2 \rho(E_i) \tag{6.0.1}
$$

式中：
- $\hat{H}$ 是两个态之间耦合的哈密顿量算符，可以是非绝热耦合(IC)、旋轨耦合(SOC)、振动耦合等。
- $\rho(E_i)$为态密度，表示在单位能量间隔内可找到的末态数目。态密度受两个态之间能量匹配的影响，在能量近似匹配的位置，对应的振动态密度往往较大，从而使跃迁速率增大。

常见的非辐射跃迁通道包括内转换、系间窜越和外转换。由于外转换影响因素众多，比较可控的途径是前两者。
### 6.1 内转换(Internal Conversion, IC)  
内转换指同多重度（如同为单重态）的电子激发态之间的无辐射过程。在绝热近似下，两个电子态的波函数随核坐标变化彼此独立，没有有效的转化通道。而当绝热近似被破坏，两个电子态在核坐标空间产生一定的关联时，就可以通过内转换转移能量。

我们引入非绝热耦合（Non-adiabatic Coupling，NAC）来描述这种关联。设 $\|\Phi_i(\mathbf{r};\mathbf{R})\rangle$ 是在给定核坐标 $\mathbf{R}$ 下的第 $i$ 个电子本征态，则非绝热耦合一般定义为两个电子态 $\|\Phi_i\rangle$ 和 $\|\Phi_j\rangle$ 间的导数内积：

$$
d_{ij}(\mathbf{R}) = \langle \Phi_i(\mathbf{r};\mathbf{R}) \mid \nabla_{\mathbf{R}} \mid \Phi_j(\mathbf{r};\mathbf{R}) \rangle \tag{6.1.1}
$$

式中：$\nabla_{\mathbf{R}}$ 表示对核坐标 $\mathbf{R}$ 的梯度算符。

非绝热耦合量体现了当核坐标发生变化时，电子态之间的混合与转化程度。当该项不为0时，态$i$与态$j$就可以通过内转换进行无辐射转换。该过程通常伴随振动弛豫，使多余的电子能量转化为分子内振动势能。

NAC的分布情况与圆锥交叉有关，见6.3节。

### 6.2 系间窜跃(Intersystem Crossing, ISC)  
系间窜跃指激发态从一种自旋多重度跃迁至另一种自旋多重度的无辐射过程，例如从单重态 $S_1$ 转移至三重态 $T_1$。由于自旋角动量发生了改变，这一过程受到自选选择定则严格禁阻，在理想情况下不能发生。然而实际上由于电子自旋与轨道运动会相互耦合，电子态并不一定是严格纯态，使得系间窜越过程可能实现。我们引入自旋-轨道耦合（Spin-Orbit Coupling, SOC）来描述这种耦合效应：

$$
\hat{H}_{\mathrm{SO}} = \xi(r)\mathbf{L}\cdot\mathbf{S} \tag{6.2.1}
$$

式中： 
- $\mathbf{L}$是电子的轨道角动量算符；$\mathbf{S}$是电子的自旋角动量算符。
- $\xi(r)$是自旋-轨道耦合参数，它的数学表示是：
  $$
  \xi(r) = \frac{\alpha^2}{2m_e^2 c^2} \frac{1}{r}\frac{dV(r)}{dr} \tag{6.2.2}
  $$
  式中：
  - $\alpha$ 是精细结构常数（$\alpha \approx 1/137$）；$m_e$ 是电子质量；$c$ 是光速；
  - $V(r)$ 是作用于电子上的球对称位势（如原子核场势）；

根据$\hat{H}_{\mathrm{SO}}$的数学表示，可以推知一些能够影响系间窜越的因素：
- 几何结构畸变可能会导致轨道分子轨道能级重新分布、能隙变化，以及轨道成分（如p、d轨道混合比例）和对称性的改变，进而影响轨道角动量特性，改变$\mathbf{L}\cdot\mathbf{S}$项，从而导致单重态与三重态之间产生耦合；
- 强电荷转移、外加电场或磁场的存在可以改变外势项$\frac{1}{r}\frac{dV(r)}{dr}$，导致单重态与三重态之间产生耦合。而一些重原子(如Br、I、Se等)的核电荷数很高，其原子核的库仑势场可以起到类似外加电场的效应，这称为重原子效应；

### 6.3 势能面交叉
虽然势能面交叉与内转换、系间窜越等非辐射途径并不是并列关系，但跟非辐射跃迁是密切相关的。想了很久，最后还是把势能面交叉放在这里了。

势能面交叉是指两个电子态对应的势能面在某些核构型点相互接近、相交或接近简并的现象。在Born-Oppenheimer近似下，不同电子态的势能面是相互独立的，分子通常沿着单个势能面运动；但是在势能面相交或近似相交区域，Born-Oppenheimer近似将失效，电子和核坐标强烈耦合，分子有较高概率发生电子态之间的无辐射跃迁。这种区域往往是非绝热过程的关键所在。

根据两个电子态的自旋多重度，势能面交叉点可以分为两种情况：

#### 最小能量交叉点（MECP, Minimum Energy Crossing Point）

形成MECP的两个态能量简并，但自旋多重度不同，两个态不简并。在该点附近两态的能量几乎相同，自旋态混合效率增强，体系有更高概率实现系间窜越。

在MECP结构下，体系的振动导致的瞬时旋轨耦合往往也能促使体系发生系间窜越。因此除了旋轨耦合，能量匹配也是影响ISC速率的重要因素。

#### 最小能量圆锥交叉点（MECI, Minimum Energy Conical Intersection）

形成MECI的两个态能量简并，自旋多重度相同，形成简并态。因交叉点通常形成类似圆锥形状的拓扑结构，得名圆锥交叉（Conical Intersection, CI）。其实CI还分为圆锥交叉和圆锥避免交叉两种情况，就不展开叙述了。

两个态能量相差越大，简并特征越微弱，电子态之间的往往相互独立；越接近CI点，电子态之间的界限越模糊，NAC越大；在CI点附近，由于电子态简并，6.1.1式中$\nabla_{\mathbf{R}}$对波函数的影响不再是平滑渐进的，会随核坐标剧烈变化，因此态间的非绝热耦合会急剧增强，往往会发生迅速的内转换。因此CI点是NAC强度的“热点”。

## 7 量子产率

在研究光物理过程时，我们通常将辐射过程与非辐射过程统一纳入一个速率方程中描述。如果我们以 $k_r$ 表示辐射跃迁速率，以 $k_{nr}$ 表示所有非辐射通道的总速率，那么激发态总衰减速率为：

$$
k_{\text{tot}} = k_{r} + k_{nr}
$$

量子产率(Quantum Yield)为发光光子数与吸收光子数的比例，可写作：

$$
\Phi = \frac{k_r}{k_{r} + k_{nr}}
$$

由该公式可知，辐射跃迁与非辐射跃迁是竞争关系。当非辐射过程占主导时（$k_{nr} \gg k_r$），系统的量子产率将接近零，发光强度显著降低。


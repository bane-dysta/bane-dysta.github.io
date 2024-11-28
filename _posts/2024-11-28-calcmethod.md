---
title: Study note：理论方法
date: 2024-11-23 12:00:00 +0800
categories: [Calculation]
tags: [notes]     
---
## 1.量子力学方法

### 1.1 Hartree-Fock方法 (HF)
Hartree-Fock方法是一种多电子近似方法，核心思想是将复杂的多电子波函数转化为简单的单电子问题，并通过自洽场方法迭代求解波函数和能量。

a. 独立粒子近似  
假设电子运动是独立的，即每个电子在其余电子生成的平均场中运动。这样多电子波函数可近似为由一组单电子波函数的线性组合构成，用Slater行列式来表示：

$$
\Psi_{\text{HF}} = \frac{1}{\sqrt{N!}} \det(\psi_1, \psi_2, \dots, \psi_N)
$$

其中：$\Psi_{\text{HF}}$是HF波函数；$\psi_i$是单电子轨道；$N$是电子数。

b. Hartree-Fock方程  
首先定义描述单电子运动的Fock算符：

$$
\hat{F} = h + \hat{J} - \hat{K}
$$
其中：$h$为单电子哈密顿量，包括动能和核吸引部分；$\hat{J}$为库仑相关算符；$\hat{K}$为交换算符。

单电子轨道满足如下本征方程：

$$
F \psi_i = E_i \psi_i
$$
其中：$E_i$为单电子轨道能量；$\psi_i$为单电子波函数

c. 自洽场(SCF)迭代  
- 首先通过一些方法构建初猜轨道，并计算Fock算符
- 通过基函数展开Hartree-Fock方程，解出轨道系数和轨道能量
- 通过解出的轨道系数构造新的轨道，利用新轨道计算电子分布，更新Fock算符
- 重复该流程，直到分子轨道和能量收敛。

自洽场收敛后，就得到了体系的HF能量。观察Fock算符的构造，可以发现由于使用了平均场近似，HF方法对于电子的相关作用的描述非常粗糙。

### 1.2 post HF方法
HF不擅长描述电子相关作用，因此后来基于HF波函数又开发了许多方法。

---
#### **Møller-Plesset Perturbation Theory (MP)**
Møller-Plesset微扰理论的目标是通过对电子波函数和能量的逐阶修正来描述电子相关效应，核心思想为将哈密顿算符中难以求解的电子相关部分提取出来，作为微扰项处理：

$$
\hat{H} = \hat{H_0} + \lambda\hat{H'}
$$

其中：$\hat{H_0}$为HF哈密顿量；$\hat{H'}$为微扰项，可以表示为：

$$
\hat{H}' = \hat{H}_{\text{ee}} - \hat{V}_{\text{HF}},
$$

其中：$\hat{H}_{\text{ee}}$ 是电子之间的精确相互作用；$\hat{V}_{\text{HF}}$ 是 HF 的平均场近似下的电子相互作用。

使用微扰参数 $\lambda$ 将总能量和波函数展开为级数：

$$
E = E_0 + \lambda E_1 + \lambda^2 E_2 + \lambda^3 E_3 + \cdots,
$$

$$
|\Psi\rangle = |\Psi_0\rangle + \lambda |\Psi_1\rangle + \lambda^2 |\Psi_2\rangle + \cdots.
$$

其中：
- 零阶项$E_0$为HF能量$\langle \Psi_0 | \hat{H}_0 | \Psi_0 \rangle$
- 由于HF波函数使用了变分法，一阶项$E_1$为0。
- 二阶项$E_2$可以写为：
  
  $$
  E_2 = \sum_{i \neq 0} \frac{|\langle \Psi_0 | \hat{H}' | \Psi_i \rangle|^2}{E_0 - E_i}
  $$

  在实际计算中，二阶能量校正的表达式可以写为：

  $$
  E_2 = \sum_{ij}^{\text{occupied}} \sum_{ab}^{\text{virtual}} \frac{| \langle ij | ab \rangle - \langle ij | ba \rangle |^2}{\epsilon_i + \epsilon_j - \epsilon_a - \epsilon_b}
  $$

  其中：
  - $i, j$：占据轨道（HF 波函数中被填满的轨道）。
  - $a, b$：虚轨道（HF 波函数中未被填满的轨道）。
  - $\epsilon_i, \epsilon_j, \epsilon_a, \epsilon_b$：HF 轨道能量。
  - $\langle ij | ab \rangle$：双电子积分，表示两个电子在占据轨道 $i, j$ 和虚轨道 $a, b$ 之间的相互作用。

最常用的微扰方法为MP2，更高阶的方法由于形式复杂，计算代价较大，并不常用。

---
#### **Configuration Interaction (CI)**

CI是一种多电子波函数近似方法，核心思想是通过线性组合多个单电子波函数来表示体系的真实波函数，以避免使用平均场近似处理电子相关问题。

就像用多个共振式共同描述体系的真实结构一样，体系的真实波函数也可以被表示为多个Slater行列式的线性组合：

$$
\Psi_{\text{CI}} = c_0 \Phi_0 + \sum_i c_i \Phi_i + \sum_{i<j} c_{ij} \Phi_{ij} + \cdots
$$

其中：
- $\Phi_0$ 是参考态波函数，通常为HF波函数。
- $\Phi_i, \Phi_{ij}, \dots$ 是通过单电子、双电子等激发生成的激发组态。
- $c_0, c_i, c_{ij}, \dots$ 是各个组态的系数。

CI的目标是通过变分原理最小化总能量，因此需要构造哈密顿矩阵 $H_{\text{CI}}$，矩阵元定义为：
$$
H_{ij} = \langle \Phi_i | \hat{H} | \Phi_j \rangle,
$$
其中：$\hat{H}$ 是全电子哈密顿算符；$\Phi_i$ 和 $\Phi_j$ 是不同组态的 Slater 行列式。

随后通过对CI哈密顿矩阵的对角化，可以得到体系的基态和激发态波函数与能量。然而，完全考虑所有组态时，计算复杂度将达到$O(N!)$，计算量随体系增大而爆炸式增长，仅适用于极小体系。因此，实际使用的CI多数为截断CI，如仅包含一阶项的CIS、考虑到二阶项的CISD等。

---
#### Coupled Cluster (CC)
为了避免显示计算CI的行列式系数，提出了Coupled Cluster方法。该方法的核心思想是通过指数形式的簇算符$e^{\hat{T}}$描述体系激发，并通过指数函数的泰勒展开确定高阶激发系数：

$$
|\Psi_{\text{CC}}\rangle = e^{\hat{T}} |\Phi_0\rangle,
$$
其中：
- $\Phi_0$ 是参考态波函数，通常为HF波函数。
- $\hat{T}$ 是激发算符，定义为：
  $$
  \hat{T} = \hat{T}_1 + \hat{T}_2 + \hat{T}_3 + \dots,
  $$
  
  $\hat{T}_1, \hat{T}_2$ 等算符用于描述不同阶的电子跃迁。比如：

  $$
  \hat{T}_1 = \sum_{ia} t_i^a a_a^\dagger a_i 
  $$

  $$
  \quad \hat{T}_2 = \frac{1}{4} \sum_{ijab} t_{ij}^{ab} a_a^\dagger a_b^\dagger a_j a_i,
  $$

  其中：
   - $t_i^a$ 和 $t_{ij}^{ab}$ 为待求的激发振幅。
   - $a_a^\dagger, a_i$ 为创建和湮灭算符，分别对应占据和虚轨道。

根据变分原理，体系总能量为：

$$
E_{\text{CC}} = \langle \Phi_0 | \hat{H} e^{\hat{T}} | \Phi_0 \rangle.
$$
 
将 Schrödinger 方程投影到不同的组态空间，得到一系列关于激发振幅 $t_i^a, t_{ij}^{ab}$ 等的非线性方程组：

$$
\langle \Phi_i^a | \hat{H} e^{\hat{T}} | \Phi_0 \rangle = 0, \quad \langle \Phi_{ij}^{ab} | \hat{H} e^{\hat{T}} | \Phi_0 \rangle = 0, \dots
$$

通过数值迭代求解这些振幅方程。

CC方法的优点是精度高，考虑到二阶就能得到很高精度的结果，缺点计算复杂度随着激发阶数迅速增加，例如 CCSD 为 $O(N^6)$，CCSD(T) 为 $O(N^7)$。

---

### MCSCF

#### CASSCF

#### MRCI、MRCC

### Density Functional Theory

### ADC

### Semi-Empirical

#### xTB

## 分子力学方法

## 机器学习势（machine learning potential）





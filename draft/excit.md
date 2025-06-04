---
layout: page
title: 激发态的分析
date: 2024-11-1 12:00:00 +0800
---
使用Gaussian与Multiwfn做一些激发态分析。
## 跃迁密度
一个比较简单而基本的属性，定义：

$$
\rho_{ij}(r) = \psi_{i}(r) \times \psi_{j}(r)
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

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/ethene_trimmed.png)

## 跃迁偶极矩
$\mu_{ij}^e$反映分子吸收电磁辐射的能力，定义为：
$$
\mu_{ij}^e = |\langle \psi_i|\hat{\mu^e}|\psi_j \rangle|^2 \tag{2.1}
$$
Gaussian计算与前述一致，Multiwfn分析时：
```
transden.fchk
18
1
transden.log    
1               
1               
1               // 到此处位置操作不变
6               // 绘制跃迁偶极矩等值面
{1,2,3,4}       // 根据需求选择绘制的分量
```
发现跃迁偶极矩等值面与跃迁密度等值面不同，存在XYZ分量的选择。这是因为$\hat{\mu^e}$引入了坐标权重，$\mu_{ij}^e$在各分量上的分布可能存在差异。假设乙烯双键的方向为X，垂直于双键方向为Y，垂直于乙烯平面的方向为Z，那么对于X分量，X=0平面将横穿乙烯分子，上侧的跃迁偶极矩乘以负值坐标，于是对应等值面发生了变号：
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/20250604224446.png)
由于跃迁密度关于Y=0平面反对称，Y分量的跃迁偶极矩是这样的：
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/20250604224841.png)
而Z方向跃迁密度与X方向一样关于Z=0对称，因此Z分量的分布也产生了变号：
![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2025/06/ethene_z_trimmed.png)

# Hole-Electron Analysis



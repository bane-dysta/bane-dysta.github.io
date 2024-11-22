---
title: 估计氢键键能方法
date: 2024-10-30 19:00:00 +0800
categories: [Data Analysis, Weak Interaction]
tags: [H-Bond,AIM,Multiwfn]     
---
## 1. 使用复合物能量减去单体能量
适用于分子间氢键，分子内则无法简单相减。计算级别可以选择CCSD(T)等高精度方法。
## 2. 基于键临界点的电子密度ρ<sub>BCP</sub>估计内氢键键能
Reference: [sobereva老师的博文][1] 

[1]: http://sobereva.com/513 "透彻认识氢键本质、简单可靠地估计氢键强度：一篇2019年JCC上的重要研究文章介绍"

Atoms-in-molecules (AIM)理论利用氢键的键临界点(BCP)位置的属性考察氢键特征。*J. Comput. Chem., 40, 2868 (2019)* 提出了一个用CCSD(T)/jul-cc-pVTZ + counterpoise级别氢键结合能拟合的经验公式：
<div style="text-align: center;">
E<sub>HB</sub> = -223.08 * ρ<sub>BCP</sub>+0.7423
</div>
其中：E<sub>HB</sub>单位为kcal/mol；ρ<sub>BCP</sub>单位为a.u.。
要使用该公式估计氢键结合能，首先要对优化过的结构，做高精度单点能计算：

```
%chk=sp.chk
# B3LYP/gen em=gd3bj geom=allchk

@/path/to/ma-TZVPP.txt
```
转换为fchk文件：
```
formchk sp.chk
```
启动Multiwfn程序，载入sp_B3LYP.fch：
```
Multiwfn sp.fchk
```
然后依次输入
```
2  //拓扑分析
2  //搜索核临界点
3  //用每一对原子的中点搜索临界点
0  //观看临界点
```
勾选CP labels，在图中查找氢键对应的BCP序号，此例是32、43、48。
关掉UI界面，进入功能7，输入32，在输出中找到
Density of all electrons：0.1215691615E-01
输出值即为该氢键对应的ρ<sub>BCP</sub>。将其代入公式
<div style="text-align: center;">
E<sub>HB</sub> = -223.08 * ρ<sub>BCP</sub>+0.7423
</div>
得到E<sub>HB</sub>为-1.97 kcal/mol。

Reference: [计算分子内氢键键能的几种方法][2] 

[2]: http://sobereva.com/522 








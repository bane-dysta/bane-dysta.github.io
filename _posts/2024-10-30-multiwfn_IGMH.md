---
title: IGMH分析
date: 2024-10-30 19:00:00 +0800
categories: [Data Analysis, Weak Interaction]
tags: [H-Bond,IGMH,Multiwfn]     
---
## 1. 介绍
IGMH分析是一种将化学体系间相互作用以图像方式展现出来的方法。需要波函数信息。

Reference: [sobereva老师的博文][1]  

[1]: http://sobereva.com/621 "使用Multiwfn做IGMH分析非常清晰直观地展现化学体系中的相互作用"

## 2. 使用
### 2.1 (构象搜索)
如果是刚性分子，可跳过。如果分子存在柔性或是团簇，通常使用molclus结合以下程序进行构象搜索。
- 团簇构象搜索：genmer。
- 分子构象搜索：gentor不支持环状区域构象搜索，Confab或Frog2更简单但不支持环状区域构象搜索，不支持有机分子以外的情况。
- md采样：既可用于团簇也可用于分子。gromacs等使用繁琐，需要有合适的力场；xtb做md效率高，普适。共同缺点可能有采样不足的问题。

Reference: 论坛[Moclus教程贴][2]

[2]: http://bbs.keinsci.com/forum.php?mod=viewthread&tid=577 "使用molclus程序做团簇构型搜索和分子构象搜索"

### 2.2 结构优化
使用合适的普通泛函进行结构优化：
```
%chk=1.chk
# B3LYP/6-31g** opt freq em=gd3bj   //因为涉及氢键，可以给氢加极化函数
```
运行完毕并检查虚频后，转换文件格式：
```
formchk 1.chk
```
### 2.3 使用Multiwfn导出cub数据
运行Multiwfn：
```
Multiwfn 1.fchk
```
然后依次输入：
```
20
11
2       //对应片段数
1-10    //  第一个片段
c       //自动选择第二个片段
2       //格点数根据实际情况选择
3       //导出后处理数据
```
生成了四个文件：sl2r.cub、dg.cub、dg_inter.cub、dg_intra.cub。
### 2.4 VMD作图
将四个cub文件复制到VMD文件夹内。首次使用时，还应把作图脚本IGM_intra.vmd和IGM_inter.vmd一并复制过去。

然后使用VMD主菜单File-Load Visualization State-IGM_inter.vmd来绘制图像，也可以使用命令行：
```
source IGM_inter.vmd
```
两个脚本一个是绘制片段间的，一个是绘制片段内的。

调整好后，使用render渲染导出bmp图像即可。






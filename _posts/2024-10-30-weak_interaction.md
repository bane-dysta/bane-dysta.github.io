---
title: Study note：弱相互作用的分析
date: 2024-10-30 19:00:00 +0800
categories: [Analysis Method, Weak Interaction]
tags: [H-Bond,RDG,NCI,IGMH,Multiwfn]     
---
## 1. 分析方法
- NCI分析：[*JACS,132,6498-6506.*](https://pubs.acs.org/doi/10.1021/ja100936w)一文中提出的可视化研究弱相互作用的方法，又称为RDG方法，需要使用波函数信息进行分析。
- IRI分析：[*Chemistry-Methods,2021,1,231.*](https://chemistry-europe.onlinelibrary.wiley.com/doi/10.1002/cmtd.202100007#)提出的分析方法，比NCI的优点是可以同时展现弱相互作用和化学键。
- IGMH分析：[*J.Comput.Chem.,2022,43(8),539.*](https://onlinelibrary.wiley.com/action/showCitFormats?doi=10.1002%2Fjcc.26812)提出的将化学体系间相互作用以图像方式展现出来的方法，比NCI的优点是可以把片段内和片段间的作用区分开。

Reference: [Multiwfn支持的弱相互作用的分析方法概览](http://sobereva.com/252)

## 2. 实战
### 2.1 构象搜索
刚性分子一般可以优化到正确极小点，可跳过。而如果待分析体系存在柔性，或是团簇，通常[使用molclus进行构象搜索](https://bane-dysta.github.io/posts/molclus/)。

### 2.2 结构优化
使用合适的普通泛函进行结构优化：
```
%chk=1.chk
# B3LYP/6-31g** opt freq em=gd3bj   //若涉及氢键，可以给氢加极化函数

%chk=1.chk
# B3LYP/6-31+g* opt freq em=gd3bj   //若分析π-π堆积，可以加弥散函数
```
运行完毕并检查虚频后，转换文件格式：
```bash
formchk 1.chk
```
### 2.3 Multiwfn分析
运行Multiwfn后，进入主功能20。20的子菜单中，选项1，4，11分别对应NCI、IRI和IGMH。其中，NCI、IRI在建立格点后可以直接导出密度数据，而IGMH还需要定义片段：
```
20
11
2       //对应片段数
1-10    //  第一个片段
c       //自动选择第二个片段
2       //格点数根据实际情况选择
3       //导出后处理数据
```
NCI和IRI分析产生的只有func1.cub和func2.cub，而IGMH分析共生成了四个文件：sl2r.cub、dg.cub、dg_inter.cub、dg_intra.cub。
### 2.4 VMD作图
#### NCI & IRI
将func1.cub和func2.cub复制到VMD目录，运行tcl脚本：
~~~tcl
mol new func1.cub
mol addfile func2.cub
mol delrep 0 top
mol representation CPK 1.0 0.3 18.0 16.0
mol addrep top
mol representation Isosurface 0.50000 1 0 0 1 1
mol color Volume 0
mol addrep top
mol scaleminmax top 1 -0.04 0.02
color scale method BGR
~~~

#### IGMH
将四个cub文件复制到VMD文件夹内。首次使用时，还应把作图脚本IGM_intra.vmd和IGM_inter.vmd一并复制过去。

然后使用VMD主菜单File-Load Visualization State-IGM_inter.vmd来绘制图像，也可以使用命令行：
```
source IGM_inter.vmd
```
两个脚本，inter是绘制片段间的，intra是同时绘制片段内和片段间的。

调整好后，使用render渲染导出bmp图像即可。

[弱相互作用之可视化分析](https://zhuanlan.zhihu.com/p/665460526)
```
set terminal postscript landscape enhanced color 'Helvetica' 20
set encoding iso_8859_1
set output 'RDGscatter.ps'

# 设置图例
set key

# 设置X轴和Y轴的标签、字体及字号
set ylabel 'RDG' font 'Helvetica, 20'
set xlabel 'sign({/Symbol-Oblique l}_2){/Symbol-Oblique r} (a.u.)' font "Helvetica, 20"

# 设置色卡和绘图模式
set pm3d map
set palette defined (-0.035 "blue", -0.0075 "green", 0.02 "red")

# 设置数值格式
set format y "%.1f"
set format x "%.2f"
set format cb "%.3f"

# 设置边框宽度
set border lw 2

# 设置刻度范围、步长及字体
set xtic -0.05, 0.01, 0.05 nomirror rotate font "Helvetica"
set ytic -0.0, 0.2, 2.0 nomirror font "Helvetica"
set cbtic -0.035, 0.005, 0.02 nomirror font "Helvetica"

# 设置X轴、Y轴和色标范围
set xrange [-0.05:0.05]
set yrange [0.0:2.0]
set cbrange [-0.035:0.02]

# 绘图命令
plot 'output.txt' u 4:5:4 with points pointtype 31 pointsize 0.3 palette t  ''
```


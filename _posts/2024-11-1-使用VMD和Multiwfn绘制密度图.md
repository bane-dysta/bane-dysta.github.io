---
title: 使用VMD和Multiwfn绘制图像
date: 2024-11-01 19:00:00 +0800
categories: [Data Analysis, Molecular Orbital]
tags: [H-Bond,AIM,Multiwfn]     
---
# 1. Multiwfn处理
~~~
py wfn -t ~/scrpts/wfntxts/hole.txt
~~~
选择fchk文件，运行结束后，文件夹下输出hole.cub和electron.cub。

# 2. VMD绘图
将hole.cub和electron.cub复制到VMD文件夹内，输入
~~~
cub2 electron hole
cub2iso 0.002
~~~
即可渲染成图像。

[在VMD里将cube文件瞬间绘制成效果极佳的等值面图的方法](http://sobereva.com/483)








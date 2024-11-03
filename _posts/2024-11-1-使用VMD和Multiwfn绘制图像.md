---
title: 使用VMD和Multiwfn绘制图像
date: 2024-11-01 19:00:00 +0800
categories: [Data Analysis, Molecular Orbital]
tags: [H-Bond,AIM,Multiwfn]     
---
Multiwfn分析功能十分强大，但没有内置渲染功能，且分子不能拖动总觉得差点意思。不过Sobereva老师写了不少结合VMD绘制高质量图像的方法，很大程度弥补了这一缺陷。本文以hole-electron分析为例，记录高度脚本化的Multiwfn+VMD绘制电子-空穴图像的方法。
# 1. Multiwfn处理
进行空穴分析的命令是：
~~~
Multiwfn name.fchk < ~/scrpts/wfntxts/hole.txt > output.log
~~~
也可以使用脚本wfn.py：
~~~
py wfn -t ~/scrpts/wfntxts/hole.txt
~~~
脚本启动后，选择fchk文件。运行结束后，会在运行目录下输出``hole.cub``和``electron.cub``。
如果想要一次性绘制第一、第二、第三激发态的图像，可以使用``hole123.txt``:
~~~
py wfn -t ~/scrpts/wfntxts/hole123.txt
~~~
此时运行目录下输出的文件为``hole_00001.cub``、``hole_00002.cub``、``hole_00003.cub``和``electron_00001.cub``、``electron_00002.cub``、``electron_00003.cub``。

# 2. VMD可视化
参考[在VMD里将cube文件瞬间绘制成效果极佳的等值面图的方法](http://sobereva.com/483)，首先将showcub.vmd复制到VMD目录下，输入
~~~
source showcub.vmd
~~~
然后将hole.cub和electron.cub复制到VMD文件夹内，输入
~~~
cub2 electron hole
cub2iso 0.001
~~~
即可可视化电子与空穴。但若是要绘制三个激发态的图像，手动输入hole_00001等文件名仍觉繁琐，因此写了新的tcl脚本：
~~~
proc hole {suffix {filename "hole_electron"}} {
    # 检查输入的 suffix 是否为空或为 "r"
    if {$suffix eq ""} {
        # 默认情况下运行 cub2 electron hole 0.001
        puts "Running: cub2 electron hole 0.001"
        
        # 执行 cub2 命令
        cub2 electron hole 0.001
    } elseif {$suffix eq "r"} {
        # 如果 suffix 为 "r"，运行渲染命令，将 .tga 添加到 filename 中
        set output_file "${filename}.tga"
        
        puts "Running: render TachyonInternal $output_file"
        
        # 执行渲染命令
        render TachyonInternal $output_file
    } else {
        # 如果提供了其他的 suffix，在文件名中加入该后缀
        set electron_file "electron_0000$suffix"
        set hole_file "hole_0000$suffix"
        
        puts "Running: cub2 $electron_file $hole_file 0.001"
        
        # 执行带有后缀的 cub2 命令
        cub2 $electron_file $hole_file 0.001
    }
}

~~~
将该脚本保存为hole.tcl，输入source hole.tcl，即可使用hole命令。hole命令可以不带参数启动，此时读取的是hole.cub和electron.cub。若运行时提供参数，如``hole 1``，则读取``hole_00001.cub``和``electron_00001.cub``。
# 3. 渲染
可以使用命令进行渲染：
~~~
render TachyonInternal hole_electron.tga
~~~
只要将``output_image.tga``替换为输出文件名即可。hole命令也定义了渲染模式，输入``hole r``触发，默认文件名为``hole_electron.tga``。如果提供第二个参数，则使用第二个参数作为文件名，如``hole r pyronine``会将文件保存为pyronine.tga。



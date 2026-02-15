---
title: banewfn
summary: banewfn 的教程入口与资源索引。
---

banewfn是一个致力于简化Multiwfn使用而设计的程序。本程序原本是banetask的一个组件，但开发过程中发现单拎出来在Windows下用也不错，于是用mingw单独编译了一份。项目原地址：https://github.com/bane-dysta/banewfn




<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [安装](#安装)
    - [Multiwfn](#multiwfn)
    - [VMD](#vmd)
    - [GitBash](#gitbash)
    - [Banewfn本体](#banewfn本体)
- [脚本示例](#脚本示例)
- [自定义教程](#自定义教程)
    - [conf文件](#conf文件)
    - [输入文件](#输入文件)
    - [banewfn.rc](#banewfnrc)

<!-- /TOC -->

## 安装
此处默认使用者使用Windows版，Linux用户一般是高手，看完这个应该基本也知道咋回事了。前面先讲依赖程序，本体在后面。

### Multiwfn
下载地址：http://sobereva.com/multiwfn/

Multiwfn是可以解压即用的，但是为了可以在命令行调用，本文要求将Multiwfn加入`PATH`。具体操作方法：
- 打开Multiwfn可执行文件所在目录，把地址复制出来备用
- 使用快捷键Win+R打开运行窗口，输入sysdm.cpl回车
- 在弹出的窗口里打开`高级`选项卡，点击下方的`环境变量`
- 在新弹出的窗口上半部分，点击新建。
- 变量名填`Multiwfnpath`，变量值为先前复制的Multiwfn可执行文件所在目录
- 点击确定以添加环境变量
- 找到一个名为`Path`的环境变量，双击打开
- 在弹出的窗口点击新建，再次粘贴先前复制的Multiwfn可执行文件所在目录
- 点击确定退出`Path`设置
- 点击确定退出环境变量设置

完成后，Win+R运行cmd，在命令行键入multiwfn，如果可以成功运行Multiwfn，则证明设置成功

### VMD
下载地址：https://www.ks.uiuc.edu/Development/Download/download.cgi?PackageName=VMD

当前(2026.2.14)推荐下载VMD 1.9.3，这是稳定版，BUG少。VMD最好不要装在C盘，其他盘随便找个地方安装即可。安装路径最好不要有中文、空格与特殊字符。安装完毕后，同样需要将路径添加至`PATH`：

- 打开VMD可执行文件所在目录，把地址复制出来备用
- 使用快捷键Win+R打开运行窗口，输入sysdm.cpl回车
- 在弹出的窗口里打开`高级`选项卡，点击下方的`环境变量`
- 在新弹出的窗口上半部分，点击新建。
- 变量名填`VMDSCRIPTS`，变量值为先前复制的VMD可执行文件所在目录
- 点击确定以添加环境变量
- 找到一个名为`Path`的环境变量，双击打开
- 在弹出的窗口点击新建，粘贴先前复制的VMD可执行文件所在目录
- 点击确定退出`Path`设置
- 点击确定退出环境变量设置

随后，打开VMD所在目录的vmd.rc，添加一些内容并保存退出：

```
source $env(VMDSCRIPTS)/vcube.tcl
set style_dir $env(VMDSCRIPTS)\\styles
```

最后下载ggdh老师的[vcube](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=18150&fromuid=63020)，并把vcube.tcl和style放进vmd所在目录。公社下载文件要注册，在这里也[提供一份2.0版](/_file/banewfn/vcube2.0.rar)。

### GitBash
为了在命令行使用bash脚本，需要安装一个gitbash。可以去[官网](https://git-scm.com/install/windows)下，但是这里走的是GitHub，偶尔会抽风下不下来。此时也可以去国内镜像下载，比如[清华源](https://mirrors.tuna.tsinghua.edu.cn/github-release/git-for-windows/git/)。

gitbash的安装一路默认即可，没啥难度。最好别改默认安装路径。

### Banewfn本体
banewfn可以从笔者的[GitHub](https://github.com/bane-dysta/banewfn/releases)下载，那边的更新最勤。

release里有两个版本。一个是压缩包，这一版解压后需要手动调一下配置文件。如果你已经按照上文操作配置过Multiwfn的路径，不想麻烦的朋友可以直接双击set.bat把配置文件做好。如果你是高手，也可以手动创建：在地址栏键入`%USERPROFILE%`，进入你的个人文件夹，创建一个`.bane`文件夹，在其中再创建一个`wfn`文件夹，在`wfn`里创建`banewfn.rc`（也就是`%USERPROFILE%/.bane/wfn/banewfn.rc`），路径自己填：
```
# banewfn.rc
gitbash_exec=C:\Program Files\Git\bin\bash.exe
Multiwfn_exec=%Multiwfnpath%\Multiwfn.exe
confpath=D:\MyProgram\banewfn\conf
cores=4
```
设置完后，还可以将bw后缀绑定banewfn。操作方法：任意新建一个bw文件，比如1.bw，在右键菜单里选择属性，从弹出的页面里找到选取打开方式，选择banewfn.exe作为bw文件的默认打开方式。

installer版则傻瓜化，跟着提示选路径即可让安装器代你做上述步骤。推荐先装完上面的Multiwfn和gitbash再用installer安装。

## 脚本集

## 自定义教程
公社介绍贴：[[辅助/分析程序] 模板化Multiwfn运行的一种途径](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=56646&fromuid=63020)

banewfn的方便之处在于可以用一个通用的bw文件完成复杂波函数分析。安装banewfn后，只要把conf文件写好，就可以随意组合操作拼成脚本。

### conf文件
conf文件是要求banewfn进行某一类波函数分析时读取的配置文件。以空穴电子分析为例，正常的Multiwfn键入流程为：
```
18
1
<logfile>
<state>
1
<grid>
```
格点处理完之后，进入了后处理菜单。其中，导出cub要用10和11：
```
10
1    // 1=total 2=local 3=cross
11
1
```
类似地，了解其他功能：导出overlap用12，跃迁密度13，跃迁偶极密度14，CDD15，等等。我们用conf文件将这些操作记录下来：
```
# 主逻辑，也就是进入后处理菜单需要的步骤
[main]
18
1
${logfile:-} # 输出文件
${state:-1}
1
${grid:-2}

# 空穴-电子分析
[cub]
10
${choice:-1} # 1=total 2=local 3=cross
11
${choice:-1}

[overlap]
12
${func:2} # 1=Sm 2=Sr

# 跃迁密度-transdens.cub
[transdens]
13

# ...
# 可以自定义更多

# 退出
[quit]
0 
0
0
q
```
其中，[main]记录主逻辑序列，[quit]块记录退出序列，其他块则是每种后处理的序列。为了让我们调用的时候可以稍微做些修改，约定使用shell风格的变量占位，且可以通过:-设定默认值。例如，${state:-1}表示若后续不指定，则state取默认值1。

### 输入文件
banewfn的默认输入文件后缀是bw，不过不强制绑定，读者想设置成别的也无所谓。输入文件控制banewfn如何组合conf里的序列：
```
# 文件头可以用wfn=xx指定交给Multiwfn的文件，支持通配符
wfn=*.fchk
# 用bash风格语法设定变量值。若写state=1，表示后文${state}均取值1；
# 而下面的bash数组写法表示分别对state为1,2,3的情况运行Multiwfn
state=(1 2 3)

# []块写conf文件名，表示这一步读取哪个配置文件。
# 后续到%process为止是变量配置部分，用来指定conf文件中预留变量的值
[hole-ele]
state ${state}
# %process后每一行均为后处理选项。指定变量值均在当行指定，空格分隔
%process
cub choice 1
transdens
# process完之后可以执行一段脚本。Windows下默认运行bat。
# 但如果写了shebang行则调用gitbash运行bash脚本。
# 可以使用${input}来使用输入文件的文件名。
%command
#!/bin/bash
mkdir -p hole-ele
mv hole.cub hole-ele/${input}_s${state}_hole.cub
mv electron.cub hole-ele/${input}_s${state}_ele.cub
mv transdens.cub hole-ele/${input}_s${state}_transden.cub
# end结尾闭合该[]块，后面可以继续添加[]块来进行其他波函数分析。
end
```

**基本规则解释：**
- [module]块告诉程序用的是哪个conf文件，然后跟着变量设定，如state 2设定分析第二个激发态，如果想要高质量格点，可以另起一行再加上grid 3。
- %process开始，后面调用conf中用方括号定义的后处理。前述conf定义了cub，这里写cub就加载了对应序列。变更变量值的话要在这一行修改，多个变量值之间空格分隔，不能另起一行，因为这里的每一行都会被视为一步独立的后处理。(所以如果你想在一次脚本运行中完成很多后处理，你要保证每次都回到main序列走入的菜单)
- 随后，你也可以用%command来执行一些命令。这在linux中会被写入sh脚本执行，Windows下会被写入bat脚本执行。最终，一个[module]块应当以end结尾，然后可以继续开[module]块做别的处理。

**细节：**
- **若某个[module]块未以end结尾而是以wait结尾，则程序运行完指定序列后会停住，允许用户继续交互操作Multiwfn。**
- 文件头可以以wfn=xxx的形式指定波函数文件，**允许通配符**。匹配到多个文件时自动批量处理，但应善用${input}以避免覆盖问题
- 可以在文件头以core=xx的形式指定并行核数。
- ${input}将会被替换为输入给Multiwfn的波函数文件名（不带后缀）
- 其他的${name}这种shell变量风格占位符会依次尝试这样确定：1）程序运行时通过命令行参数指定键值 2）输入文件头部的键值定义 3）工作目录名为name的文件里的内容
- %command可以不依赖[module]块单独写，但要以end结尾
- [module]块必须顶格写
- #后面的所有东西都视为注释，但%command内除外，有时候生成高斯输入文件还是需要写#的。
- windows下在banewfn.rc中设置gitbash_exec后，可以通过在%command第一行写#!/bin/bash告诉脚本用git bash来执行该脚本

### banewfn.rc
banewfn.rc虽然是rc后缀，但其实是个toml格式的配置文件，这个名称是设计的时候的历史遗留问题，不要在意。初始化时，程序会在当前目录、自身目录、~/.bane/wfn中依次寻找banewfn.rc。
```
gitbash_exec=C:\Program Files\Git\bin\bash.exe
Multiwfn_exec=Multiwfn.exe
confpath=D:\MyProgram\banewfn\conf
cores=4
```
其中，gitbash_exec在Linux无效。这里比较重要的是confpath，需要指向你存conf文件的位置。Multiwfn的话如果在PATH里其实写个Multiwfn.exe就能跑。cores就是默认核数，会被bw文件内、命令行参数覆盖。


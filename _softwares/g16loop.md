---
title: g16loop
summary: g16loop 的教程入口与资源索引。
---

g16loop是g16的套壳脚本，用于自动处理虚频和一些常见笨蛋错误。

公社介绍贴（附下载链接）：[可自动处理虚频的Gaussian结构优化脚本](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=56831&fromuid=63020)

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [安装](#安装)
- [运行](#运行)
- [行为特征](#行为特征)
    - [类型I - 笨蛋错误](#类型i---笨蛋错误)
    - [类型II - 可能导致意外操作的行为](#类型ii---可能导致意外操作的行为)
    - [类型III - 其他错误](#类型iii---其他错误)
- [帮助](#帮助)

<!-- /TOC -->

## 安装
解压并上传到Linux服务器上某处，例如`~/.local/bin`，执行：
```
cd ~/.local/bin
chmod +x g16loop
export PATH=$PATH:~/.local/bin
```
然后就可以在任意处调用g16loop了。

本脚本运行时将执行g16 xx.gjf > xx.log，所以你还需要按照一般途径正常安装g16。

## 运行
一般运行方式：g16loop xx.gjf

输入文件限制：
- 只支持笛卡尔坐标输入，无法解析冗余内坐标
- 大概率不支持link1，因为笔者的gjf解析库写的时候没考虑过link1的事
- 像冻结，额外输入，oniom层这种信息理论上是会保持的，如果发现信息丢失请反馈

## 行为特征
当脚本发现运行的任务是opt+freq且不是opt=TS，则g16计算完成后检查虚频。发现虚频时，按照第一个虚频振动矢量对结构做个微调，重新进行计算，默认最大尝试3轮。

经笔者长期实践，掰2轮都处理不掉的多数是格点精度不够引起的虚频，所以如果发现用了M062X或者wb97xd，第3轮会加int=superfine再跑。要注意的是若你优化一批结构，而只有个别的改int设置，将破坏横向对比性。所以不想脚本给你加int的话可以用--notryint。

一般来讲优化完成后的结构很接近极小点，步长可以放小，如果想启用的话可以用--loopstep 5指定第二轮后给opt加上maxstep=5。但有增加优化轮数的风险

除此之外，脚本还对个别报错有自动处理：

### 类型I - 笨蛋错误

默认开启处理，可以用--crash-handle false关闭。包含：
- `galloc:  could not allocate memory.`:

笔者常遇到slurm系统暂时分配不了内存导致这个报错。会先等5秒重算看看能不能给够内存，若尝试10次后还报这个，后续每次尝试把%mem指定的内存减1GB，上限99次
- `End of file in ZSymb.` || `End of file reading basis center.` || `EOF while reading ECP pointer card.`:

末尾少空行导致的。帮你加两行空行然后尝试重算
- `Internal input file was deleted`

一般是瞎搞临时文件引起的。会尝试续算，要是还瞎搞就不给你算了
- `Cannot combine IRC and frequency calculations`

报错就是字面意思。会移除不应该出现在这里的freq关键词。

- `QPErr --- A syntax error was detected in the input line.`

会处理几个笔者经常因在Gaussian-ORCA之间捯饬而写错的关键词：
  - M06-2X → M06 2X
  - wb97x-d、wb97x-d3 → wb97xd
  - def2-tzvp → def2tzvp
  - def2-svp → def2svp
  - def-tzvp、deftzvp → tzvp

### 类型II - 可能导致意外操作的行为

需要--crash-handle all开启
- `CPHF failed to converge in LinEq2.`

帮你加CPHF不收敛一般首先会尝试的CPHF=grid=fine重算
- `Convergence failure -- run terminated.`

尝试加SCF=XQC，如果还不收敛就拉倒，自己想办法
- `R6DS8: Unable to choose the S8 parameter`

对某些方法用了不合适的D3校正引起的。如果有em=gd3bj，首先降级到em=gd3再跑，此时M062X应该就能跑了。如果有em=gd3，直接删掉再跑，此时wb97xd应该就能跑了。如果删了还报这个错，那属于闹鬼了
- `FormBX had a problem.`

三点一线问题，大型体系优化到一半经常报这个错，但是常常可以用Gaussian启动的时候那个处理逻辑躲过去，所以会试着用末次结构重新交一次

### 类型III - 其他错误

其他报错通常不好自动处理，会截取输出文件末尾100行到tail.txt文件方便检查。

## 帮助
```
Usage: g16loop <input.gjf> [OPTIONS]

Automatically eliminate imaginary frequencies based on vibrational vectors in g16 runs.
Author: Bane Dysta

Options:
  --scale <factor>    Scaling factor for vibrational displacement vectors (default: 0.5)
                      New coordinates = optimized + scale * displacement_vector.
                      When clash is detected, the scale factor will be halved.

  --iters <N>         Maximum number of iterations to run (default: 3)
                      Must be >= 1.

  --loopstep <N>      Add MaxStep=N to Opt keyword from iteration 2 onwards (default: disabled)
                      Helps control step size in optimization. Must be >= 1.

  --tryint            Force enable int=superfine from iteration 3 onwards
                      Overrides auto-detection.

  --notryint          Force disable int keyword addition
                      Prevents automatic addition of int=superfine even for M062X/wB97XD.

  --crash-handle <mode>  Crash handling mode (default: default)
                      Options: default(enable category I), all(enable I+II), false(disable I/II auto-fix)
                      Note: Category III (write tail.txt for unknown errors) is always enabled.

  -h, --help          Show this help message

Notes:
  - If neither --tryint nor --notryint is specified, auto-detection is used:
      if method is M062X or wB97XD, add int=superfine from iteration 3.
      Be careful, this would change the shape of the potential energy surface,
      thus may destroy the comparability of this run with previous ones.
  - Loop mode will be enabled only when Opt+Freq and no TS in Opt is detected.
  - Crash handling category:
      I - galloc(99): try declining mem request
      I - EOF(3): add 2 empty lines to the end of the gjf file
      I - Internal input deleted(1): retry
      I - QPErr(1): fix normal syntax errors (M06-2X->M062X, etc.)
      I - Cannot combine IRC and frequency calculations(1): remove Freq keyword and retry
     II - CPHF convergence(1): try adding CPHF=grid=fine
     II - SCF convergence(1): try adding SCF=XQC
     II - R6DS8(2): try reducing D3 type
     II - FormBX(3): try to calculate again
    III - others(1): write last 100 lines to tail.txt
```

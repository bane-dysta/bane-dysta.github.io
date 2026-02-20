---
title: xyzTrick
summary: xyz文件的剪切板艺术
---

Last Update: 26/2/19

xyzTrick是一个致力于利用剪切板作为媒介传递信息，避免直接从服务器下载log文件的程序，另有一些辅助功能。

项目原地址：https://github.com/bane-dysta/xyzTrickGview2

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [安装](#安装)
- [运行功能](#运行功能)
    - [xyz剪切板](#xyz剪切板)
    - [逆向剪切板](#逆向剪切板)
    - [解析chg文本](#解析chg文本)
- [套壳功能](#套壳功能)
    - [`.xyz`&`.chg`文件](#xyzchg文件)
    - [`.log`&`.out`文件](#logout文件)
- [插件功能](#插件功能)
    - [clipxtb](#clipxtb)
    - [clipchem3d](#clipchem3d)

<!-- /TOC -->

## 安装
在[release](https://github.com/bane-dysta/xyzTrickGview2/releases)里下载最新版。提供两种版本，一种是单可执行文件，一种是installer。

单独下载可执行文件时，需要自行处理配置ini文件。installer则会获取GAUSS_EXEDIR帮用户确定一些路径。

配置文件示例：
```
[main]
hotkey=CTRL+ALT+X
hotkey_reverse=CTRL+ALT+G
gview_path=%GAUSS_EXEDIR%\gview.exe
gaussian_clipboard_path=%GAUSS_EXEDIR%\Scratch\fragments\Clipboard.frg
temp_dir=temp
log_file=logs\xyz_monitor.log
log_level=INFO
log_to_console=true
log_to_file=true
wait_seconds=10
# Memory limit in MB for processing (default: 500MB)
max_memory_mb=500
# Optional: set explicit character limit (0 = auto calculate from memory)
max_clipboard_chars=65536000
# XYZ Converter Column Definitions (1-based indexing)
element_column=1
xyz_columns=2,3,4
# CHG Format Support (format: Element X Y Z Charge)
try_parse_chg_format=true
# Atomic Number Parsing (try to parse element column as atomic number)
try_parse_atomic_number=true
# Log file viewers
orca_log_viewer=plugins\OfakeG.exe
gaussian_log_viewer=gview.exe
other_log_viewer=notepad.exe

# plugins
[clipxtb]
cmd=plugins\clipxtb.exe
hotkey=CTRL+ALT+D

[clipchem3d]
cmd=plugins\clipchem3d_silent.exe

[clipcp2k]
cmd="plugins\cp2k2xyz.exe"
hotkey=CTRL+ALT+F
```
## 运行功能
xyzTrick运行时，可以监听快捷键输入进行以下剪切板功能：
### xyz剪切板
描述：本程序的主功能。将剪切板上的xyz text转换为Gaussian风格log文件，并尝试用gview打开。

配置文件相关项：
- `hotkey`：设置触发快捷键，默认CTRL+ALT+X
- `gview_path`：gview可执行文件的路径，默认%GAUSS_EXEDIR%\gview.exe
- `temp_dir`：生成的Gaussian日志文件路径，默认temp
- `wait_seconds`：自动清理Gaussian日志文件的时间，默认10s
- `max_memory_mb`：处理剪切板内容时，使用内存上限，默认500 MB
- `max_clipboard_chars`：处理剪切板内容时，处理字符数上限，默认65536000
- `element_column`：指定第几列为元素列。在处理非标准形式xyz文件时有用
- `xyz_columns`：指定xyz坐标是第几列。同上

细节：若xyz文本第二行写入了形如
```
MaxF=6.9e-03 RMSF=7.8e-04 MaxD=2.2e-01 RMSD=5.1e-02 E=-1941.608811
```
的收敛信息，将之一并写入生成的Gaussian日志文件，可以直接在gview里查看收敛情况。这种带有收敛信息的xyz文件可以用[banedata](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=58180&fromuid=63020)生成。

### 逆向剪切板
描述：将gview clipboard上的内容转换成xyz text，并写入剪切板。

配置文件相关项：
- `hotkey_reverse`：逆向剪切板触发快捷键，默认CTRL+ALT+G
- `gaussian_clipboard_path`：Clipboard.frg所在路径。需要自己去Gaussian的scratch目录里找到，每个人不一样。

### 解析chg文本
描述：解析sobereva老师约定的chg格式文本（第五列为电荷列），并将电荷写入Gaussian日志文件。触发快捷键同主功能。

配置文件相关项：
- `try_parse_chg_format`：bool变量，true表示优先尝试按chg解析而不是按`element_column`和`xyz_columns`解析。

## 套壳功能
xyzTrick可以作为`.log`、`.out`、`.chg`、`.xyz`等后缀的默认打开程序，并为其选择合适的打开方式。

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2026/02/qmFL4w7q_converted.gif)

### `.xyz`&`.chg`文件
描述：与前述剪切板行为一致。

### `.log`&`.out`文件
描述：xyzTrick将首先判断该程序是否为Gaussian日志文件，若是则直接打开。若不是，检查是否是orca日志文件，若是则先用ofakeg转换为Gaussian日志文件再打开，若不是，则用默认文本文档程序打开。

配置文件相关项：
- `orca_log_viewer`：ofakeg路径
- `gaussian_log_viewer`：gview路径
- `other_log_viewer`：用于打开其他格式文件的文本编辑器路径

## 插件功能
xyzTrick可以监听快捷键，打开对应应用程序。该功能是为其他剪切板联动而设计的，配置文件写法：
```
[plugin name]
cmd=path\to\plugin.exe
hotkey=YOUR_HOT_KEY
```
作者提供两个插件。

### clipxtb
描述：将剪切板上的xyz文本用xtb优化一下再写回去。

公社介绍贴：[用xtb优化剪切板上的xyz文件](http://bbs.keinsci.com/forum.php?mod=viewthread&tid=56511&fromuid=63020)

### clipchem3d
描述：将剪切板上的chem3d对象转换为xyz文本。

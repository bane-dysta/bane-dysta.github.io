---
title: Orbital Viewer：快速可视化分子轨道工具
date: 2024-11-11 12:00:00 +0800
categories: [Tools and Scripts]
tags: [OrbViewer, Molecular Orbital, Visualization]
pin: true   
---
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/orbital-viewer)
[![Python](https://img.shields.io/badge/python-3.6+-yellow.svg)](https://www.python.org/)

## 💡简介

Orbital Viewer是一个主要由JavaScript与python写成的简易轨道查看器，用于提供直观的三维界面来展示和分析轨道，并快速整理计算结果，令使用者可以大致掌握分子的基本信息。

- 系统要求：目前支持Windows 10及以上版本，Windows 7未测试。Linux理论上可兼容，但作者没有具有图形界面的linux机子来测试。
- 网络要求：可以本地运行，未来可能设计局域网服务功能。
- 环境依赖：预编译版本exe可直接使用，源码运行需要python 3.11。

## 🚀快速开始

直接双击运行Orbital Viewer.exe，您应该看到类似这样的主菜单窗口弹出：

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2024/11/20241111170051.png)

如果您希望自己决定观看哪些cub文件，可以输入1并回车，此时应当有网页打开：

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2024/11/20241111170459.png)

您可以向其中窗口拖动本地文件进行渲染。目前Orbital Viewer仅支持cub文件，计划在将来加入xyz文件和log文件等常用格式。观看完毕后，若您想保存当前配置以供下次快速加载，可以点击页面顶端的保存配置按钮，这将从浏览器下载一个json文件。下次加载配置时，可以从主功能进行2快速加载。(要求json与要加载的cub文件在同一目录下)

如果您有已经计算完毕的一系列cub文件，也可以在主菜单输入3并回车，然后将计算文件夹拖进命令行窗口，程序将自动生成配置文件：

![](https://pub-ec46b9a843f44891acf04d27fddf97e0.r2.dev/2024/11/20241111171907.png)

推荐使用笔者的[tasker套件](https://bane-dysta.github.io/posts/Tasker/)完成自动计算和调用multiwfn分析。

## 📚 界面说明

### 基本操作
1. 启动程序
   
   双击Orbital Viewer.exe或运行
   ```bash
   python main.py
   ```

2. 导入文件
   - 拖放 .cube/.cub 文件到轨道视图窗口
   - 通过json配置文件加载（对应cub文件需与json文件在同一路径下）
   - 提供文件夹路径，生成配置文件

3. 调整显示
   - 使用鼠标旋转分子
   - 滚轮缩放
   - 在配置选项卡中调整等值面和颜色

4. 导出文件
   - 对单个轨道组截图
   - 导出所有轨道组截图
   - 导出配置文件

### 快捷键

|     快捷键     |    功能    |
| :------------: | :--------: |
|    鼠标左键    |  旋转视图  |
| Ctrl+鼠标左键  |  平移视图  |
| Shift+鼠标左键 |  缩放视图  |
|    鼠标滚轮    |  缩放视图  |
| Ctrl+C(命令行) | 返回主菜单 |

## 🔰下载地址

Release:
[Orbital Viewer.exe](https://github.com/bane-dysta/Orbital_Viewer/releases)

GitHub:
[Orbital_Viewer](https://github.com/bane-dysta/Orbital_Viewer)

## 📋 更新日志

### v1.0.1 (2024-3-18)
- 支持一键截图
- 支持读取Note字段的内容并附加进截图，以更好地展示tasker解析的信息(匹配到单行内"="号时会以表格形式列出在图下方)
- 支持轨道映射规则，用于显示静电势表面分布图等上色的等值面


### v1.0.0 (2024-11-11)
- 初始版本发布
- 基本的轨道显示功能
- 配置文件的自动生成

## 🙏 致谢

- [3Dmol.js](https://3dmol.csb.pitt.edu) - 提供分子可视化支持
- [Claude](https://claude.ai/) - 提供代码支持

> Author: Bane Dysta  
> Email: banerxmd@gmail.com  
> Website: https://bane-dysta.github.io/

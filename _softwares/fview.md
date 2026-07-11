---
title: fview
summary: 自动识别量子化学输出，并用 GaussianView 或文本编辑器打开
---

Last Update: 2026/07/11

`fview.exe` 是一个用于打开量子化学输出文件的小工具。它会先识别输出来自哪个程序；对于支持的计算类型，程序会将内容转换为 GaussianView 可读取的 Gaussian 风格日志并自动打开。Gaussian 日志无需转换，直接交给 GaussView。

无法识别为受支持程序输出的 `.log`、`.out` 文件不会强行转换，而是直接使用配置的文本编辑器打开。因此，可以把 `fview.exe` 设为这些文件的默认打开程序，用同一个入口查看不同量化程序的输出。

## 支持情况

| 程序 | 支持内容 | 说明 |
| --- | --- | --- |
| AMESP | 几何优化、频率分析、TDDFT 属性 | 转换为 Gaussian 风格日志后打开 |
| BDF | 几何优化、频率分析 | 转换为 Gaussian 风格日志后打开 |
| GAMESS | 几何优化、频率分析 | 转换为 Gaussian 风格日志后打开 |
| Gaussian | 任意 | 直接使用 GaussianView 打开原文件 |
| MAPLE | 几何优化 | 频率日志不包含结构信息，暂不支持频率分析 |
| ORCA | 几何优化、频率分析 | 转换为 Gaussian 风格日志后打开 |
| xTB（`g98.out`） | 频率分析 | 识别 xTB 生成的 Gaussian-like 频率输出并重新生成日志 |

不在表中的程序将使用文本编辑器打开原始输出。

## 使用方法

最方便的用法是把 `fview.exe` 关联到 `.log`、`.out` 和 `.txt` 文件。之后双击输出文件，fview 会自动完成程序识别、格式转换和查看器选择。

也可以从命令行运行：

```powershell
fview.exe molecule.out
```

检查文件会使用哪个适配器：

```powershell
fview.exe --detect molecule.out
```

只转换而不启动 GaussianView：

```powershell
fview.exe --no-open -o molecule_fake.log molecule.out
```

自动识别失败时，可以手动指定格式：

```powershell
fview.exe --format orca molecule.out
fview.exe --format xtb g98.out
fview.exe --format text-editor unknown.log
```

## 配置

首次运行时，fview 会创建配置目录：

```text
%USERPROFILE%\.bane\fview\
```

主配置文件为：

```text
%USERPROFILE%\.bane\fview\fview.conf
```

常用配置项如下：

```ini
[main]
# GaussianView 路径；也可以填写已加入 PATH 的程序名
gview_path=%GAUSS_EXEDIR%\gview.exe

# 无法识别的输出文件使用该程序打开
text_editor_path=notepad.exe
```

`gview_path` 可以改为本机的 `gview.exe` 完整路径；`text_editor_path` 也可以换成其他编辑器，例如 VS Code。修改配置后无需重新安装。

---
title: qc2g16_external
summary: g16聚合接口
toc: true
---

Last Update: 2026/07/11

目前，g16的几何优化器仍然是市面上非常优秀的，但gaussian本身更新慢，对新方法支持不足，因此需要接口来让外部程序也用上g16的优化器。著名的接口有sobereva老师的gau_xtb、gau_orca等，不过这些接口的文件分散，在使用时存在一定的复杂性。

为解决上述问题，笔者决定让[BaneTask](/software/banetask/)具有通用接口功能，而核心实现即为`qc2g16_external`。`qc2g16_external`采用聚合的解析器，支持xTB、ORCA、GAMESS、AMESP和Gaussian本身，因此可以将这些程序的提取拿给Gaussian使用。本接口的理念是用最少的文本量和文件数来设置好任务：
```bt
$interface-gfn2-xtb
  %program xtb
  %args --gfn 2         # 仅指定级别，其他参数由qc2g16_external根据请求导数自动补充
  %control
    totcore 16
    totmem 32000
  %interface provider   # provider表示承担计算任务

$external-gfn2-xtb
  %source origin
  %program gaussian
  %control
    totcore 8
    totmem 16000
  %interface consume interface-gfn2-xtb   # 消费interface-gfn2-xtb
  %keywords "opt(nomicro,modr) freq nosymm external='[external]'"
```

若需要自定义计算流程，比如引入mokit构建初猜等，也可以自行编写`qc2g16_external`配置文件，见后文。

## 支持自动计算的后端

| 后端 | 输入 | 结果来源 |
|---|---|---|
| xTB | XYZ 模板 | `energy`、`gradient`、`hessian` sidecar |
| ORCA | 结构化生成 `*.inp` | `*.engrad`、`*.hess`，缺项时可回退解析主输出 |
| GAMESS-US | 结构化生成 `*.inp` | `*.dat` / punch 中的 `$GRAD` 与 `$HESS` |
| AMESP | 结构化生成 `*.aip` | 主输出 `*.aop` |
| Gaussian | 结构化生成 `*.gjf` | `formchk` 生成的 `*.fchk` |

BaneTask 的 `%interface` 目前支持上表五类 provider。maple可以走 BaneLib 的统一结果解析，但暂未进入主线，其计算时间虽短，但是加载模型时间过长，应当额外处理。若希望将maple接上Gaussian优化器，可以直接手写配置使用 `kind = maple`。

## 推荐用法：交给 BaneTask 生成

正常使用时没必要自己维护配置文件和启动脚本。[BaneTask](/software/banetask/) 已经接入 `qc2g16_external`：一个任务声明后端 provider，另一个 Gaussian 任务消费它。provider 只保存程序类型、方法和资源，不会单独生成 workflow。

下面的任务让 Gaussian 在 GFN2-xTB 势能面上完成优化和频率计算：

```bt
$interface-gfn2-xtb
  %program xtb
  %args --gfn 2
  %control
    totcore 16
    totmem 32000
  %interface provider

$external-gfn2-xtb
  %source origin
  %program gaussian
  %control
    totcore 8
    totmem 16000
  %interface consume interface-gfn2-xtb
  %keywords "opt(nomicro,modr) freq nosymm external='[external]'"
```

XTB provider 不必手写电荷、自旋和导数参数。BaneTask 会补上 `--chrg`、`--uhf` 以及当前步骤需要的能量、梯度或 Hessian 参数。

生成 consumer 后，任务目录中会多出：

```text
external-gfn2-xtb/
  external-gfn2-xtb_<case>.gjf
  <case>_external-gfn2-xtb.external.sh
  <case>_external-gfn2-xtb.qc2g16_external.conf
  external/
```

`external.sh` 先执行 provider 环境配置中的 `ENV_SETUP`，再调用 `qc2g16_external`。外部程序的输入、输出和 sidecar 都放在 `external/` 目录，Gaussian 的输入和日志留在任务目录。

Gaussian 输入使用 consumer 的 `totcore` 和 `totmem`；外部后端使用 provider 的资源。workflow 申请两边较大的核数和内存，避免外层 Gaussian 能启动、后端却拿不到资源。

### provider 环境配置

BaneTask 从 `BANETASK_ENVCONF_PATH` 读取现有程序配置：

- Gaussian：`g16.conf`
- xTB：`xtb.conf`
- ORCA：`orca.conf`
- GAMESS：`gamess.conf`，找不到时尝试 `gms.conf`
- AMESP：`amesp.conf`

配置必须包含 `ENV_SETUP` 和非空的 `RUN_CMD_TEMPLATE`，运行命令还要引用实际输入文件。XTB 的模板必须保留 `${ARGS}` 或 `${EXTRA_ARGS}`，因为电荷、自旋和导数参数会从这里传入。

```conf
SUFFIX=xyz
OUTPUT_SUFFIX=out

ENV_SETUP='module load xtb'
RUN_CMD_TEMPLATE='xtb "${ACTUAL_INPUT_FILE}" ${ARGS} > "${ACTUAL_OUTPUT_FILE}" 2>&1'
```

### 其他 provider 写法

consumer 的写法不变，只需替换 provider 名称。

```bt
$interface-orca
  %program orca
  %keywords "r2SCAN-3c TightSCF"
  %interface provider

$interface-gamess
  %program gamess
  %keywords << GAMESS
 $CONTRL SCFTYP=RHF COORD=UNIQUE UNITS=ANGS $END
 $BASIS GBASIS=STO NGAUSS=3 $END
GAMESS
  %interface provider

$interface-amesp
  %program amesp
  %keywords "B3LYP def2-SVP"
  %extrainput << AMESP
%scf maxcyc 200
AMESP
  %interface provider

$interface-g16
  %program gaussian
  %keywords "wB97XD/def2TZVP nosymm"
  %interface provider
```

ORCA、AMESP 和后端 Gaussian 的导数关键词会自动追加。GAMESS 的 `$CONTRL RUNTYP` 由接口按请求改成 `ENERGY`、`GRADIENT` 或 `HESSIAN`。Gaussian provider 运行后会调用同一环境中的 `formchk`，因此 `g16.conf` 初始化的环境里必须同时能找到 `g16` 和 `formchk`。

## 不使用 BaneTask：手写接口

不使用 BaneTask 时，可以直接手写配置。下面是一份完整的 xTB 配置：

{% raw %}
```ini
[program]
kind = xtb

[resources]
nprocs = 8
memory_mb = 16000
env.OMP_NUM_THREADS = {{resources.nprocs}}

[input]
path = mol.xyz
content <<END_INPUT
{{geometry.xyz_with_header}}
END_INPUT

[run]
working_directory = ./external
shell = true
command <<END_RUN
rm -f energy gradient hessian
xtb "{{input.path}}" \
  --gfn 2 \
  --chrg {{charge}} \
  --uhf {{uhf}} \
  {{derivative_keyword}} \
  > "{{program.output}}" 2>&1
END_RUN

[result]
output = xtbout
energy_file = energy
gradient_file = gradient
hessian_file = hessian
```
{% endraw %}

再写一个传给 Gaussian 的启动脚本：

```bash
#!/usr/bin/env bash
set -euo pipefail

here="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$here"
exec qc2g16_external "$here/xtb.qc2g16_external.conf" "$@"
```

```bash
chmod +x xtb.external.sh
```

Gaussian 输入只负责流程控制：

```text
%chk=water.chk
%mem=16GB
%nprocshared=8
#p opt(nomicro,modr) freq nosymm external='./xtb.external.sh'

GFN2-xTB optimization and frequency

0 1
O   0.000000   0.000000   0.117790
H   0.000000   0.755453  -0.471161
H   0.000000  -0.755453  -0.471161

```

正式的 Gaussian 调用参数由 `External` 自动传入：

```text
qc2g16_external <config> <layer> <input> <output> <msg> <fchk> <matel>
```

本地调试可以省掉 layer 和其他 Gaussian 临时文件参数：

```text
qc2g16_external <config> <input> <output>
```

## 接口配置文件

接口配置分为五段：

| 段 | 用途 |
|---|---|
| `[program]` | 指定后端类型，也决定导数关键词和结果解析方式 |
| `[resources]` | 核数、总内存和运行时环境变量 |
| `[input]` | 外部程序输入文件名、模板或结构化生成器参数 |
| `[run]` | 工作目录、启动命令、shell 与标准流重定向 |
| `[result]` | 主输出以及梯度、Hessian、dat、fchk 等 sidecar 路径 |

输入既可以像 xTB 示例那样用 `content` 写完整模板，也可以用 `generator = gaussian|orca|gamess|amesp` 生成标准输入。运行命令需要管道、重定向、`&&` 或多条命令时，设置 `shell = true`。

常用占位符如下：

{% raw %}
| 占位符 | 内容 |
|---|---|
| `{{charge}}` | 总电荷 |
| `{{multiplicity}}` | 自旋多重度 |
| `{{uhf}}` | `multiplicity - 1` |
| `{{derivative_order}}` | `energy`、`gradient` 或 `hessian` |
| `{{derivative_keyword}}` | 当前后端对应的导数关键词 |
| `{{geometry.xyz}}` | 不带头部的 Å 坐标 |
| `{{geometry.xyz_with_header}}` | 完整 XYZ 文本 |
| `{{resources.nprocs}}` | 并行核数 |
| `{{resources.memory_mb_per_core}}` | 每核内存，单位 MB |
| `{{input.path}}` / `{{input.stem}}` | 外部输入路径 / 文件 stem |
| `{{program.output}}` | `[result] output` 对应的主输出路径 |
{% endraw %}

## 导数请求映射

Gaussian 会告诉 External 当前需要零阶、一阶还是二阶导数。配置只写一个统一的 {% raw %}`{{derivative_keyword}}`{% endraw %}，接口按后端展开：

| 后端 | 能量 | 梯度 | Hessian |
|---|---|---|---|
| xTB | 空 | `--grad` | `--hess --grad` |
| ORCA | `SP` | `EnGrad` | `EnGrad Freq` |
| GAMESS | `RUNTYP=ENERGY` | `RUNTYP=GRADIENT` | `RUNTYP=HESSIAN` |
| AMESP | 空 | `force` | `numfreq` |
| Gaussian | `sp` | `force` | `freq` |

二阶导数请求不只需要 Hessian，还必须返回同一结构的能量和梯度。Hessian 必须是完整的 `3N × 3N` Cartesian 矩阵；缺文件、维度不符或原子数不一致时，接口直接终止，不会用数值差分补齐。

## 构建

`qc2g16_external` 位于 BaneLib 的 `apps/g16/external/`：

```bash
cmake -S . -B build \
  -DBANE_BUILD_APPS=ON \
  -DBANE_BUILD_G16_EXTERNAL_APPS=ON \
  -DBANE_BUILD_TESTS=OFF

cmake --build build --parallel
cmake --install build --prefix "$HOME/.local"
export PATH="$HOME/.local/bin:$PATH"
```

```bash
qc2g16_external --help
```

BaneTask 生成的 `external.sh` 直接按命令名调用它，因此安装目录必须在计算节点的 `PATH` 中。

## 常见问题

### BaneTask 在生成输入时就报错

先检查 provider 对应的环境配置。`ENV_SETUP` 和 `RUN_CMD_TEMPLATE` 不能缺失，命令模板必须引用输入文件；XTB 模板还必须包含 `${ARGS}` 或 `${EXTRA_ARGS}`。

### 外部程序运行成功，Gaussian 仍然失败

进入 consumer 任务的 `external/` 目录，核对主输出和 sidecar 是否真的生成。文件名应与接口配置中的 {% raw %}`{{input.stem}}`{% endraw %} 一致。手写配置时最好在每轮运行前删除旧的 `energy`、`gradient`、`hessian`、`.engrad`、`.hess` 或 `.dat`，避免把上一次结果当成当前结果。

### 梯度能跑，频率失败

后端只返回了梯度，没有返回 Hessian，或者 Hessian 维度不是 `3N × 3N`。同时检查输入中是否保留了 {% raw %}`{{derivative_keyword}}`{% endraw %}；删掉这个占位符后，后端会一直按固定任务类型运行。

### GAMESS 找不到 `.dat`

让 `rungms` 位于 `PATH`，并确认脚本中有可解析的 `set USERSCR=...`。接口会按当前输入文件的 stem 从 `USERSCR` 取回 `.dat`；也可以在 wrapper 中自行复制到 `[result] data_file` 指定的位置。


---
title: btrun
summary: 从计算输入到本地队列或集群调度器的任务提交工具
---

Last Update: 2026/07/18

`btrun task` 接收 Gaussian、ORCA、xTB 或其他程序的输入文件，读取程序运行配置，整理核心数、内存和 GPU 等资源需求，再把任务交给本地执行队列、Slurm、SGE 或 PBS。

它替代的是日常计算中反复复制的提交脚本。程序路径、环境初始化和启动命令写在 `<type>.conf` 中；集群、分区、资源上限和调度指令写在 `btrun` 的 profile 与 queue 配置中。提交时只需给出输入文件和运行目标。

一条任务从命令行到结束，大致经过下面这条链路：

```text
输入文件或目录
  -> 选择任务类型并读取 <type>.conf
  -> 找到需要运行的输入，跳过已有输出
  -> 确定每个任务的核心数、内存和 GPU
  -> 选择执行目标与 queue
  -> 生成任务脚本
  -> 提交给 Slurm/SGE/PBS，或写入 local 文件队列
  -> 执行、记录日志并进入终止状态
```

项目地址：

- GitHub：https://github.com/bane-dysta/banetask
- Gitee：https://gitee.com/bane-dysta/banetask2

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [核心概念](#核心概念)
- [初始化](#初始化)
- [程序配置](#程序配置)
  - [脚本执行](#脚本执行)
- [输入解析](#输入解析)
  - [类型判定](#类型判定)
  - [跳过判定](#跳过判定)
  - [RAW MODE](#raw-mode)
- [资源解析](#资源解析)
  - [核心参数](#核心参数)
- [队列模型](#队列模型)
  - [调度器队列](#调度器队列)
  - [执行目标](#执行目标)
- [调度器提交](#调度器提交)
- [本地队列](#本地队列)
  - [任务入队](#任务入队)
  - [运行器启动](#运行器启动)
  - [本地资源分配](#本地资源分配)
  - [任务启动](#任务启动)
  - [状态迁移](#状态迁移)
- [任务管理](#任务管理)
- [使用示例](#使用示例)
  - [Slurm 提交](#slurm-提交)
  - [本地并发](#本地并发)

<!-- /TOC -->

## 核心概念

`btrun` 的配置分为程序层和执行层。下面四个概念承担不同职责。

| 概念 | 作用 | 典型文件或命令 |
|---|---|---|
| task type | 定义某个程序怎样启动、输入后缀和输出后缀 | `g16.conf`、`orca.conf`、`btrun task -t g16` |
| profile | 描述一个执行目标，关联调度器、queue 目录和路由规则 | `profiles/cluster-a.yaml` |
| scheduler queue | 集群上的 partition/queue 及其资源能力 | Slurm partition、SGE queue、PBS queue |
| local file queue | `btrun` 自己维护的本地任务状态目录和 runner | `~/.bane/taskq/`、`btrun queue run` |

这里有两个名称都叫 queue 的对象。

集群 queue 是 Slurm、SGE 或 PBS 提供的执行分区。`btrun` 在 queue catalog 中给它们设置逻辑名称、别名、资源上限和调度指令。

local queue 则是 `btrun` 自己的磁盘队列。任务先写进 `pending`，runner 启动后移入 `running`，结束后进入 `done`、`failed` 或 `cancelled`。它不依赖 Slurm，也不是 Slurm partition 的本地模拟名称。

## 初始化

初次使用时，利用`btrun init` 初始化执行端配置。例如在 Slurm 集群上可以先运行：

```bash
btrun init --profile cluster-a --backend slurm
```

默认配置根目录是：

```text
~/.bane/task/btrun/
```

`init` 会交互式生成以下文件：

| 文件 | 内容 |
|---|---|
| `schedulers/slurm.yaml` | `sbatch`、`squeue`、`scancel` 等命令，脚本后缀，任务号提取规则和状态映射 |
| `profiles/cluster-a.yaml` | profile 名称、调度器类型、默认 queue，以及 queue catalog 和 routing policy 的位置 |
| `queues/cluster-a.yaml` | 每个 queue 的原生名称、别名、资源上限、优先级和调度头模板 |
| `routes/cluster-a.yaml` | 根据核心数、内存和 GPU 请求选择 queue 的规则 |
| `profiles/local.yaml` | local 执行是否启用、可用核心数、内存、GPU 和预留资源 |

`init` 会尝试读取当前调度器已有的 partition 或 queue，然后询问每个 queue 的节点数、单节点核心数、内存、GPU 和提交头格式。它生成的是可修改的配置，不会在集群上创建新的 partition。

例如，`queues/cluster-a.yaml` 中的一项可能是：

```yaml
queues:
  cpu:
    scheduler_queue_name: qdhcnormal
    aliases: [normal]
    enabled: true
    priority: 50
    resources:
      max_nodes: 1
      max_cores_per_node: 64
      max_memory_mb_per_node: 240000
      max_gpus_per_node: 0
      default_cores: 16
      default_memory_mb: 64000
    header_lines:
      - "#SBATCH -p {{scheduler_queue_name}}"
      - "#SBATCH --cpus-per-task={{cores}}"
      - "#SBATCH --mem={{memory_mb}}M"
```

这里 `cpu` 是 `btrun` 使用的逻辑名称，`qdhcnormal` 是 Slurm 中真正的 partition。下面三种写法都可以指向它，具体取决于 catalog 中定义的名称和别名：

```bash
btrun task -S -P cluster-a -q cpu ...
btrun task -S -P cluster-a -q normal ...
btrun task -S -P cluster-a -q qdhcnormal ...
```

登录节点通常能检测到 `sbatch`、`squeue` 等调度命令。`init` 在这种机器上默认关闭 local target，避免把量化计算直接跑在登录节点。独立工作站或计算服务器可以显式启用：

```bash
btrun init --yes \
  --profile local \
  --backend local \
  --local-target enable \
  --local-cores 64 \
  --local-memory 256G \
  --local-gpus 2 \
  --local-gpu-ids 0,1
```

`profiles/local.yaml` 中的 `max_cores`、`max_memory_mb` 和 `max_gpus` 表示机器容量；`reserve_cores`、`reserve_memory_mb` 和 `reserve_gpus` 会从容量中扣除，留下系统和交互任务需要的资源。

使用自定义输出目录时：

```bash
btrun init -O ./conf/btrun -P cluster-a -S
```

后续命令需要把 profile 目录传给 `btrun`：

```bash
btrun task --profile-dir ./conf/btrun/profiles ...
```

生成前检查内容可以使用：

```bash
btrun init --dry-run
```

已有文件默认不会覆盖，需要重建时使用 `--force`。

## 程序配置

每个 task type 对应一个 `<type>.conf`。例如 `-t g16` 读取 `g16.conf`，`-t orca` 读取 `orca.conf`。

一个可直接使用的 Gaussian 配置如下：

```conf
[main]
DESCRIPTION=Gaussian 16
SUFFIX=gjf
OUTPUT_SUFFIX=log
CONF_CORES=16
CONF_MEMORY=64000
CONF_SPAN_NODES=false

[ENV_SETUP]
source "$HOME/apprepo/gaussian/16/env.sh"

[RUN_CMD_TEMPLATE]
g16 "${ACTUAL_INPUT_FILE}" > "${ACTUAL_OUTPUT_FILE}"
```

主要字段如下：

| 字段 | 作用 |
|---|---|
| `SUFFIX` | 扫描目录时寻找的输入后缀；默认是 `inp` |
| `OUTPUT_SUFFIX` | 用于判断预期输出是否存在；默认是 `log` |
| `CONF_CORES` | 输入和命令行都没有指定时使用的默认核心数 |
| `CONF_MEMORY` | 默认总内存，单位 MB |
| `CONF_SPAN_NODES` | 程序是否允许跨节点；默认按单节点程序处理 |
| `ENV_SETUP` | 主命令前执行的环境初始化 |
| `RUN_CMD_TEMPLATE` | 真正运行程序的命令 |
| `RAW_MODE` | 为 `true` 时按目录建立任务，不按单个输入文件建立任务 |
| `ARRAY` | 调度后端支持时使用的 array 大小 |

常用占位符：

| 占位符 | 内容 |
|---|---|
| `${ACTUAL_INPUT_FILE}` | 实际输入路径或文件名 |
| `${ACTUAL_OUTPUT_FILE}` | 实际输出路径或文件名 |
| `${ACTUAL_INPUT_FILENAME}` | 输入文件名 |
| `${ACTUAL_OUTPUT_FILENAME}` | 输出文件名 |
| `${ACTUAL_INPUT_STEM}` | 不含后缀的输入文件名 |
| `${WORKDIR}` | 任务工作目录 |
| `${CORES}` | 该任务最终取得的核心数 |
| `${EXTRA_ARGS}` / `${ARGS}` | `--extra-args` 传入的附加参数 |
| `${TYPE}` | task type 名称 |

`TYPE.conf` 的查找顺序是：

1. `--config-dir DIR`
2. `BTRUN_TASK_CONFIG_DIR`
3. `BANETASK_ENVCONF_PATH`
4. `./envs`
5. `./conf/envs`
6. 安装目录中的 `envs`
7. `~/.bane/task/envs`

日常个人配置通常放在：

```text
~/.bane/task/envs/
```

查看已有类型、类型说明和配置格式：

```bash
btrun task --list-types
btrun task --help-type g16
btrun help conf
```

### 脚本执行

对每个输入，`task` 生成的脚本按下面的顺序组成：

1. 导出 `FILE_NAME`、`BASENAME`、`CORES`、输入和输出路径；
2. 执行 `<type>.conf` 中的 `ENV_SETUP`；
3. 执行工作目录中的 `pre_comd`，如果该文件存在；
4. 执行展开占位符后的 `RUN_CMD_TEMPLATE`；
5. 执行工作目录中的 `comd`，如果该文件存在；
6. 使用 `--post-var NAME` 时，追加配置中的 `[NAME]` 段。

例如：

```bash
btrun task -t g16 water.gjf --post-var POST_PROCESS
```

会在主命令后追加 `g16.conf` 中的 `[POST_PROCESS]` 内容。

## 输入解析

显式给出一个或多个文件：

```bash
btrun task -S -t g16 water.gjf
btrun task -S -t orca mol1.inp mol2.inp mol3.inp
```

显式文件会直接作为任务输入，不要求其后缀与 `SUFFIX` 相同。

给出目录时，`task` 按 `SUFFIX` 扫描其中的文件：

```bash
btrun task -S -t g16 ./inputs
```

默认只扫描目录第一层。递归扫描使用：

```bash
btrun task -S -t g16 --path ./inputs --recursive
```

扫描时会忽略名为 `template` 的输入模板，并跳过 `btrun` 的调试目录。

### 类型判定

没有显式写 `-t` 时，task type 按以下顺序确定：

1. `-t` 或 `--type`；
2. 当前目录 `task.manifest.json` 中的 `program_params.prog`；
3. manifest 中的 `program_type`；
4. `gaussian`。

`task.manifest.json` 是可选的。它可以指定输入文件、输出文件、程序类型、程序参数和资源。没有 manifest 时，`task` 直接使用输入文件与 `<type>.conf`。

### 跳过判定

普通文件模式下，预期输出由输入文件名和 `OUTPUT_SUFFIX` 组成。例如：

```text
water.gjf -> water.log
mol.inp   -> mol.out
```

只要预期输出已经存在，该输入默认不再提交。重新计算时使用：

```bash
btrun task -S -t g16 water.gjf --force
```

manifest 指定了 `output_file_name` 时，以 manifest 中的路径判断是否已有输出。

### RAW MODE

`RAW_MODE=true` 时，task 不为目录里的每个输入分别建立任务，而是把整个目录作为一个任务。此时运行逻辑通常完全写在 `RUN_CMD_TEMPLATE`、`pre_comd` 或 `comd` 中，适合运行命令并不绑定单个输入文件的情况，例如使用`make`进行编译。

临时切换：

```bash
btrun task --raw-mode -t custom ./case
btrun task --file-mode -t custom ./case
```

## 资源解析

核心数、内存和 GPU 按优先级逐层确定。前面的来源覆盖后面的来源：

1. 命令行参数；
2. `task.manifest.json` 中的程序参数（通常由banetask产生）；
3. Gaussian 或 ORCA 输入文件中的资源字段；
4. `<type>.conf` 中的 `CONF_CORES` 和 `CONF_MEMORY`；
5. profile 或 `banetask.conf` 中的默认值。

命令行覆盖：

```bash
btrun task -S -t g16 water.gjf --task-cores 48 --memory 160000
```

Gaussian 输入会读取：

```text
%nprocshared
%nproc
%cpu
%mem
```

ORCA 输入会读取：

```text
%pal ... nprocs
! PALN
%maxcore
```

ORCA 的 `%maxcore` 是每个进程的内存。`btrun` 会用 `%maxcore × nprocs` 得到任务总内存，再用总内存匹配 queue。

### 核心参数

local 模式需要两个不同的核心数：

- runner 总共可以调度多少核心；
- 每个任务需要多少核心。

`--cores` 或 `-c` 表示 local runner 的总核心数。`--task-cores` 或 `-n` 表示单个任务核心数。

在 `btrun task` 中，如果没有写 `-n`，`-c` 也会被当作单任务核心数。因此，多任务并发时应同时写清楚：

```bash
btrun task -L -t g16 --path ./cases -a -c 64 -n 16
```

这条命令表示 runner 总容量为 64 核，每个输入使用 16 核，最多可以同时运行四个这类任务。

只写：

```bash
btrun task -L -t g16 --path ./cases -a -c 64
```

则每个任务也会请求 64 核，通常一次只能运行一个。

## 队列模型

### 调度器队列

调度器 queue 是 profile 中定义的执行分区。它有两层名称：

- `name`：`btrun` 的逻辑名称，例如 `cpu`；
- `scheduler_queue_name`：调度器真实名称，例如 Slurm 的 `qdhcnormal`。

一个 queue 还记录：

- 最大节点数；
- 单节点最大核心数；
- 单节点最大内存；
- 单节点 GPU 数和可接受的 GPU 类型；
- 默认核心数和内存；
- queue 优先级；
- 生成提交脚本时使用的 header lines。

`-q` 是 queue 约束。指定后，`btrun` 只使用匹配该名称、别名或原生名称的 queue，并检查该 queue 是否容得下任务：

```bash
btrun task -S -P cluster-a -q cpu -t g16 water.gjf
```

没有 `-q` 时，选择顺序是：

1. 按 `routes/<profile>.yaml` 中第一条匹配的规则选择候选 queue；
2. 尝试 profile 或 catalog 的默认 queue；
3. 按 queue 优先级寻找第一个能满足资源请求的 queue。

例如 GPU 任务可路由到 GPU queue，高内存任务可路由到大内存 queue，其余任务落到普通 CPU queue。queue 名称不必叫 `normal`、`highmem` 或 `gpu`，路由依据是配置中的实际资源能力。

### 执行目标

后端选项首先限制执行目标：

```bash
-L, --local
-S, --slurm
-E, --sge
-B, --pbs
-P, --profile NAME
```

`--backend auto` 会发现：

- local runner；
- 当前机器上可用的原生 Slurm、SGE 或 PBS；
- 已配置的远程 profile。

远程 profile 默认不会被无条件自动选中，除非显式指定 profile、backend、`--profiles`，或使用 `--auto-target`。

目标选择完成后，才在该目标的 queue catalog 中匹配 queue。使用下面的命令可以看到每个目标为何被接受或拒绝：

```bash
btrun task -t g16 water.gjf --dry-run --explain
```

## 调度器提交

以 Slurm 为例：

```bash
btrun task -S -P cluster-a -t g16 water.gjf
```

`task` 会完成以下步骤：

1. 根据输入和配置建立任务描述；
2. 在 `cluster-a` 的 queue catalog 中选择 queue；
3. 用 scheduler 配置和 queue 的 `header_lines` 生成 Slurm 脚本；
4. 在脚本中进入输入文件所在目录，执行环境初始化和程序命令；
5. 调用 profile 的 `submit_cmd`，通常是 `sbatch`；
6. 从提交输出中提取原生 job ID。

SGE 和 PBS 使用相同流程，只是 scheduler 配置中的提交命令、脚本头和状态映射不同。

`--dry-run` 会完成目标和 queue 选择，但不提交。调度器目标下会保留生成的脚本，便于检查：

```bash
btrun task -S -P cluster-a -t g16 water.gjf --dry-run --explain
```

提交后查询和取消使用调度器原生 job ID：

```bash
btrun status slurm 123456 -P cluster-a
btrun cancel slurm 123456 -P cluster-a
```

## 本地队列

local backend 不调用 `sbatch` 或 `qsub`。它把任务写入磁盘队列，再由一个 runner 根据本机资源启动进程。

最常见的命令是：

```bash
btrun task -L -t g16 --path ./cases -a -c 64 -n 16
```

### 任务入队

每个输入会得到一个 job ID。队列根目录默认是：

```text
~/.bane/taskq/
```

可以临时改成项目内目录：

```bash
BTRUN_QUEUE_DIR=$PWD/.btrun_queue \
  btrun task -L -t g16 --path ./cases -a -c 64 -n 16
```

入队时会在 `pending/` 中写入两类文件：

- 任务脚本和资源头；
- JSON 元数据，包括工作目录、任务名、核心数、内存、GPU、入队时间和状态。

目录结构如下：

```text
~/.bane/taskq/
├── pending/
├── running/
├── done/
├── failed/
├── cancelled/
├── logs/
└── lock/
```

### 运行器启动

`btrun task -L` 入队后会自动调用 queue runner。

默认是前台运行：当前命令会继续调度任务、等待任务结束，直到 `pending` 和 `running` 都为空后退出。因此 local 模式下，命令返回通常表示这批本地任务已经结束，而不是只表示完成入队。

后台运行使用：

```bash
btrun task -L -t g16 --path ./cases -a \
  -c 64 -n 16 --detach
```

父进程会立即返回，后台 runner 的输出写入：

```text
~/.bane/taskq/logs/btrun.queue-runner.log
```

同一队列同一时间只允许一个 runner 持有调度锁。再次启动 runner 时，如果已经有实例在工作，新实例会退出，避免两个进程同时移动和启动同一任务。

### 本地资源分配

runner 读取 local profile、命令行和运行环境，得到可用核心数与 GPU ID。

每轮调度会：

1. 回收已经结束的 `running` 任务；
2. 遍历 `pending`；
3. 计算当前正在使用的核心数和 GPU ID；
4. 启动能放入剩余 CPU/GPU 容量的任务；
5. 暂时放不下的任务继续留在 `pending`；
6. 按 `--poll` 指定的间隔继续检查，默认 5 秒。

local target 会先检查单个任务的内存请求是否超过机器的可用内存。runner 的并发分配目前按核心数和 GPU ID 扣减，不累计所有运行任务的内存请求。因此使用高内存程序时，应通过降低总核心数、增大单任务核心数，或分批提交来控制并发量。

### 任务启动

任务从 `pending` 移到 `running` 后，runner 会：

1. 进入任务工作目录；
2. 创建实际执行 payload 和 wrapper；
3. 导出 `CORES`、`BTRUN_JOBID` 及 GPU 可见性变量；
4. 如果工作目录存在 `.env`，读取其中的用户环境，并用本次资源分配覆盖旧的运行时变量；
5. 使用配置的 runner 启动任务，默认是 Bash；
6. 把标准输出和标准错误分别写入工作目录。

日志文件名包含任务名和 job ID：

```text
water.<jobid>.out
water.<jobid>.err
```

分配 GPU 时会同时设置：

```text
BTRUN_GPU_IDS
BANETASK_GPU_IDS
CUDA_VISIBLE_DEVICES
ROCR_VISIBLE_DEVICES
```

### 状态迁移

wrapper 结束后会写入退出码。runner 同时确认进程已经退出，避免把过早出现的退出码文件误判为任务完成。

状态迁移为：

```text
pending -> running -> done
                   -> failed
pending/running    -> cancelled
```

退出码为 0 时进入 `done`，非 0 时进入 `failed`。失败任务可以生成调试包，保存队列记录、wrapper、payload、标准输出、标准错误和相关元数据。

普通 `btrun queue run` 会一直调度，直到队列清空：

```bash
btrun queue run -c 64 --poll 5
```

`--once` 只进行一轮 pending 分派，然后等待这一轮已经启动的任务结束；第一轮没有放入资源的 pending 任务会留在队列中：

```bash
btrun queue run --once
```

## 任务管理

查看各状态数量：

```bash
btrun queue status
```

输出类似：

```text
pending=2 running=4 done=18 failed=1 cancelled=0
```

列出任务：

```bash
btrun queue list
btrun queue list --state running
btrun queue list --state failed -o wide
btrun queue list --json
```

查询单个 local job：

```bash
btrun status local <jobid>
```

取消 pending 或 running 任务：

```bash
btrun queue cancel <jobid>
btrun queue cancel <jobid-prefix>
btrun queue cancel all
```

强制终止运行中的进程树：

```bash
btrun queue kill <jobid>
btrun cancel local <jobid> --force
```

local 任务的排查顺序通常是：

1. `btrun queue list -o wide` 查看状态、工作目录和日志路径；
2. 打开工作目录中的 `<name>.<jobid>.out` 和 `.err`；
3. 检查 `<type>.conf` 中的 `ENV_SETUP` 与 `RUN_CMD_TEMPLATE`；
4. 检查 local profile 的可用核心数、GPU ID 和预留资源；
5. 失败任务启用了 debug bundle 时，查看工作目录下的调试包。

## 使用示例

### Slurm 提交

先初始化集群配置：

```bash
btrun init -P cluster-a -S
```

根据集群实际情况检查：

```text
~/.bane/task/btrun/profiles/cluster-a.yaml
~/.bane/task/btrun/queues/cluster-a.yaml
~/.bane/task/btrun/routes/cluster-a.yaml
```

准备 `~/.bane/task/envs/orca.conf`：

```conf
[main]
DESCRIPTION=ORCA 6
SUFFIX=inp
OUTPUT_SUFFIX=out
CONF_CORES=16
CONF_MEMORY=64000
CONF_SPAN_NODES=false

[ENV_SETUP]
source "$HOME/apprepo/orca/6.0.1/scripts/env.sh"

[RUN_CMD_TEMPLATE]
"$ORCA_ROOT/orca" "${ACTUAL_INPUT_FILE}" > "${ACTUAL_OUTPUT_FILE}"
```

先检查目标、queue 和生成脚本：

```bash
btrun task -S -P cluster-a -t orca mol.inp --dry-run --explain
```

确认后提交：

```bash
btrun task -S -P cluster-a -t orca mol.inp
```

### 本地并发

建立 local 配置：

```bash
btrun init --yes \
  -P local -L \
  --local-target enable \
  --local-cores 64 \
  --local-memory 256G
```

准备好 `g16.conf` 后，在 64 核总容量中每个任务分配 16 核：

```bash
btrun task -L -t g16 --path ./cases -a -c 64 -n 16
```

前台查看任务输出：

```bash
btrun task -L -t g16 --path ./cases -a \
  -c 64 -n 16 --follow
```

后台运行：

```bash
btrun task -L -t g16 --path ./cases -a \
  -c 64 -n 16 --detach
```

随后查看队列：

```bash
btrun queue status
btrun queue list -o wide
```

`btrun task` 的完整职责可以归纳为三层：从输入和 type 配置建立任务，从 profile 与 queue 配置选择运行位置，再由调度器或 local runner 执行并记录状态。程序启动方式、集群资源规则和每次计算输入分别维护，提交时不再复制一份新的 `sbatch` 或 `qsub` 脚本。

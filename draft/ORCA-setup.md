## openMPI 4.1.6

[下载地址](https://download.open-mpi.org/release/open-mpi/v4.1/openmpi-4.1.6.tar.bz2)
解压：
```
tar -xf openmpi-4.1.6.tar.bz2
```
没输出是正常的。进入目录运行：
```
./configure --prefix=$HOME/apprepo/MPI-4.1.6 --disable-builtin-atomics
```
或
```
nohup ./configure --prefix=$HOME/apprepo/MPI-4.1.6 --disable-builtin-atomics 2>&1 > configure.log 2>&1 &
```
这一步需要6分钟左右
```
make all install -j
```
或
```
nohup make all install -j > make_install.log 2>&1 &
```
这一步需要20分钟左右。

一键安装：
```
#!/bin/bash

# 设置日志文件路径
LOG_FILE="$HOME/mpi_install_$(date +%Y%m%d_%H%M%S).log"

# 创建screen会话并在其中运行命令
screen -dmS mpi_install bash -c '
    # 重定向所有输出到日志文件
    LOG_FILE="'"$LOG_FILE"'"
    exec 1>>"$LOG_FILE"
    exec 2>&1
    
    # 错误处理函数
    handle_error() {
        echo "[ERROR] $(date "+%Y-%m-%d %H:%M:%S") - $1"
        exit 1
    }

    # 记录开始时间的函数
    log_start() {
        echo "[INFO] $(date "+%Y-%m-%d %H:%M:%S") - Starting $1"
        TIMEFORMAT="%3R"
    }

    # 记录完成时间的函数
    log_end() {
        echo "[INFO] $(date "+%Y-%m-%d %H:%M:%S") - Completed $1"
    }
    
    echo "[INFO] Starting MPI installation process at $(date)"
    
    # 解压步骤
    log_start "Extraction"
    if ! { time tar -xf openmpi-4.1.6.tar.bz2; }; then
        handle_error "Failed to extract archive"
    fi
    log_end "Extraction"
    
    # 进入目录
    cd openmpi-4.1.6 || handle_error "Failed to enter directory"
    
    # 配置步骤
    log_start "Configure"
    if ! { time ./configure --prefix=$HOME/apprepo/MPI-4.1.6 --disable-builtin-atomics; }; then
        handle_error "Configure failed"
    fi
    log_end "Configure"
    
    # 编译和安装步骤
    log_start "Make and Install"
    if ! { time make all install -j; }; then
        handle_error "Make/Install failed"
    fi
    log_end "Make and Install"
    
    echo "[SUCCESS] MPI installation completed successfully at $(date)"
'

echo "Installation process started in background."
echo "You can monitor the progress in $LOG_FILE"
echo "To attach to the installation screen session, use: screen -r mpi_install"
```
环境变量：
```
export PATH=$PATH:$HOME/apprepo/MPI-4.1.6/bin
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$HOME/apprepo/MPI-4.1.6/lib
```

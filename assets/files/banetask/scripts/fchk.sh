#!/bin/bash

# 初始化路径变量
DIR="."
# 初始化模式变量
MODE=""
# 初始化ONIOM参数变量
ONIOM_OPTIONS=""

# 定义可能的 Gaussian 路径数组
POSSIBLE_PATHS=(
  "/apps/g16"
  "$HOME/apprepo/gaussian/16-hy/app/g16"
  "${GAUSSIAN_PATH}"  # 如果环境变量存在，也包含在搜索中
)

# 搜索可用的 formchk 路径
find_formchk() {
  for path in "${POSSIBLE_PATHS[@]}"; do
    # 跳过空路径
    if [[ -n "$path" && -x "$path/formchk" ]]; then
      echo "$path"
      return 0
    fi
  done
  return 1
}

# 查找 formchk
GAUSSIAN_PATH=$(find_formchk)
if [[ -z "$GAUSSIAN_PATH" ]]; then
  echo "错误: 在以下路径中未找到可执行的 formchk:"
  for path in "${POSSIBLE_PATHS[@]}"; do
    [[ -n "$path" ]] && echo "  $path/formchk"
  done
  echo ""
  echo "请确保:"
  echo "1. Gaussian 已正确安装"
  echo "2. formchk 文件存在且具有执行权限"
  echo "3. 或者设置 GAUSSIAN_PATH 环境变量指向正确的路径"
  exit 1
fi

echo "使用 Gaussian 路径: $GAUSSIAN_PATH"

# 打印帮助信息
print_help() {
  echo "用法: ./script.sh [选项]"
  echo ""
  echo "选项:"
  echo "  -all                  递归遍历目录及其子目录，处理 .chk 文件"
  echo "  -r <路径>             指定要遍历的目录，默认为当前目录"
  echo "  -o <ONIOM选项>        为 formchk 命令提供额外的 ONIOM 参数，例如 -MS"
  echo "  -h                    显示帮助信息"
  echo ""
  echo "自动搜索的 Gaussian 路径:"
  for path in "${POSSIBLE_PATHS[@]}"; do
    [[ -n "$path" ]] && echo "  $path"
  done
}

# 解析输入参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    -all)       # 如果模式为-all，表示递归遍历子目录
      MODE="all"
      shift
      ;;
    -r)         # 如果提供了路径参数
      if [[ -n "$2" && "$2" != -* ]]; then
        DIR="$2"
        shift 2
      else
        echo "Error: -r 选项需要一个路径参数"
        exit 1
      fi
      ;;
    -o)         # 如果提供了ONIOM参数
      if [[ -n "$2" ]]; then
        ONIOM_OPTIONS="$2"
        shift 2
      else
        echo "Error: -o 选项需要一个ONIOM参数"
        exit 1
      fi
      ;;
    -h)         # 打印帮助信息
      print_help
      exit 0
      ;;
    -u)
      MODE="unfchk"
      shift
      ;;
    *)          # 处理未知参数
      echo "未知选项: $1"
      print_help
      exit 1
      ;;
  esac
done

# 如果设置了-all，则递归遍历目录及子目录
if [ "$MODE" = "all" ]; then
  # 遍历目录及其子目录下的所有chk文件
  find "$DIR" -type f -name "*.chk" | while read -r file
  do
    # 执行formchk命令，包含ONIOM选项，指定输出文件名
    "$GAUSSIAN_PATH/formchk" $ONIOM_OPTIONS "$file" "${file%.chk}.fchk"
  done
elif [ "$MODE" = "unfchk" ]; then
  find "$DIR" -type f -name "*.fchk" | while read -r file
  do
    "$GAUSSIAN_PATH/unfchk" "$file" "${file%.fchk}.chk"
  done
else
  # 只遍历当前目录下的所有chk文件
  find "$DIR" -maxdepth 1 -type f -name "*.chk" | while read -r file
  do
    # 执行formchk命令，包含ONIOM选项，指定输出文件名
    "$GAUSSIAN_PATH/formchk" $ONIOM_OPTIONS "$file" "${file%.chk}.fchk"
  done
fi
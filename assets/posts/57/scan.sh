#!/bin/bash

# --- 参数设置区域 ---
R_eq=1.9385    # 起始键长
step=0.05      # 步长
n_points=35   # 总点数
base_name="Cl2"
list_file="scan_info.txt"  # 记录列表的文件名
# ------------------

# 1. 初始化列表文件，写入表头
# 使用 printf 保证表头对齐
printf "%-10s %-15s %-20s\n" "Point_ID" "Distance(A)" "Filename" > "$list_file"

for ((i=1; i<=n_points; i++))
do
    # 计算当前键长
    current_L=$(awk -v r="$R_eq" -v s="$step" -v i="$i" 'BEGIN {printf "%.4f", r + (i-1)*s}')
    
    # 生成文件名
    file_id=$(printf "%03d" $i)
    filename="${base_name}_${file_id}.gjf"

    # 生成输入文件
    cat > "$filename" <<EOF
%nproc=32
%mem=96GB
# NEVPT2(10,6)/cc-pvtz

mokit{Nstates=4,mixedspin}

0 1
Cl 0.0 0.0 0.0
Cl 0.0 0.0 $current_L

EOF

    # 2. 将信息追加到列表文件中
    # 这里的 %-10s 等是为了让文本列对齐，看起来更舒服
    printf "%-10s %-15s %-20s\n" "$file_id" "$current_L" "$filename" >> "$list_file"

    echo "已生成: $filename"
done

echo "----------------------------------------"
echo "所有文件已生成，键长列表已保存在: $list_file"
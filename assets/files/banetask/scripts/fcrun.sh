#!/bin/bash

#==============================================================================
# FCrun - FCclasses3 计算自动化脚本
# 版本: 2.0
# 功能: 自动生成FCclasses3输入文件并运行计算
#==============================================================================

#------------------------------------------------------------------------------
# 全局变量定义
#------------------------------------------------------------------------------
# 文件路径
td_state=""
opt_state=""
triplet_state=""

# 计算控制
run_calc=false

# ISC参数
energy_diff=""
soc_integral=""

# FCclasses3参数
method="TD"           # 积分方法: TD/TI
model="AH"            # 计算模型: AS/ASF/AH/VG/VGF/VH
dipole="FC"           # 偶极类型: FC/HTi/HTf
hwhm="0.01"           # 展宽宽度 (eV)
coords="BOTH"         # 坐标类型: INT/CART/BOTH

# NAC处理
use_bdf=false         # 是否使用BDF方法
bdf_nac="nacme_*.log" # BDF NAC文件

#------------------------------------------------------------------------------
# 帮助信息
#------------------------------------------------------------------------------
print_help() {
    cat << 'EOF'
FCrun - FCclasses3 计算自动化脚本 v2.0

用法: fcrun.sh [选项]

文件选项:
    -t <文件>         TD态fchk文件
    -o <文件>         优化态fchk文件  
    -p <文件>         三重态fchk文件 (ISC计算用)
    -b <文件>         BDF NAC文件 (默认: nacme_*.log)

计算控制:
    -r               运行计算 (默认只生成输入文件)
    -e <数值>         能量差 (eV, ISC用)
    -s <数值>         自旋轨道耦合积分 (cm-1, ISC用)

FCclasses3参数:
    -m, --method <方法>     积分方法: TD/TI (默认: TD)
    --model <模型>          计算模型: AS/ASF/AH/VG/VGF/VH (默认: AH)  
    --dipole <类型>         偶极类型: FC/HTi/HTf (默认: FC)
    --hwhm <数值>           展宽宽度 (eV, 默认: 0.01)
    --coords <坐标>         坐标类型: INT/CART/BOTH (默认: BOTH)
    --bdf <文件>            同-b选项

其他选项:
    -h, --help            显示帮助信息

模型说明:
    AS  - Adiabatic Shift
    ASF - Adiabatic Shift with Frequency
    AH  - Adiabatic Hessian (推荐)
    VG  - Vertical Gradient
    VGF - Vertical Gradient with Frequency
    VH  - Vertical Hessian

偶极类型说明:
    FC  - Franck-Condon (默认)
    HTi - Herzberg-Teller initial state
    HTf - Herzberg-Teller final state

文件搜索规则:
    如未指定文件，自动搜索当前目录:
    - TD态: 文件名包含'td'
    - 优化态: 文件名包含'opt'
    - 三重态: 文件名包含'triplet'或't1'

ISC参数来源:
    1. 命令行选项 (-e, -s)
    2. ISC.parameter文件

生成的计算目录:
    IC-INT/CART   - 内转换速率
    EMI-INT/CART  - 辐射跃迁速率  
    NR0-INT/CART  - 系间窜越速率 (有三重态且有ISC参数时)

坐标类型说明:
    INT  - 只计算内坐标
    CART - 只计算笛卡尔坐标
    BOTH - 同时计算两种坐标 (默认)

使用示例:
    # 基本用法 - 只生成输入文件
    fcrun.sh -t td.fchk -o opt.fchk
    
    # 运行计算，使用TI方法和VH模型
    fcrun.sh -t td.fchk -o opt.fchk -r --method TI --model VH
    
    # ISC计算，自定义所有参数
    fcrun.sh -t td.fchk -o opt.fchk -p t1.fchk -e 0.5 -s 0.2 -r \
             --model AS --dipole HTf --hwhm 0.02 --coords INT
    
    # 使用BDF NAC文件，只计算笛卡尔坐标
    fcrun.sh -t td.fchk -o opt.fchk --bdf nacme_s1s0.log --coords CART -r

EOF
}

#------------------------------------------------------------------------------
# 参数验证函数
#------------------------------------------------------------------------------
validate_parameters() {
    # 验证method
    if [[ "$method" != "TD" && "$method" != "TI" ]]; then
        echo "错误: 积分方法必须是 TD 或 TI，当前值: $method" >&2
        exit 1
    fi

    # 验证model
    local valid_models=("AS" "ASF" "AH" "VG" "VGF" "VH")
    if [[ ! " ${valid_models[@]} " =~ " ${model} " ]]; then
        echo "错误: 模型必须是 AS/ASF/AH/VG/VGF/VH 之一，当前值: $model" >&2
        exit 1
    fi

    # 验证dipole
    local valid_dipoles=("FC" "HTi" "HTf")
    if [[ ! " ${valid_dipoles[@]} " =~ " ${dipole} " ]]; then
        echo "错误: 偶极类型必须是 FC/HTi/HTf 之一，当前值: $dipole" >&2
        exit 1
    fi

    # 验证hwhm
    if ! [[ "$hwhm" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
        echo "错误: HWHM值必须是有效的数值，当前值: $hwhm" >&2
        exit 1
    fi

    # 验证coords参数
    local valid_coords=("INT" "CART" "BOTH")
    if [[ ! " ${valid_coords[@]} " =~ " ${coords} " ]]; then
        echo "错误: 坐标类型必须是 INT/CART/BOTH 之一，当前值: $coords" >&2
        exit 1
    fi
}

#------------------------------------------------------------------------------
# 文件搜索函数
#------------------------------------------------------------------------------
auto_search_files() {
    echo "正在自动搜索 fchk 文件..."
    
    # 搜索TD态文件
    if [[ -z "$td_state" ]]; then
        td_state=$(find . -maxdepth 1 -name "*.fchk" | grep -iE "(^[./]*td[-_]|[-_]td[-_]|^[./]*td\.)" | head -n 1)
    fi
    
    # 搜索优化态文件
    if [[ -z "$opt_state" ]]; then
        opt_state=$(find . -maxdepth 1 -name "*.fchk" | grep -iE "(^[./]*opt[-_]|[-_]opt[-_]|^[./]*opt\.)" | head -n 1)
    fi
    
    # 搜索三重态文件（可选）
    if [[ -z "$triplet_state" ]]; then
        triplet_state=$(find . -maxdepth 1 -name "*.fchk" | grep -iE "(^[./]*triplet[-_]|[-_]triplet[-_]|^[./]*t1[-_]|[-_]t1\.)" | head -n 1)
    fi
    
    # 检查必需文件
    if [[ -z "$td_state" || -z "$opt_state" ]]; then
        echo "错误: 无法找到TD或优化态fchk文件" >&2
        echo "请手动指定文件或确保文件名包含相应关键词" >&2
        exit 1
    fi
    
    echo "找到文件:"
    echo "  TD态: $td_state"
    echo "  优化态: $opt_state"
    [[ -n "$triplet_state" ]] && echo "  三重态: $triplet_state"
}

#------------------------------------------------------------------------------
# NAC文件处理函数
#------------------------------------------------------------------------------
process_nac_files() {
    local td_basename=$(basename "$td_state" .fchk)
    
    if [[ "$use_bdf" == true ]]; then
        echo "使用BDF方法生成NAC文件..."
        
        # 处理通配符
        if [[ "$bdf_nac" == *"*"* ]]; then
            local bdf_files=($(ls $bdf_nac 2>/dev/null))
            if [[ ${#bdf_files[@]} -eq 0 ]]; then
                echo "错误: 未找到匹配的BDF NAC文件: $bdf_nac" >&2
                exit 1
            elif [[ ${#bdf_files[@]} -gt 1 ]]; then
                echo "警告: 找到多个BDF NAC文件，使用第一个: ${bdf_files[0]}"
            fi
            bdf_nac="${bdf_files[0]}"
        fi
        
        # 检查文件存在
        if [[ ! -f "$bdf_nac" ]]; then
            echo "错误: BDF NAC文件不存在: $bdf_nac" >&2
            exit 1
        fi
        
        echo "使用BDF NAC文件: $bdf_nac"
        if ! bdf2fcc "$bdf_nac" "nac_${td_basename}_fchk"; then
            echo "错误: bdf2fcc命令执行失败" >&2
            exit 1
        fi
    else
        echo "使用默认方法生成NAC文件..."
        if ! gen_fcc_dipfile -i "$td_state" -nac; then
            echo "错误: gen_fcc_dipfile生成NAC失败" >&2
            exit 1
        fi
    fi
}

#------------------------------------------------------------------------------
# SOC值转换函数
#------------------------------------------------------------------------------
convert_soc_value() {
    local soc_value=$1
    if [[ "$soc_value" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
        # 从cm-1转换为原子单位
        echo "scale=12; $soc_value / 219474.6" | bc
    else
        echo "$soc_value"
    fi
}

#------------------------------------------------------------------------------
# 输入文件生成函数
#------------------------------------------------------------------------------
generate_input_file() {
    local dir=$1
    local coords=$2  
    local property=$3
    local filename="${property}_${coords}.inp"
    local td_basename=$(basename "$td_state" .fchk)
    local opt_basename=$(basename "$opt_state" .fchk)
    
    cat > "$dir/$filename" << EOF
\$\$\$
PROPERTY     =   $property  ; OPA/EMI/ECD/CPL/RR/TPA/MCD/IC/NR0
MODEL        =   $model   ; AS/ASF/AH/VG/VGF/VH
DIPOLE       =   $dipole   ; FC/HTi/HTf
TEMP         =   298.0 ; (temperature in K) 
BROADFUN     =   GAU  ; GAU/LOR/VOI
HWHM         =   $hwhm ; (broadening width in eV)
METHOD       =   $method   ; TI/TD
;VIBRATIONAL ANALYSIS 
NORMALMODES  =   COMPUTE   ; COMPUTE/READ/IMPLICIT
COORDS       =   $coords  ; CARTESIAN/INTERNAL
;INPUT DATA FILES 
STATE1_FILE  =   ../${td_basename}.fcc
STATE2_FILE  =   ../${opt_basename}.fcc
EOF

    # 添加特定属性的文件
    case "$property" in
        "EMI")
            echo "ELDIP_FILE   =   ../eldip_${td_basename}_fchk" >> "$dir/$filename"
            ;;
        "IC")
            echo "NAC_FILE     =   ../nac_${td_basename}_fchk" >> "$dir/$filename"
            ;;
        "NR0")
            local processed_soc=$(convert_soc_value "$soc_integral")
            echo "DE           =   $energy_diff  ; Energy difference in eV" >> "$dir/$filename"
            echo "NR0_COUPL    =   $processed_soc ; Spin-orbit coupling integral in a.u." >> "$dir/$filename"
            ;;
    esac
}

#------------------------------------------------------------------------------
# 主要处理函数
#------------------------------------------------------------------------------
setup_calculations() {
    echo "开始设置计算..."
    
    # 生成fcc文件
    local td_basename=$(basename "$td_state" .fchk)
    local opt_basename=$(basename "$opt_state" .fchk)
    
    echo "生成FCC状态文件..."
    gen_fcc_state -i "$opt_state" || { echo "错误: 生成优化态fcc文件失败" >&2; exit 1; }
    gen_fcc_state -i "$td_state" || { echo "错误: 生成TD态fcc文件失败" >&2; exit 1; }
    
    if [[ -n "$triplet_state" ]]; then
        gen_fcc_state -i "$triplet_state" || { echo "错误: 生成三重态fcc文件失败" >&2; exit 1; }
    fi
    
    # 生成dipole文件
    echo "生成偶极文件..."
    gen_fcc_dipfile -i "$td_state" || { echo "错误: 生成偶极文件失败" >&2; exit 1; }
    
    # 处理NAC文件
    process_nac_files
    
    # 创建计算目录
    local directories=()
    
    # 根据coords参数决定创建哪些目录
    case "$coords" in
        "INT")
            directories=("IC-INT" "EMI-INT")
            ;;
        "CART")
            directories=("IC-CART" "EMI-CART")
            ;;
        "BOTH")
            directories=("IC-INT" "IC-CART" "EMI-INT" "EMI-CART")
            ;;
    esac
    
    # 如果有三重态且有ISC参数，添加NR0目录
    if [[ -n "$triplet_state" && -n "$energy_diff" && -n "$soc_integral" ]]; then
        case "$coords" in
            "INT")
                directories+=("NR0-INT")
                ;;
            "CART")
                directories+=("NR0-CART")
                ;;
            "BOTH")
                directories+=("NR0-INT" "NR0-CART")
                ;;
        esac
    fi
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
    done
    
    # 生成输入文件
    echo "生成输入文件..."
    
    # 根据coords参数生成相应的输入文件
    case "$coords" in
        "INT")
            generate_input_file "IC-INT" "INTERNAL" "IC"
            generate_input_file "EMI-INT" "INTERNAL" "EMI"
            ;;
        "CART")
            generate_input_file "IC-CART" "CARTESIAN" "IC"
            generate_input_file "EMI-CART" "CARTESIAN" "EMI"
            ;;
        "BOTH")
            generate_input_file "IC-INT" "INTERNAL" "IC"
            generate_input_file "IC-CART" "CARTESIAN" "IC"
            generate_input_file "EMI-INT" "INTERNAL" "EMI"
            generate_input_file "EMI-CART" "CARTESIAN" "EMI"
            ;;
    esac
    
    # NR0计算 - 只有在有三重态且有必要参数时才生成
    if [[ -n "$triplet_state" && -n "$energy_diff" && -n "$soc_integral" ]]; then
        case "$coords" in
            "INT")
                generate_input_file "NR0-INT" "INTERNAL" "NR0"
                ;;
            "CART")
                generate_input_file "NR0-CART" "CARTESIAN" "NR0"
                ;;
            "BOTH")
                generate_input_file "NR0-INT" "INTERNAL" "NR0"
                generate_input_file "NR0-CART" "CARTESIAN" "NR0"
                ;;
        esac
    elif [[ -n "$triplet_state" ]]; then
        echo "提示: 检测到三重态文件，但缺少ISC参数，跳过NR0计算"
        echo "      如需ISC计算，请提供 -e (能量差) 和 -s (SOC积分) 参数"
    fi
    
    echo "设置完成！"
    echo "参数汇总:"
    echo "  方法: $method, 模型: $model, 偶极: $dipole, HWHM: $hwhm, 坐标: $coords"
    [[ "$use_bdf" == true ]] && echo "  NAC方法: BDF ($bdf_nac)"
}

run_calculations() {
    echo "开始运行计算..."
    
    find . -type f -name "*.inp" | while read -r inp_file; do
        echo "运行计算: $inp_file"
        (
            cd "$(dirname "$inp_file")" || exit 1
            if ! fcclasses3 "$(basename "$inp_file")"; then
                echo "计算失败: $inp_file" >&2
                exit 1
            fi
        ) || continue
    done
    
    echo "所有计算完成！"
    
    # 提取结果
    if [[ -x "$HOME/scripts/fcrate.sh" ]]; then
        echo "提取结果..."
        "$HOME/scripts/fcrate.sh"
        echo "全部完成！"
    else
        echo "注意: 未找到结果提取脚本 $HOME/scripts/fcrate.sh"
    fi
}

#------------------------------------------------------------------------------
# 命令行参数处理
#------------------------------------------------------------------------------
parse_arguments() {
    # 预处理长选项
    local args=()
    while [[ $# -gt 0 ]]; do
        case $1 in
            --method)
                [[ -z "$2" ]] && { echo "错误: --method 需要参数" >&2; exit 1; }
                method="$2"; shift 2 ;;
            --model)
                [[ -z "$2" ]] && { echo "错误: --model 需要参数" >&2; exit 1; }
                model="$2"; shift 2 ;;
            --dipole)
                [[ -z "$2" ]] && { echo "错误: --dipole 需要参数" >&2; exit 1; }
                dipole="$2"; shift 2 ;;
            --hwhm)
                [[ -z "$2" ]] && { echo "错误: --hwhm 需要参数" >&2; exit 1; }
                hwhm="$2"; shift 2 ;;
            --coords)
                [[ -z "$2" ]] && { echo "错误: --coords 需要参数" >&2; exit 1; }
                coords="$2"; shift 2 ;;
            --bdf)
                [[ -z "$2" ]] && { echo "错误: --bdf 需要参数" >&2; exit 1; }
                use_bdf=true; bdf_nac="$2"; shift 2 ;;
            --help)
                print_help; exit 0 ;;
            --*)
                echo "未知选项: $1" >&2; exit 1 ;;
            *)
                args+=("$1"); shift ;;
        esac
    done
    
    set -- "${args[@]}"
    
    # 处理短选项
    while getopts "t:o:p:re:s:m:b:h" opt; do
        case $opt in
            t) td_state="$OPTARG" ;;
            o) opt_state="$OPTARG" ;;
            p) triplet_state="$OPTARG" ;;
            r) run_calc=true ;;
            e) energy_diff="$OPTARG" ;;
            s) soc_integral="$OPTARG" ;;
            m) method="$OPTARG" ;;
            b) use_bdf=true; bdf_nac="$OPTARG" ;;
            h) print_help; exit 0 ;;
            \?) echo "无效选项: -$OPTARG" >&2; exit 1 ;;
            :) echo "选项 -$OPTARG 需要参数" >&2; exit 1 ;;
        esac
    done
}

#------------------------------------------------------------------------------
# 主函数
#------------------------------------------------------------------------------
main() {
    # 解析命令行参数
    parse_arguments "$@"
    
    # 验证参数
    validate_parameters
    
    # 尝试从ISC.parameter文件读取参数
    if [[ -f "ISC.parameter" ]] && { [[ -z "$energy_diff" ]] || [[ -z "$soc_integral" ]]; }; then
        echo "从 ISC.parameter 读取参数..."
        source ISC.parameter
    fi
    
    # 自动搜索文件（如果未指定）
    if [[ -z "$td_state" || -z "$opt_state" ]]; then
        auto_search_files
    fi
    
    # 设置计算
    setup_calculations
    
    # 运行计算（如果指定）
    if [[ "$run_calc" == true ]]; then
        run_calculations
    fi
}

#------------------------------------------------------------------------------
# 脚本入口
#------------------------------------------------------------------------------
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
import pandas as pd
import matplotlib.pyplot as plt
import re
import os

# --- 配置参数 ---
scan_info_file = 'scan_info.txt'
hartree_to_ev = 27.211386
# ----------------

def parse_log_file(filepath):
    """
    解析单个log文件，返回一个字典:
    { state_id: {'energy': float, 'spin_type': 'S' or 'T'} }
    """
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. 提取 CASCI 部分的 <S**2>
    # 格式: State   1, E = ... <S**2> = 2.000
    # 我们先截取 "CASCI energies" 到 "NEVPT2 energies" 之间的文本，防止混淆
    try:
        casci_block = content.split('CASCI energies')[1].split('NEVPT2 energies')[0]
        nevpt2_block = content.split('NEVPT2 energies')[1]
    except IndexError:
        print(f"警告: 文件 {filepath} 格式似乎不完整，跳过。")
        return {}

    state_spins = {}
    # 正则匹配 State ID 和 S**2
    # 匹配模式: State + 空格 + 数字 + ... <S**2> = + 数字
    pattern_spin = re.compile(r'State\s+(\d+),.*?<S\*\*2>\s*=\s*(\d+\.\d+)')
    
    for match in pattern_spin.finditer(casci_block):
        state_id = int(match.group(1))
        s2_val = float(match.group(2))
        # 判断自旋: S^2 < 1.0 为 Singlet, 否则为 Triplet (这里简单粗暴区分S/T)
        spin_type = 'S' if s2_val < 1.0 else 'T'
        state_spins[state_id] = spin_type

    # 2. 提取 NEVPT2 能量
    # 格式: State   0, E =   -919.42304167 a.u.
    state_energies = {}
    pattern_energy = re.compile(r'State\s+(\d+),\s+E\s*=\s*(-?\d+\.\d+)')

    for match in pattern_energy.finditer(nevpt2_block):
        state_id = int(match.group(1))
        energy = float(match.group(2))
        
        # 将能量和之前解析的自旋对应起来
        if state_id in state_spins:
            state_energies[state_id] = {
                'energy': energy,
                'spin': state_spins[state_id]
            }

    return state_energies

def main():
    # 1. 读取 scan_info.txt
    if not os.path.exists(scan_info_file):
        print(f"错误: 找不到 {scan_info_file}")
        return

    # 跳过第一行表头读取
    points = []
    with open(scan_info_file, 'r') as f:
        lines = f.readlines()[1:] # Skip header
        for line in lines:
            parts = line.split()
            if len(parts) >= 3:
                pt_id = parts[0]
                dist = float(parts[1])
                # 把 .gjf 换成 .log
                log_name = parts[2].replace('.gjf', '.log')
                points.append({'id': pt_id, 'dist': dist, 'file': log_name})

    # 2. 收集数据
    all_data = []
    ref_energy = None # 参考能量 (S0 at Point 1)

    print(f"正在处理 {len(points)} 个数据点...")

    for pt in points:
        if not os.path.exists(pt['file']):
            print(f"警告: 找不到日志文件 {pt['file']}")
            continue

        states_data = parse_log_file(pt['file'])
        
        # 如果是第一个点 (通常ID是001)，获取 State 0 的能量作为参考
        if pt['id'] == '001' and 0 in states_data:
            ref_energy = states_data[0]['energy']
            print(f"参考点 (Point 001, State 0) 绝对能量: {ref_energy:.8f} a.u.")

        for state_id, info in states_data.items():
            all_data.append({
                'Distance': pt['dist'],
                'State_ID': state_id,
                'Abs_Energy': info['energy'],
                'Spin': info['spin']
            })

    if ref_energy is None:
        print("错误: 无法确定参考能量（未找到 Point 001 的 State 0）")
        return

    # 3. 创建 DataFrame 并计算相对能量
    df = pd.DataFrame(all_data)
    df['Rel_Energy_eV'] = (df['Abs_Energy'] - ref_energy) * hartree_to_ev

    # 4. 绘图
    plt.figure(figsize=(8, 6))

    # 获取所有唯一的 State ID 并排序
    state_ids = sorted(df['State_ID'].unique())

    # 定义颜色或线型策略
    # 这里我们简单一点：每个 State ID 连成一条线
    # 用 实线代表 Singlet 主导，虚线代表 Triplet (虽然有些态可能会变性，但这样画图比较清晰)
    # 或者：统一画线，但在图例中标注
    
    for sid in state_ids:
        sub_df = df[df['State_ID'] == sid].sort_values('Distance')
        
        # 为了美观，判断一下这个态主要是 S 还是 T 来决定颜色/线型
        # 统计该态大部分点是什么自旋
        mode_spin = sub_df['Spin'].mode()[0] 
        
        label = f"State {sid} ({mode_spin})"
        linestyle = '-' if mode_spin == 'S' else '--'
        marker = 'o' if mode_spin == 'S' else 'x'
        
        plt.plot(sub_df['Distance'], sub_df['Rel_Energy_eV'], 
                 label=label, 
                 linestyle=linestyle, 
                 marker=marker, 
                 markersize=4,
                 linewidth=1.5)

    plt.title('NEVPT2 Potential Energy Surface (Cl-Cl)')
    plt.xlabel('Bond Length ($\AA$)')
    plt.ylabel('Relative Energy (eV)')
    plt.axhline(0, color='gray', linestyle=':', linewidth=0.5) # 0 eV 参考线
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    output_img = 'PES_scan.png'
    plt.savefig(output_img, dpi=300)
    print(f"绘图完成！图片已保存为: {output_img}")
    # plt.show() # 如果在桌面环境运行可以取消注释

if __name__ == "__main__":
    main()
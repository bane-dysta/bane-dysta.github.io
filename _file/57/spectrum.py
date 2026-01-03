import glob
import re
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import norm

# ================= 配置区域 =================

SIGMA_EV = 0.1   # 能量图展宽 (eV)
SIGMA_NM = 10    # 波长图展宽 (nm) ps: 实验光谱通常有 10-20 nm 的半峰宽
IGNORE_SUFFIXES = ['_CIS.log', '_rhf.log', '_uhf.log']

# 输出文件
CSV_FILENAME = 'spectrum_data.csv'
IMG_EV = 'spectrum_eV.png'
IMG_NM = 'spectrum_nm.png'
# ===========================================

print("Starting spectrum analysis...")

data_list = []
log_files = glob.glob('Cl2_point*.log')

print(f"Found {len(log_files)} log files. Processing...")

count_ignored = 0
for log_file in log_files:
    # 跳过MOKIT的临时文件
    if any(suffix in log_file for suffix in IGNORE_SUFFIXES):
        count_ignored += 1
        continue

    # 2. 提取 Point ID
    point_match = re.search(r'point(\d+)\.log', log_file)
    if not point_match:
        continue
    point_id = int(point_match.group(1))

    # 3. 抓取数据
    try:
        with open(log_file, 'r') as f:
            # 找到所有包含 "State   1" 的行
            state1_lines = [line.strip() for line in f if "State   1" in line]

        if len(state1_lines) < 3:
             continue

        # 提取数据
        # 倒数第2行 -> CASCI fosc (带 <S**2>)
        fosc_str = state1_lines[-2].split()[-1]
        # 倒数第1行 -> NEVPT2 Energy (不带 <S**2>)
        energy_str = state1_lines[-1].split()[-1]
        
        fosc = float(fosc_str)
        energy_ev = float(energy_str)
        
        # 计算波长 (nm) = 1239.84 / eV
        wavelength_nm = 1239.84193 / energy_ev if energy_ev > 1e-6 else 0.0

        data_list.append({
            'Point': point_id,
            'Energy_eV': energy_ev,
            'Wavelength_nm': wavelength_nm,
            'fosc': fosc,
            'Filename': log_file
        })

    except Exception as e:
        print(f"Error processing {log_file}: {e}")
        continue

print(f"Skipped {count_ignored} temporary files (_CIS/_rhf/_uhf).")

# 转换为 DataFrame
df = pd.DataFrame(data_list)
if df.empty:
    print("Error: No valid data extracted.")
    exit()

df = df.sort_values('Point')
df.to_csv(CSV_FILENAME, index=False)
print(f"Data saved to {CSV_FILENAME}")

# ================== 通用绘图函数 ==================
def plot_spectrum(x_data, y_fosc, sigma, xlabel, filename, x_range_pad=1.0, color='blue'):
    """
    x_data: 能量或波长的数组
    y_fosc: 振子强度数组
    sigma: 展宽参数 (与x_data单位一致)
    """
    # 生成平滑的 X 轴网格
    x_min, x_max = x_data.min(), x_data.max()
    # 稍微往两边扩一点，防止边缘截断
    grid_x = np.linspace(x_min - x_range_pad, x_max + x_range_pad, 2000)
    grid_y = np.zeros_like(grid_x)

    # 高斯叠加
    for val, f in zip(x_data, y_fosc):
        grid_y += f * norm.pdf(grid_x, loc=val, scale=sigma)

    plt.figure(figsize=(10, 6))
    
    # 画主光谱
    plt.plot(grid_x, grid_y, color=color, linewidth=2, label=f'Gaussian ($\sigma$={sigma})')
    plt.fill_between(grid_x, grid_y, color=color, alpha=0.2)
    
    # 画棒状图 (Stick Spectrum)
    # 高度缩放一下以便观看
    scale_factor = grid_y.max() / y_fosc.max() if y_fosc.max() > 0 else 1
    plt.vlines(x_data, 0, y_fosc * scale_factor * 0.2, colors='red', alpha=0.5, linewidth=1, label='Raw Transitions')

    plt.xlabel(xlabel, fontsize=14)
    plt.ylabel('Intensity (arb. units)', fontsize=14)
    plt.title(f'Absorption Spectrum ({len(x_data)} points)', fontsize=16)
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(filename, dpi=300)
    print(f"Saved plot: {filename}")
    plt.close() # 释放内存

# ================== 执行绘图 ==================

# 能量图 (eV)
plot_spectrum(
    df['Energy_eV'].values, 
    df['fosc'].values, 
    sigma=SIGMA_EV, 
    xlabel='Excitation Energy (eV)', 
    filename=IMG_EV,
    x_range_pad=1.0,
    color='blue'
)

# 光谱图 (nm) ps:波长范围通常比较大，pad 可以设大一点，比如 50 nm
plot_spectrum(
    df['Wavelength_nm'].values, 
    df['fosc'].values, 
    sigma=SIGMA_NM, 
    xlabel='Wavelength (nm)', 
    filename=IMG_NM,
    x_range_pad=50.0,
    color='green' # 换个颜色区分一下
)

print("All done!")
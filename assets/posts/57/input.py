import numpy as np
import os

# ================= 配置 =================
# 输入参数
freq_cm = 561.4           # 频率 (cm^-1)
mass_amu = 35.45          # 相对原子质量
r_eq = 1.9885             # 平衡键长
temp = 298.15             # 温度 (K)
n_samples = 200           # 采样数量

# 计算设置
nproc = 32
mem = "96GB"
route_section = "# NEVPT2(10,6)/cc-pvtz"
mokit_options = "mokit{Nstates=2}"
output_dir = "test" # 输出目录

# ================= 采样 =================
# 物理常数与 Wigner 采样参数
h_bar = 1.0545718e-34    # J*s
c = 2.99792458e10        # cm/s
amu_to_kg = 1.660539e-27 # kg
k_B = 1.380649e-23       # J/K

mu = (mass_amu * amu_to_kg) / 2.0
omega = freq_cm * 2 * np.pi * c 

sigma_0k = np.sqrt(h_bar / (2 * mu * omega))
if temp == 0:
    correction_factor = 1.0
else:
    exponent = (h_bar * omega) / (2 * k_B * temp)
    correction_factor = np.sqrt(1.0 / np.tanh(exponent))

sigma_r_meter = sigma_0k * correction_factor
sigma_r_ang = sigma_r_meter * 1e10

# Wigner采样并排序
deltas = np.random.normal(0, sigma_r_ang, n_samples)
bond_lengths = np.sort(r_eq + deltas)

print(f"--- Wigner 采样信息 ---")
print(f"温度: {temp} K")
print(f"频率: {freq_cm} cm^-1")
print(f"键长标准差 (Sigma): {sigma_r_ang:.4f} Å")
print(f"生成样本数: {n_samples}")
print("-" * 30)

# ================= 计算 =================
os.makedirs(output_dir, exist_ok=True)

for i, r in enumerate(bond_lengths):
    # 格式化索引，200个文件建议用三位数字补零 (001, 002...) 方便排序
    index = i + 1
    filename = f"Cl2_point{index:03d}.gjf"
    filepath = os.path.join(output_dir, filename)
    
    # 构建文件内容
    # 注意：f-string 中使用花括号需要转义，{{ }} 表示字面量 { }
    content = f"""%nproc={nproc}
%mem={mem}
{route_section}

{mokit_options}

0 1
Cl      0.000000      0.000000      0.000000
Cl      0.000000      0.000000      {r:.6f}

""" 
    # 写入文件
    with open(filepath, 'w') as f:
        f.write(content)

    # 仅打印前几个和后几个作为进度提示，避免刷屏
    if i < 3 or i >= n_samples - 3:
        print(f"Generated: {filepath} (R = {r:.4f} Å)")
    elif i == 3:
        print("...")

print("-" * 30)
print(f"全部完成！文件已保存在 {output_dir}/ 目录下。")
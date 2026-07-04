import re
import sys
import time
from math import log10, floor

def round_sig(x, sig=4):
    """保留指定位数的有效数字"""
    if x == 0:
        return 0
    return round(x, sig - int(floor(log10(abs(x)))) - 1)

def format_sig(x, sig=4):
    """格式化为指定位数的有效数字字符串，保留末尾的零"""
    if x == 0:
        return "0.000"
    
    # 计算小数点后需要的位数
    abs_x = abs(x)
    if abs_x >= 1:
        # 整数部分的位数
        int_digits = int(floor(log10(abs_x))) + 1
        decimal_places = max(0, sig - int_digits)
    else:
        # 小数情况：计算前导零后需要的位数
        decimal_places = sig - int(floor(log10(abs_x))) - 1
    
    rounded = round_sig(x, sig)
    return f"{rounded:.{decimal_places}f}"

def main():
    print("请粘贴数据，完成后按Enter两次:")
    
    # 收集输入数据
    lines = []
    while True:
        line = input()
        if not line:
            break
        lines.append(line)
    
    # 合并所有行并进行初步处理
    text = "\n".join(lines)
    
    # 识别方程类型
    equation_type = None
    
    if "exp" in text or ("y0" in text and "A1" in text and "t1" in text):
        equation_type = "exponential"
    elif "截距" in text and "斜率" in text:
        equation_type = "linear"
    
    # 提取参数和R平方值
    params = {}
    r_square_cod = None
    adjusted_r_square = None
    
    try:
        # 线性方程参数提取
        if equation_type == "linear":
            intercept_match = re.search(r'截距\s*([-+]?\d+\.?\d*)', text)
            if intercept_match:
                params["b"] = float(intercept_match.group(1))
            
            slope_match = re.search(r'斜率\s*([-+]?\d+\.?\d*)', text)
            if slope_match:
                params["a"] = float(slope_match.group(1))
        
        # 指数方程参数提取
        elif equation_type == "exponential":
            y0_match = re.search(r'y0\s*([-+]?\d+\.?\d*)', text)
            if y0_match:
                params["y0"] = float(y0_match.group(1))
            
            a1_match = re.search(r'A1\s*([-+]?\d+\.?\d*)', text)
            if a1_match:
                params["A1"] = float(a1_match.group(1))
            
            t1_match = re.search(r't1\s*([-+]?\d+\.?\d*)', text)
            if t1_match:
                params["t1"] = float(t1_match.group(1))
        
        # 提取R平方(COD)
        r_cod_match = re.search(r'R平方\(COD\)\s*([-+]?\d+\.?\d*)', text)
        if r_cod_match:
            r_square_cod = float(r_cod_match.group(1))
        
        # 提取调整后R平方
        adj_r_match = re.search(r'调整后R平方\s*([-+]?\d+\.?\d*)', text)
        if adj_r_match:
            adjusted_r_square = float(adj_r_match.group(1))
    
    except ValueError:
        print("参数提取失败：输入数据可能包含无效数字。")
        return
    
    # 选择较大的R值
    r_value = None
    if r_square_cod is not None and adjusted_r_square is not None:
        r_value = max(r_square_cod, adjusted_r_square)
    elif r_square_cod is not None:
        r_value = r_square_cod
    elif adjusted_r_square is not None:
        r_value = adjusted_r_square
    
    # 构建填充参数的方程
    filled_equation = None
    
    if equation_type == "linear" and "a" in params and "b" in params:
        a_str = format_sig(params['a'], 4)
        b_val = params['b']
        b_str = format_sig(abs(b_val), 4)
        
        if b_val >= 0:
            filled_equation = f"y={a_str}x+{b_str}"
        else:
            filled_equation = f"y={a_str}x-{b_str}"
    
    elif equation_type == "exponential" and "y0" in params and "A1" in params and "t1" in params:
        y0_val = params['y0']
        A1_str = format_sig(params['A1'], 4)
        t1_str = format_sig(abs(params['t1']), 4)
        y0_str = format_sig(abs(y0_val), 4)
        
        # 根据t1正负决定exp内的符号
        t1_val = params['t1']
        if t1_val >= 0:
            exp_part = f"{A1_str}*exp(-x/{t1_str})"
        else:
            exp_part = f"{A1_str}*exp(x/{t1_str})"
        
        if y0_val >= 0:
            filled_equation = f"y={exp_part}+{y0_str}"
        else:
            filled_equation = f"y={exp_part}-{y0_str}"
    
    # 输出结果
    print("\n结果:")
    if filled_equation:
        print(filled_equation)
    else:
        print("无法解析方程参数")
    
    if r_value is not None:
        print(f"R^2={format_sig(r_value, 4)}")
    else:
        print("无法找到R平方值")
    
    # 防止窗口闪退
    print("\n按Enter键退出...")
    input()

if __name__ == "__main__":
    main()
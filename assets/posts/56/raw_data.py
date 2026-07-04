import PyOrigin as po

# 获取当前活动工作表
wks = po.ActiveLayer()

# 获取工作表的列数
num_columns = wks.Cols

# 将第一列设置为注释类型（通常用于忽略）
wks.Columns(0).Type = po.COLTYPE_NONE

# 将第二列设置为X列
wks.Columns(1).Type = po.COLTYPE_X

# 计算要删除的列（从第4列开始，每隔两列删除一列）
columns_to_delete = list(range(3, num_columns, 2))

# 从后向前删除指定列，以避免删除操作影响后续列的索引
for col_index in sorted(columns_to_delete, reverse=True):
    wks.DeleteCol(col_index)

# 将剩余的Y列设置为Y类型
for i in range(2, len(wks.Columns)):
    if i % 2 == 0:  # 偶数列（Python索引从0开始，所以实际上是奇数列）
        wks.Columns(i).Type = po.COLTYPE_Y

for i in range(12):
    wks.DeleteRow(0)  # 因为Python索引从0开始，每次删除第0行，后面的行会自动上移

print(f"已删除 {len(columns_to_delete)} 列重复的X轴数据。")
print(f"当前工作表还剩 {len(wks.Columns)} 列。")
print("列类型已设置为：注释-X-Y-Y-Y-...")
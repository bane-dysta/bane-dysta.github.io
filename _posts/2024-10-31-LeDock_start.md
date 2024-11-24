---
title: Study note：使用LeDock(Linux)进行批量对接
date: 2024-10-31 19:00:00 +0800
categories: [Calculation, Molecular simulation]
tags: [LeDock]     
---
分子对接是一种计算生物学技术，用于预测两个或多个分子（通常是蛋白质和配体或小分子药物）之间的相互作用方式。流行的分子对接软件有Autodock、Autodock vina、Discovery Studio、glide、rDock、GOLD、LeDock等。笔者是从Autodock入手的，结合ADT的UI界面大致学习了一下如何进行分子对接。起初对接CHNO的有机分子还挺顺利，但开始自己的课题后光速遇到麻烦。
```
ATOM syntax incorrect: "B" is not a valid AutoDock type. Note that AutoDock atom types are case-sensitive.
```
虽然后来参考[Researchgate的帖子](https://www.researchgate.net/post/How-to-add-Cobalt-atomic-parameter-in-autodock-42)手动添加参数临时解决了问题，但课题后续又需要进行批量对接。用Autodock手动一个一个对接显然太过于幽默，而批量对接常用的Autodock Vina软件又彻底不支持自定义添加元素，因此不得不学习新软件。

经过一番调查后，发现LeDock使用好像比较简单，且据说支持硼。于是决定学习LeDock。但是使用后才发现LeDock对硼的支持方式是对不认识的原子统一使用默认参数(= =)。虽然如此，但LeDock实在是太方便了，而且速度还快，还是很有必要记录一下使用方法的。  
## 0. 软件的安装
LeDock及其配套软件可以在[LeDock官网](https://www.lephar.com/download)下载。目前LeDock提供的是预编译版本，无需任何繁琐的安装操作，只需下载后将二进制文件路径添加至环境变量即可：
~~~
echo 'export PATH=$PATH:/home/wcy/apps/ledock' >> ~/.bashrc
~~~
## 1. 受体的获取和前处理
蛋白质结构是从[RCSB PDB](https://www.rcsb.org/)获取的。此例为人血清白蛋白，编号4k2c。
> 请留意下载下来的蛋白质是不是二聚体。如果是二聚体，可以用PyMOL先删掉一个，再进行对接实验。
{: .prompt-warning }

可以使用lepro一键处理蛋白质：
```bash
lepro 4k2c_single.pdb
```
如果要保留金属离子，可以加上-metal参数：
```bash
lepro 4k2c_single.pdb -metal
```
处理后，会生成对接输入文件dock.in和处理好的配体pro.pdb。


## 2. 配体的获取和前处理
本次测试目标是重复[*Journal of Hazardous Materials 465 (2024) 133104*](https://www.sciencedirect.com/science/article/pii/S0304389423023889?via%3Dihub)的对接，并对照对接结果。

6个毒素分子的结构是从[PubChem](https://pubchem.ncbi.nlm.nih.gov/)获取的。下载下来是sdf格式，LeDock目前的发行版还不支持sdf，因此还需要使用openbabel转换成mol2格式：
```bash
obabel Citrinin.sdf -O Citrinin.mol2
```
原文的荧光探针DOCE是使用Chem3D在MM2水平优化的，过于抽象，于是笔者选择在ωB97XD/TZVP水平下进行结构优化和频率分析。完成后，同样使用openbabel转换成mol2格式：
```bash
obabel DOCE.log -O DOCE.mol2
```
## 3. 准备参数和对接
LeDock的参数文件格式如下：
```
Receptor
pro.pdb

RMSD
1.0

Binding pocket
xmin xmax 
ymin ymax 
zmin zmax 

Number of binding poses
20

Ligands list
ligand_list.txt
END
```
以下每一个输入块的title都是关键词，不可更改：
- Receptor：受体蛋白质的pdb文件名。LeDock仅读取ATOM行，显式水分子、辅因子、金属离子等若以HETATM行开头则会被忽略，可以使用lepro进行处理来避免。
- RMSD：均方根偏差。当进行多次分子对接计算时，可能会发现某些对接构象非常相似。为了减少冗余，可以通过RMSD进行聚类。推荐值是1.0 Å。
- Binding pocket：对接口袋坐标。如果有对接中心点的坐标，可以用公式推知口袋坐标。例如：   
  x<sub>min</sub>=x<sub>center</sub>-r<sub>pocket</sub>  
  x<sub>max</sub>=x<sub>center</sub>+r<sub>pocket</sub>
- Number of binding poses：对接次数。
- Ligands list配体文件列表。每行写一个配体文件名即可：
  ```
  Patulin.mol2
  Vomitoxin.mol2
  ZEN.mol2
  AFB1.mol2
  Citrinin.mol2
  DOCE.mol2
  OTA.mol2
  ```
  该文件要求unix格式，可以使用`cat -v ligand_list.txt`进行检查。若发现windows风格换行符^M，可以使用`dos2unix ligand_list.txt`来转换格式。

输入文件准备好后就可以开始对接了：
~~~
ledock dock.in
~~~
## 4. 分析对接结果
对接完成后，目录下产生了一些dok文件，这些就是对接结果记录。可以使用``ledock -spil name.dok``将其分解为单个的pdb文件，也可以直接打开：
~~~
REMARK Docking time: 1.8 min
REMARK Cluster   1 of Poses:  4 Score: -4.25 kcal/mol
ATOM      1  C   LIG     0       1.387  -0.260  -9.423
ATOM      2  C   LIG     0       2.381  -0.639 -10.236
...
~~~
默认是按为对接打分Score进行排序的。由于本次测试目的是复现文献结果，可以直接对能量进行提取并排序，观看结果。运行bash脚本：
~~~bash
#!/bin/bash

# 创建一个临时文件来存储结果
temp_file=$(mktemp)

# 提取每个文件中的第一个 Score 并写入临时文件
for file in *.dok; do
    energy=$(grep 'Score' "$file" | head -n 1)
    if [ -n "$energy" ]; then
        score=$(echo "$energy" | awk '{print $(NF-1)}') # 提取分数值
        echo "$score $file: $energy" >> "$temp_file"  # 将分数值放在前面
    fi
done

# 按照能量值排序并输出
echo "Sorted Scores:"
sort -n "$temp_file" | awk '{$1=$1; print}'  # 使用 awk 去除多余空格

# 删除临时文件
rm "$temp_file"
~~~
输出为：
~~~
(rdkitenv) [wcy@hpc ledock]$ ldok
Sorted Scores:
-5.55 OTA.dok: REMARK Cluster 1 of Poses: 11 Score: -5.55 kcal/mol
-4.25 DOCE.dok: REMARK Cluster 1 of Poses: 4 Score: -4.25 kcal/mol
-3.39 Vomitoxin.dok: REMARK Cluster 1 of Poses: 24 Score: -3.39 kcal/mol
-3.32 ZEN.dok: REMARK Cluster 1 of Poses: 1 Score: -3.32 kcal/mol
-2.63 Citrinin.dok: REMARK Cluster 1 of Poses: 5 Score: -2.63 kcal/mol
-2.50 AFB1.dok: REMARK Cluster 1 of Poses: 40 Score: -2.50 kcal/mol
-2.06 Patulin.dok: REMARK Cluster 1 of Poses: 6 Score: -2.06 kcal/mol
~~~
与原文对比，发现AFB1和DON(Vomitoxin)的顺位对调了。可能的原因是对接口袋的位置与原文存在偏移，漏过了适合AFB1结合的位置，却包含了适合DON结合的位置。LeDock打分函数给出的对接能均大约为Autodock的一半，由此可以推知对比对接能必须基于同一个软件的结果。
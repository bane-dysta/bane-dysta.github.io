---
title: Study note：精确计算激发能的方法
date: 2024-11-16 12:00:00 +0800
categories: [Calculation, Quantum Chemistry]
tags: [notes,excited state]     
---
长期以来，笔者一直算不准激发能，还常常遇到用``B3LYP``、``PBE0``等泛函算纯LE激发比实验值蓝100nm以上等幽默的问题。不过在探索怎么算准激发能的过程中，笔者也借机学会了一些以前一直不敢碰的计算级别。这里权且记录一下笔者试过的方法备用。
## 1. 几何优化
笔者通常没有实力拿到单晶去打XRD，因此几何建模一般都是从头搭的。这样就涉及到几何优化的问题了。虽说几何对计算等级不敏感，但一个不留神选了个对体系描述定性错误的级别，后面再怎么努力也是白搭。

### 基组
笔者常用的基组有：
- ``def2-SVP``
- ``6-31g*``
- ``TZVP``

一般情况下，到``TZVP``级别就很够用了，``def2-TZVP``通常已经不能带来什么显著提升，且又贵的多，不值得尝试。

### 泛函
由于笔者接触的体系大多为大共轭体系，用的最多的泛函是``ωB97XD``，其次是``cam-B3LYP``和``M06-2X``。
~~~
%chk=rhodamine.chk
# wB97XD/def2SVP opt freq scrf=solvent=water

title

0 1
...
~~~
有关结构优化时要不要加溶剂的问题，笔者多番尝试后，最终的决定是能加就加。这个结论来自笔者优化过一个类罗丹明体系。无溶剂优化时，该体系倾向于扭曲构象来形成一个奇怪的分子内氢键；而带EtOH、DMSO等高极性溶剂时，该体系会保持C2对称性。而且带溶剂与不带溶剂的结构可以通过加上/去掉溶剂相互优化过去，笔者认为可以排除局域极小点的可能。

``ωB97XD``在优化柔性构象时非常容易出小虚频，这是很讨厌的。笔者尝试过的消虚频方法有：
 - ``int=superfine``
 - ``opt=tight`` or ``opt=verytight``
 - 手动掰结构(这种情况通常是甲基或腈基发癫)

通常这些就够了，如果这样还不能消掉虚频，那就换泛函收敛到无虚频结构，再用``geom=allchk``和``guess=read``给``ωB97XD``算，通常能解决问题。如果这样也解决不了的话，abort

关于其他高于杂化泛函的计算方法，除了极小体系外笔者是没有尝试过的。而尝试``CCSD/cc-pVTZ``做几何优化时笔者发现这个级别用64核192GB资源优化17原子体系都算了两天，应当认为不适合拿来做几何优化。

## 2. 激发能计算
激发能对计算级别比几何优化敏感得多，不同的级别反映在激发能上会差出十万八千里，因此这里不能再像几何优化一样万金油``ωB97XD``扫六合，要认真起来了！

### 基组
对于激发能计算，``TZVP``同样已经够用，如果误差几十上百nm，就不要往基组头上怀疑了。笔者在一个[帖子](http://bbs.keinsci.com/thread-49607-1-1.html)里建议楼主用``def2-TZVP``被sob老师在楼下指正了🥲

不过，由于multiwfn生成ORCA输入文件的默认基组是``def2-TZVP``，笔者仍然常用``def2-TZVP``来计算激发能。

### 杂化泛函
虽说笔者一次都没算准过，但杂化泛函依然是计算激发能的首选，没别的原因，就是便宜，很多时候杂化泛函可以起到投石问路的作用，为接下来计算级别的选择奠定基础。笔者常用的有：
 - ``ωB97XD``：范围分离泛函，计算CT激发还行，但形式比较复杂，略贵。
 - ``M06-2X``：HF成分54%，计算LE严重高估激发能。形势复杂，较贵。
 - ``cam-B3LYP``：范围分离泛函，可以计算CT激发。笔者用这个少于ωB97XD，因为后者自带DFT-D校正。
 - ``PBE0``：HF成分25%，适合计算LE激发。
 - ``B3LYP``：HF成分20%，适合计算LE激发。对大共轭体系有高估离域性的倾向。

待尝试：
 - ``PBE38``：HF成分37.5%，可以计算有一定CT特征的LE激发。
 - ``LC-ωPBE``：ω调控泛函，理论上可以算的很准，但对每个体系都要单独优化ω。ω默认值为0.4，直接用会高估激发能，调控后普遍在0.25左右。
 - ``BHandHLYP``：HF成分50%，若只追求HF成分可以作为M06-2X的代替品。

~~~
%chk=rhodamine.chk
# wB97XD/def2SVP td scrf=(SMD,solvent=water)

title

0 1
...
~~~
计算能量时，应当采用SMD溶剂模型，必要情况下可使用显式溶剂进行计算。对于CT激发，应当使用cLR溶剂模型或态特定溶剂模型。

#### 歪门邪道
有时候，计算激发能并非为了预测光谱，而是已有期望值，需要计算打个马后炮，那么此时还有这些办法可以尝试：
- 使用HF成分不同的泛函微操激发能：纯泛函通常低估激发能，HF则高估激发能。若及算激发能偏高，可以尝试B3LYP、TPSSh等低HF成分的泛函；若计算激发能偏低，可以尝试M06-2X、BHandHLYP等高HF成分的泛函。[不同DFT泛函的HF成份一览](http://sobereva.com/282)。
- 使用ω调控泛函优化长程校正参数：参考[优化长程校正泛函w参数的简便工具optDFTw](http://bbs.keinsci.com/thread-4100-1-1.html)。

### 双杂化泛函
这个级别是比较精确的，已经开始期望对上实验光谱了。笔者尝试过的双杂化泛函有：

- ``DSD-PBEP86``：sob老师推荐的比较稳健的选择，然而笔者的运气不好，第一次使用就出现了Double Correction反客为主的现象：
  ~~~
  Contributions to the (D) correction(s) (in eV)
  
  STATE  Final   Init.   Total   v(ext)   v(int)  v(3)    u
         omega   omega     (D)                             
  ----------------------------------------------------------------------  -------
     0   2.100   2.627  -0.527   2.236   3.420  -0.259  -5.924
     1   1.709   3.509  -1.800   2.211   2.592  -0.046  -6.557
     2   2.135   4.152  -2.017   2.273   2.975  -0.112  -7.153
     3   2.365   4.506  -2.141   2.258   2.893  -0.119  -7.173
     4   4.407   5.178  -0.772   1.737   2.907  -0.120  -5.296
  
  (D)-timings
   Integral transformation       ...  1172.251 sec
  ~~~
  计算出STATE 1的Correction比激发能还要高，说明该结果的可信度需要斟酌。笔者建议对于CT激发的情况谨慎相信``DSD-PBEP86``，应当与其他级别的结果做对比。
- ``ωB2GP-PLYP``：范围分离泛函，似乎支持ω调控，但是笔者没有试过，用的是默认参数。PS: 该泛函在ORCA 6.0.0上的运行[有bug](https://orcaforum.kofo.mpg.de/viewtopic.php?f=8&t=11682)，会报错退出。
- ``RSX-QIDH``：范围分离泛函，总体感觉与``ωB2GP-PLYP``表现差不多。

~~~
! wB2GP-PLYP def2-TZVP def2/J def2-TZVP/C RIJCOSX tightSCF noautostart miniprint nopop
%maxcore  4000
%pal nprocs   50 end
%cpcm
smd true
SMDsolvent "ethanol"
end
%tddft
nroots 5
TDA false
end
* xyzfile 0 1 opt_PPH2.xyz

~~~
笔者在Gaussian中运行过双杂化泛函任务，慢的要死不说，最后还给硬盘存储空间干爆了没跑完，于是后来计算双杂化泛函就都用ORCA了，虽然一样吃比较硬盘但起码ORCA有RIJCOSX加速，计算速度会明显快很多。

### 低标度耦合簇类方法

#### STEOM-DLPNO-CCSD
作为一种低标度耦合簇方法，``STEOM-DLPNO-CCSD``常常作为大体系激发能计算的标杆出现。``STEOM-DLPNO-CCSD``输入文件可以由Multiwfn生成，默认基组是``def2-TZVP(-f)``：
~~~
! STEOM-DLPNO-CCSD RIJK def2-TZVP(-f) def2/JK def2-TZVP/C noautostart miniprint nopop
%maxcore  12500
%pal nprocs 16 end
! CPCM(Ethanol)
%mdci
nroots 3
DoSolv true
end
* xyzfile 0 1 opt_PPH2.xyz

~~~
note：
- 该计算对内存容量的要求巨高无比，若为了多用核而给``%maxcore``设置像3000这种小内存，呱唧呱唧算几个小时后爆内存白算的可能性极大。推荐从6000开始尝试，机器内存不够时须牺牲并行核数。
- 该计算对硬盘空间的需求极其夸张，笔者计算一55原子有机体系，临时文件硬生生挤爆3TB硬盘空间崩了任务，若要大体系计算建议使用土豪配置服务器。
- 该计算容易出现EOM不收敛：
  ~~~
  BATCH   6 OF   6
  
  Iter    Delta-E          Residual              Time
  ---------------------------------------------------
    0   0.747447849158   0.485740642115         3.077
    1   0.025535938399   0.423450178164         3.132
    2   0.002753312073   0.419171724154         3.117
    3   0.000150730448   0.418414239133         3.130
  
  ...
  
   97   0.000007337485   0.740716841211         4.438
   98   0.000002087948   0.740711835791         4.640
   99   0.000003973179   0.740728747740         4.843
                          --- The EOM iterations have NOT converged ---
  ~~~
  可能的解决办法：
  - 尝试``verytightSCF``；
  - 增加``nroots``数量；
  - 将``DoCISNat``设置为false，并按照输出文件中的活性空间数手动设置``NActIP``和``NActEA``；
    ~~~
    No of roots active in IP calculation:    5
    No of roots active in EA calculation:    4
    ~~~
  - 通过调整``OThresh``和``VThresh``控制活性空间大小，该项默认值为0.001

#### LR-CC2
ORCA不支持该方法，需要安装Dalton或MRCC。由于笔者的节点系统太老，无法编译这些软件，待学习。

### 多参考方法
对于多参考体系，EOM常常较难收敛，此时可以尝试``NEVPT2``或``CASPT2``方法，二者是计算光化学问题的王牌，计算激发的精度很好，也时常作为标杆为泛函提供参照。由于Gaussian对CASSCF支持的很差，笔者只会在考虑分子的活性空间范围时用Gaussian来做些简单的计算。要真正计算激发能，推荐由ORCA来进行：
~~~
! DLPNO-NEVPT2 aug-cc-pVTZ aug-cc-pVTZ/JK  miniprint noautostart CPCM(ethanol)
%maxcore 6250
%pal nprocs 16 end
%casscf
nel 4
norb 4
nroots 4
weights[0] = 1,1,0,0
end
%scf
rotate {35,37} end
end
*xyzfile -1 1 opt_YMT-.xyz

~~~

- ``nel``：纳入CAS的占据轨道数
- ``norb``：纳入CAS的空轨道数
- ``weights[0]``：各个态的权重系数
- ``rotate``：对调轨道，相当于Gaussian的``guess=alter``

### CIS(D)
由[*Chem. Phys. 2004, 305 (1–3), 223–230.*](https://www.sciencedirect.com/science/article/pii/S0301010404003179?via%3Dihub)了解到CIS(D)表现还行，在尝试后，笔者意外发现这个级别计算具有双电子激发特征的BODIPY有时还不错，在此记录。

~~~
! RHF def2-TZVP Def2-TZVP/C noautostart miniprint nopop
%maxcore 5000
%pal nprocs 40 end
%scf
        Tole 1e-10
        TolRMSP 1e-10
        TolMaxP 1e-8
end
%cpcm
smd true
SMDsolvent "ethanol"
end
%cis
dcorr 2
Nroots 5
MaxDim 20
end
* xyzfile 0 1 opt_PPH2.xyz

~~~

### ADC(2)
精度高于TD-DFT，但比EOM-CCSD差不少。计算量也相当大，40原子以内考虑。
```
! ADC2 def2-TZVP Def2-TZVP/C TightSCF
%maxcore 10000
%pal nprocs 24 end
%mdci
 nroots 5
end
*xyzfile 0 1 opt_PPH2.xyz

```

## 3. 杂项考量
这些因素也会影响激发能是否能与实验光谱对应上：
- 自旋轨道耦合：对于存在强SOC的分子，可以尝试使用ORCA计算考虑SOC的光谱，兴许对结果有改善。
- FCHT效应：有时振动态会改变最大吸收峰或发射峰的位置和强度，可能需要计算振动分辨的电子光谱来尝试与实验结果对比。
- 环境：与溶剂形成氢键、聚集、形成excimer等会改变实验光谱的特征。这种情况下对单分子用再好的级别都没用，因为此时实验测得的光谱已经不属于单分子了。

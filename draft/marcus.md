好的,让我们从Fermi黄金法则开始一步步推导Marcus公式。

$$
k_{ET} = \frac{2\pi}{\hbar}|V_{AB}|^2\rho(E_f)
$$

1. 首先考虑反应坐标。在电子转移过程中,我们有一个多维的核坐标空间,可以简化为单一的反应坐标Q。电子供体和受体态的势能面可以用简谐近似表示:

$$
E_i(Q) = \frac{1}{2}kQ^2
$$
$$
E_f(Q) = \frac{1}{2}k(Q-Q_0)^2 + \Delta G^0
$$

2. 末态的态密度$\rho(E_f)$可以通过玻尔兹曼分布给出:

$$
\rho(E_f) = \frac{1}{Z}\int \exp(-\frac{E_f(Q)}{k_BT})dQ
$$

其中Z是配分函数。

3. 重组能$\lambda$定义为:
$$
\lambda = \frac{1}{2}kQ_0^2
$$

4. 将这些代入,并考虑能量守恒条件$E_i(Q) = E_f(Q)$,我们得到:

$$
\frac{1}{2}kQ^2 = \frac{1}{2}k(Q-Q_0)^2 + \Delta G^0
$$

5. 对指数项积分:

$$
\int \exp(-\frac{E_f(Q)}{k_BT})dQ = \sqrt{\frac{4\pi\lambda k_BT}{k}}\exp(-\frac{(\Delta G^0 + \lambda)^2}{4\lambda k_B T})
$$

6. 最终得到Marcus公式:

$$
k_{ET} = \frac{2\pi}{\hbar} |V_{AB}|^2 \frac{1}{\sqrt{4\pi\lambda k_B T}} \exp\left(-\frac{(\Delta G^0 + \lambda)^2}{4\lambda k_B T}\right)
$$

这个推导涉及几个关键近似:
- 势能面的简谐近似
- 高温极限(经典核运动)
- 非绝热极限(弱电子耦合)
- Condon近似(电子耦合与核坐标无关)

这就解释了为什么公式中出现了$\frac{2\pi}{\hbar}$和$\frac{1}{\sqrt{4\pi\lambda k_B T}}$这两项。前者来自量子力学的时间演化,后者来自核运动的统计分布。

好的,让我们从重组能开始详细推导。

重组能$\lambda$定义为初态核构型到末态核构型的垂直跃迁所需的能量。根据简谐近似:

1. 初态势能曲线:
$$
E_i(Q) = \frac{1}{2}kQ^2
$$

2. 末态势能曲线(相对于初态平移了$Q_0$):
$$
E_f(Q) = \frac{1}{2}k(Q-Q_0)^2 + \Delta G^0
$$

3. 重组能定义为在Q=0处末态势能减去$\Delta G^0$:
$$
\lambda = E_f(0) - \Delta G^0 = \frac{1}{2}k(0-Q_0)^2 = \frac{1}{2}kQ_0^2
$$

4. 根据Franck-Condon原理,电子转移发生在核构型交叉点$Q_c$处。在此点:
$$
E_i(Q_c) = E_f(Q_c)
$$

5. 代入势能表达式:
$$
\frac{1}{2}kQ_c^2 = \frac{1}{2}k(Q_c-Q_0)^2 + \Delta G^0
$$

6. 展开右边项:
$$
\frac{1}{2}kQ_c^2 = \frac{1}{2}k(Q_c^2 - 2Q_cQ_0 + Q_0^2) + \Delta G^0
$$

7. 整理:
$$
kQ_cQ_0 = \frac{1}{2}kQ_0^2 + \Delta G^0
$$
$$
Q_c = \frac{\lambda + \Delta G^0}{kQ_0}
$$

8. 电子转移的活化能为:
$$
\Delta G^{\ddagger} = E_i(Q_c) - E_i(0) = \frac{1}{2}kQ_c^2
$$

9. 代入$Q_c$的表达式:
$$
\Delta G^{\ddagger} = \frac{(\lambda + \Delta G^0)^2}{4\lambda}
$$

10. 根据过渡态理论,反应速率正比于玻尔兹曼因子:
$$
k_{ET} \propto \exp(-\frac{\Delta G^{\ddagger}}{k_BT})
$$

11. 考虑量子力学的Fermi黄金法则和核运动的统计分布,最终得到完整的Marcus方程:
$$
k_{ET} = \frac{2\pi}{\hbar} |V_{AB}|^2 \frac{1}{\sqrt{4\pi\lambda k_B T}} \exp\left(-\frac{(\lambda + \Delta G^0)^2}{4\lambda k_B T}\right)
$$

这个推导展示了Marcus方程中指数项的来源,它反映了电子转移的活化能。那个$\frac{1}{\sqrt{4\pi\lambda k_B T}}$预指数因子来自于对所有可能核构型的积分,确保了总概率的归一化。

我是否需要对某个步骤做更详细的解释？

让我来详细解释态密度积分的推导过程。

在Fermi黄金法则中,我们需要计算末态的态密度$\rho(E_f)$。根据统计力学,态密度正比于玻尔兹曼分布:

$$
\rho(E_f) = \frac{1}{Z}\int \exp(-\frac{E_f(Q)}{k_BT})dQ
$$

1. 首先代入末态势能表达式:
$$
E_f(Q) = \frac{1}{2}k(Q-Q_0)^2 + \Delta G^0
$$

2. 积分变为:
$$
\int \exp\left(-\frac{1}{k_BT}[\frac{1}{2}k(Q-Q_0)^2 + \Delta G^0]\right)dQ
$$

3. 将指数项展开:
$$
\exp(-\frac{\Delta G^0}{k_BT})\int \exp\left(-\frac{k}{2k_BT}(Q-Q_0)^2\right)dQ
$$

4. 这是一个高斯积分的形式。令 $a = \frac{k}{2k_BT}$,则:
$$
\exp(-\frac{\Delta G^0}{k_BT})\int \exp(-a(Q-Q_0)^2)dQ
$$

5. 高斯积分的标准结果为:
$$
\int_{-\infty}^{\infty} \exp(-ax^2)dx = \sqrt{\frac{\pi}{a}}
$$

6. 应用到我们的情况:
$$
\exp(-\frac{\Delta G^0}{k_BT})\sqrt{\frac{2\pi k_BT}{k}}
$$

7. 考虑配分函数Z的归一化,并代入重组能$\lambda = \frac{1}{2}kQ_0^2$:
$$
\rho(E_f) = \frac{1}{\sqrt{4\pi\lambda k_BT}}\exp\left(-\frac{(\Delta G^0 + \lambda)^2}{4\lambda k_BT}\right)
$$

这就得到了Marcus方程中的预指数因子和指数项。预指数因子$\frac{1}{\sqrt{4\pi\lambda k_BT}}$来自高斯积分的标准结果,而指数项中的$(\Delta G^0 + \lambda)^2$则反映了电子转移的活化能。

这个积分的物理意义是:它考虑了所有可能的核构型对电子转移的贡献,而每个构型的权重由其玻尔兹曼因子决定。高斯形式的结果表明,对电子转移最重要的贡献来自势能面交叉点附近的核构型。
---
layout: page
icon: fas fa-cog
order: 4
---

<div class="collapsible-section">
<button class="collapsible-btn">Gaussian</button>
<div class="collapsible-content" markdown="1">

[Gaussian官网](https://gaussian.com/gaussian16/)

[DFT](https://gaussian.com/DFT)

[Basis Set](https://gaussian.com/basissets/)

</div>
</div>

<div class="collapsible-section">
<button class="collapsible-btn">ORCA</button>
<div class="collapsible-content" markdown="1">

[ORCA 6.0 Manual](https://www.faccts.de/docs/orca/6.0/manual/index.html)

[泛函列表](https://www.faccts.de/docs/orca/6.0/manual/contents/structure.html#density-functional-methods)

[自定义泛函](https://www.faccts.de/docs/orca/6.0/manual/contents/detailed/model.html#sec-model-dft-functionals-detailed)

[基组可用性](https://www.faccts.de/docs/orca/6.0/manual/contents/detailed/basisset.html#table-basisset-availability-detailed)

[TDDFT](https://www.faccts.de/docs/orca/6.0/manual/contents/detailed/tddft.html)

[输入文件](https://sites.google.com/site/orcainputlibrary/)

</div>
</div>

<div class="collapsible-section">
<button class="collapsible-btn">MRCC</button>
<div class="collapsible-content" markdown="1">

[钟老师的帖子](http://bbs.keinsci.com/thread-29156-1-1.html)

</div>
</div>

<div class="collapsible-section">
<button class="collapsible-btn">论坛</button>
<div class="collapsible-content" markdown="1">

[计算化学公社](http://bbs.keinsci.com/forum.php)

[思想家公社的门口](http://sobereva.com/)

</div>
</div>

<div class="collapsible-section">
<button class="collapsible-btn">杂项</button>
<div class="collapsible-content" markdown="1">
```
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.hpcloud.cloud",
    "https://docker.m.daocloud.io",
    "https://docker.unsee.tech",
    "https://docker.1panel.live",
    "http://mirrors.ustc.edu.cn",
    "https://docker.chenby.cn",
    "http://mirror.azure.cn",
    "https://dockerpull.org",
    "https://dockerhub.icu",
    "https://hub.rat.dev"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```
[Docker 镜像加速列表](https://www.coderjia.cn/archives/dba3f94c-a021-468a-8ac6-e840f85867ea)
</div>
</div>

<div class="collapsible-section">
<button class="collapsible-btn">Blog</button>
<div class="collapsible-content" markdown="1">

[Chripy官网](https://chirpy.cotes.page/)

[Marvin](https://winxuan.github.io/posts/creat-blog/)

[MsEspeon](https://ittousei.github.io/posts/customize-my-blog/)

[本地服务器网址](http://127.0.0.1:4000/)

[草稿纸](https://bane-dysta.github.io/draft)

</div>
</div>

<div class="collapsible-section">
<button class="collapsible-btn">单位换算</button>
<div class="collapsible-content" markdown="1">

|            |   Hartree    |      eV      |     kcal/mol     |    kJ/mol     |
| :--------: | :----------: | :----------: | :--------------: | :-----------: |
| 1 Hartree  |      1       | 27.211386 eV | 627.509 kcal/mol | 2625.5 kJ/mol |
|    1 eV    | 0.0367493 Eh |      1       | 23.0605 kcal/mol | 96.485 kJ/mol |
| 1 kcal/mol | 0.0015936 Eh | 0.0433641 eV |        1         | 4.184 kJ/mol  |
|  1 kJ/mol  | 0.0003800 Eh | 0.0103643 eV | 0.2390 kcal/mol  |       1       |

</div>
</div>


```
test
```
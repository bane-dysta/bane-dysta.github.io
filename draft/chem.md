---
layout: cds
title: ChemDoodle转smiles
date: 2024-11-1 12:00:00 +0800
---

## ChemDoodle 转 smiles字符串
tips：
- 移动端ChemDoodle绘板会错位，笔者太菜了没能力解决这个问题，请在设置中选择访问电脑版。
- OpenChemLib导出的smiles结构没有立体结构信息，改用OpenBabel可以避免此问题。然而OpenChemLib有minimal版本，大小仅560kb，OpenBabel足足8M，为性能考虑，笔者未在Git Page上部署OpenBabel版。
- 免费版ChemDoodle没有手动输入基团的功能，花钱买他们的软件才给用。

<style>
/* 导出按钮样式 */
.export-button {
    margin: 10px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.export-button:hover {
    background-color: #45a049;
}

/* SMILES 输出框样式 */
#smilesOutput {
    width: 80%;
    max-width: 400px;
    padding: 10px;
    margin: 10px auto;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
}

/* 复制反馈信息样式 */
#copyFeedback {
    display: none;
    color: green;
    margin-top: 10px;
    font-size: 16px;
}


</style>

<center>
    <div id="sketcherContainer">
        <canvas id="sketcher" width="500" height="400"></canvas>
    </div>
    <br>
    <button class="export-button" onclick="exportToSMILES()">导出为 SMILES</button>
    <br>
    <input type="text" id="smilesOutput" readonly placeholder="SMILES 会显示在这里...">
</center>


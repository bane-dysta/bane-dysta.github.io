---
layout: cds
title: cds
date: 2024-11-1 12:00:00 +0800
---

<style>
/* 全局样式 */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    text-align: center;
}

.sketcher-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    box-sizing: border-box;
    width: 100%;
}

#sketcher {
    width: 100%;
    height: auto;
    max-width: 800px; /* 与HTML中的canvas width匹配 */
    border: 2px solid #ccc;
    margin: 10px 0;
}

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

/* 响应式调整 */
@media (max-width: 800px) {
    #sketcher {
        max-width: 100%;
    }

    .export-button {
        padding: 8px 16px;
        font-size: 14px;
    }

    #smilesOutput {
        width: 90%;
        font-size: 14px;
    }

    #copyFeedback {
        font-size: 14px;
    }
}

@media (max-width: 500px) {
    #sketcher {
        max-width: 100%;
    }

    .export-button {
        padding: 6px 12px;
        font-size: 12px;
    }

    #smilesOutput {
        width: 95%;
        font-size: 12px;
    }

    #copyFeedback {
        font-size: 12px;
    }
}


</style>

<center>
    <div id="sketcherContainer">
        <canvas id="sketcher" width="500" height="300"></canvas>
    </div>
    <br>
    <button class="export-button" onclick="exportToSMILES()">导出为 SMILES</button>
    <br>
    <input type="text" id="smilesOutput" readonly placeholder="SMILES 会显示在这里...">
</center>


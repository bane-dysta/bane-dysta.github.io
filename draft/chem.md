---
layout: cds
title: cds
date: 2024-11-1 12:00:00 +0800
---

<style>
    body {
        font-family: Arial, sans-serif;
    }
    .export-button {
        margin: 10px;
        padding: 6px 12px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .export-button:hover {
        background-color: #45a049;
    }
    #smilesOutput {
        width: 400px;
        padding: 5px;
        margin: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    #sketcherContainer {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 20px;
    }
    /* 修复工具栏布局 */
    #sketcher_buttons {
        display: flex !important;
        flex-wrap: wrap;
        justify-content: center;
        gap: 2px;
        margin-bottom: 10px;
    }
    #sketcher_buttons button {
        margin: 0 !important;
        padding: 2px !important;
    }
    .tools-button {
        width: 24px !important;
        height: 24px !important;
        padding: 2px !important;
        margin: 1px !important;
    }
    /* 确保画布容器正确显示 */
    #sketcher {
        border: 1px solid #ccc;
        margin: 10px 0;
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


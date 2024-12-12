---
layout: page
title: chemdoodle2smiles
date: 2024-11-1 12:00:00 +0800
---


<!-- 引入必要的 CSS 文件 -->
<link rel="stylesheet" href="{{ '/assets/css/jquery-ui-1.11.4.css' | relative_url }}" type="text/css">
<link rel="stylesheet" href="{{ '/assets/css/ChemDoodleWeb.css' | relative_url }}" type="text/css">

<!-- 引入必要的 JavaScript 文件 -->
<script type="text/javascript" src="{{ '/assets/js/ChemDoodleWeb.js' | relative_url }}"></script>
<script type="text/javascript" src="{{ '/assets/js/ChemDoodleWeb-uis.js' | relative_url }}"></script>
<script type="text/javascript" src="{{ '/assets/js/openchemlib-full.js' | relative_url }}"></script>

<!-- 添加自定义 CSS -->
<style>
    body {
        font-family: Arial, sans-serif;
    }
    #chem-sketcher-page {
        text-align: center;
        margin: 20px;
    }
    #sketcherContainer {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    #sketcher {
        border: 1px solid #ccc;
        margin: 10px 0;
    }
    .export-button {
        margin: 10px;
        padding: 6px 12px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
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
    /* 隐藏 ChemDoodle 的默认工具栏 */
    .ChemDoodleWebToolbar {
        display: none !important;
    }
    /* 自定义工具栏样式 */
    #custom-toolbar {
        margin-top: 20px;
    }
    #custom-toolbar button {
        margin: 5px;
        padding: 8px 12px;
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    #custom-toolbar button:hover {
        background-color: #e0e0e0;
    }
</style>

<div id="chem-sketcher-page">
    <style>
        /* 保留或移动内联样式 */
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
            transition: background-color 0.3s;
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

<script>
    // 自定义元素颜色
    ChemDoodle.ELEMENT['H'].jmolColor = 'black';
    ChemDoodle.ELEMENT['S'].jmolColor = '#B9A130';

    // 初始化 Sketcher 画布
    var sketcher = new ChemDoodle.SketcherCanvas('sketcher', 500, 300, {useServices:true});
    sketcher.styles.atoms_displayTerminalCarbonLabels_2D = true;
    sketcher.styles.atoms_useJMOLColors = true;
    sketcher.styles.bonds_clearOverlaps_2D = true;
    sketcher.styles.shapes_color = '#c10000';
    sketcher.repaint();

    // 移除初始分子的加载
    // 如果您之前添加了加载分子的代码，请确保将其移除

    function exportToSMILES() {
        try {
            let mol = sketcher.getMolecule();
            if (!mol || mol.atoms.length === 0) {
                document.getElementById('smilesOutput').value = '请先绘制一个分子';
                return;
            }

            let molfile = ChemDoodle.writeMOL(mol);
            let molecule = OCL.Molecule.fromMolfile(molfile);
            if (!molecule) {
                throw new Error('无法解析 MOL 文件');
            }

            let smiles = molecule.toSmiles();
            document.getElementById('smilesOutput').value = smiles;

            // 尝试将 SMILES 复制到剪贴板
            if (navigator.clipboard && window.isSecureContext) {
                // 使用 Clipboard API
                navigator.clipboard.writeText(smiles).then(() => {
                    showCopySuccess();
                }).catch((err) => {
                    console.error('复制到剪贴板失败:', err);
                    fallbackCopyText(smiles);
                });
            } else {
                // 使用旧的 `execCommand` 方法
                fallbackCopyText(smiles);
            }
        } catch(error) {
            console.error('详细错误:', error);
            document.getElementById('smilesOutput').value = '错误：' + error.message;
        }
    }

    function fallbackCopyText(text) {
        // 创建一个临时的 textarea 元素
        let textarea = document.createElement('textarea');
        textarea.value = text;
        // 避免页面滚动
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            let successful = document.execCommand('copy');
            if (successful) {
                showCopySuccess();
            } else {
                alert('复制失败，请手动复制 SMILES。');
            }
        } catch (err) {
            console.error('执行复制命令时出错:', err);
            alert('复制失败，请手动复制 SMILES。');
        }

        document.body.removeChild(textarea);
    }

    function showCopySuccess() {
        let exportButton = document.querySelector('.export-button');
        let originalText = exportButton.innerText;
        exportButton.innerText = '已复制!';
        exportButton.disabled = true;

        setTimeout(() => {
            exportButton.innerText = originalText;
            exportButton.disabled = false;
        }, 2000); // 2秒后恢复按钮
    }

    // 自定义工具栏功能
    function selectTool(tool) {
        sketcher.setTool(tool);
        sketcher.repaint();
    }

    function undo() {
        sketcher.undo();
        sketcher.repaint();
    }

    function redo() {
        sketcher.redo();
        sketcher.repaint();
    }

    function clearSketch() {
        sketcher.clear();
        sketcher.repaint();
    }
</script>

document.addEventListener('DOMContentLoaded', function() {
    // 自定义元素颜色
    ChemDoodle.ELEMENT['H'].jmolColor = 'black';
    ChemDoodle.ELEMENT['S'].jmolColor = '#B9A130';

    // 初始化 Sketcher 画布
    var sketcher = new ChemDoodle.SketcherCanvas('sketcher', 800, 400, {useServices:false});
    sketcher.styles.atoms_displayTerminalCarbonLabels_2D = true;
    sketcher.styles.atoms_useJMOLColors = true;
    sketcher.styles.bonds_clearOverlaps_2D = true;
    sketcher.styles.shapes_color = '#c10000';
    sketcher.repaint();

    // 导出 SMILES 并复制到剪贴板功能
    window.exportToSMILES = function() {
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

            // 复制到剪贴板
            if (navigator.clipboard && window.isSecureContext) {
                // 使用现代 Clipboard API
                navigator.clipboard.writeText(smiles).then(function() {
                    alert('SMILES 已复制到剪贴板！');
                }, function(err) {
                    console.error('复制失败: ', err);
                    fallbackCopyTextToClipboard(smiles);
                });
            } else {
                // 使用回退方法
                fallbackCopyTextToClipboard(smiles);
            }
        } catch(error) {
            console.error('详细错误:', error);
            document.getElementById('smilesOutput').value = '错误：' + error.message;
        }
    };

    // 回退的复制方法
    function fallbackCopyTextToClipboard(text) {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        // 避免页面布局变化
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
            var successful = document.execCommand('copy');
            if (successful) {
                alert('SMILES 已复制到剪贴板！');
            } else {
                throw new Error('复制命令未成功执行');
            }
        } catch (err) {
            console.error('复制失败:', err);
            alert('无法复制 SMILES。请手动复制。');
        }
        document.body.removeChild(textArea);
    }
});

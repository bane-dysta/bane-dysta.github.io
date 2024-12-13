document.addEventListener('DOMContentLoaded', function() {
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

    // 导出 SMILES 功能
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
        } catch(error) {
            console.error('详细错误:', error);
            document.getElementById('smilesOutput').value = '错误：' + error.message;
        }
    };
});

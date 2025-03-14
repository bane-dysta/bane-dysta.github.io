// 全局变量
let currentSmiles = null;
let smilesModal;

// 在文档加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化模态框
    smilesModal = new bootstrap.Modal(document.getElementById('smilesModal'));
    
    // 事件监听器设置
    document.getElementById('openSmilesButton').addEventListener('click', () => {
        document.getElementById('smilesInput').value = '';
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('structureContainer').style.display = 'none';
        document.getElementById('confirmSelectionButton').style.display = 'none';
        smilesModal.show();
    });
    
    document.getElementById('processInputButton').addEventListener('click', processInput);
    document.getElementById('confirmSelectionButton').addEventListener('click', confirmSelection);
    document.getElementById('calculateButton').addEventListener('click', calculate);
    
    // 监听分子量输入框失去焦点事件
    document.getElementById('molecularWeight').addEventListener('blur', onMolecularWeightChange);
    
    // 监听输入框键盘事件
    document.getElementById('smilesInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            processInput();
        }
    });
});

// 从CAS号获取SMILES
async function getSmilesFromCas(casNumber) {
    try {
        const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${casNumber}/property/CanonicalSMILES/JSON`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            try {
                const smiles = data.PropertyTable.Properties[0].CanonicalSMILES;
                return smiles;
            } catch (error) {
                showError("未找到该CAS号的SMILES");
                return null;
            }
        } else {
            showError("无法从PubChem获取数据");
            return null;
        }
    } catch (error) {
        showError("API请求失败: " + error.message);
        return null;
    }
}

// 计算分子量
function calculateMolecularWeight(smiles) {
    try {
        // 使用OpenChemLib计算分子量
        const molecule = OCL.Molecule.fromSmiles(smiles);
        
        // 获取MolecularFormula对象，而不是创建它
        const formula = molecule.getMolecularFormula();
        
        // 直接访问relativeWeight属性，根据文档这是一个数字属性
        const molecularWeight = formula.relativeWeight;
        return molecularWeight;
    } catch (error) {
        showError("计算分子量时出错: " + error.message);
        return null;
    }
}

// 处理SMILES或CAS号输入
async function processInput() {
    const inputValue = document.getElementById('smilesInput').value.trim();
    
    // 隐藏之前的错误信息
    document.getElementById('errorMessage').style.display = 'none';
    
    if (inputValue === '') {
        showError("请输入SMILES或CAS号");
        return;
    }
    
    let smiles;
    
    // 判断是否为CAS号
    if (/-/.test(inputValue) && inputValue.split('-').every(part => /^\d+$/.test(part))) {
        // 如果像是CAS号，从PubChem获取SMILES
        smiles = await getSmilesFromCas(inputValue);
    } else {
        // 否则假设为SMILES
        smiles = inputValue;
    }
    
    if (smiles) {
        try {
            // 使用OpenChemLib进行分子验证和显示
            const molecule = OCL.Molecule.fromSmiles(smiles);
            
            // 创建分子的SVG图像
            const svgString = molecule.toSVG(300, 200);
            
            // 显示结构
            document.getElementById('structureImage').innerHTML = svgString;
            document.getElementById('structureContainer').style.display = 'block';
            document.getElementById('confirmSelectionButton').style.display = 'block';
            
            // 保存当前SMILES以便后续使用
            currentSmiles = smiles;
        } catch (error) {
            showError("无效的SMILES，请重新输入: " + error.message);
        }
    }
}

// 确认选择分子
function confirmSelection() {
    if (currentSmiles) {
        const molecularWeight = calculateMolecularWeight(currentSmiles);
        if (molecularWeight) {
            document.getElementById('molecularWeight').value = molecularWeight.toFixed(2);
            smilesModal.hide();
        }
    }
}

// 分子量输入框变化处理
async function onMolecularWeightChange() {
    const inputValue = document.getElementById('molecularWeight').value.trim();
    
    if (inputValue === '') return;
    
    // 判断是否为数字
    if (!isNaN(inputValue)) return;
    
    // 判断是否为CAS号
    if (/-/.test(inputValue) && inputValue.split('-').every(part => /^\d+$/.test(part))) {
        const smiles = await getSmilesFromCas(inputValue);
        if (smiles) {
            const molecularWeight = calculateMolecularWeight(smiles);
            if (molecularWeight !== null) {
                document.getElementById('molecularWeight').value = molecularWeight.toFixed(2);
            }
        }
    } else {
        // 尝试作为SMILES处理
        try {
            const molecularWeight = calculateMolecularWeight(inputValue);
            if (molecularWeight !== null) {
                document.getElementById('molecularWeight').value = molecularWeight.toFixed(2);
            }
        } catch (error) {
            // 如果既不是数字也不是有效的SMILES，不做处理
        }
    }
}

// 显示错误消息
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// 显示结果
function showResult(message, isSuccess = true) {
    const resultElement = document.getElementById('resultLabel');
    resultElement.textContent = message;
    resultElement.className = isSuccess ? 'success' : 'error';
    resultElement.style.display = 'block';
}

// 计算函数
function calculate() {
    try {
        const molecularWeight = parseFloat(document.getElementById('molecularWeight').value);
        const concentration = parseFloat(document.getElementById('concentration').value);
        
        if (isNaN(molecularWeight) || molecularWeight <= 0) {
            showResult("请输入有效的分子量", false);
            return;
        }
        
        if (isNaN(concentration) || concentration <= 0) {
            showResult("请输入有效的浓度", false);
            return;
        }
        
        // 转换浓度单位到 mol/L
        const concentrationUnit = document.getElementById('concentrationUnit').value;
        let concentrationMol;
        
        if (concentrationUnit === "mmol/L") {
            concentrationMol = concentration / 1000;
        } else if (concentrationUnit === "mol/L") {
            concentrationMol = concentration;
        } else {
            // g/L转换为mol/L
            concentrationMol = concentration / molecularWeight;
        }
        
        const massInput = document.getElementById('mass').value.trim();
        const volumeInput = document.getElementById('volume').value.trim();
        
        if (massInput && !volumeInput) {
            // 已知质量，计算体积
            let mass = parseFloat(massInput);
            if (isNaN(mass) || mass <= 0) {
                showResult("请输入有效的质量", false);
                return;
            }
            
            // 根据质量单位转换
            const massUnit = document.getElementById('massUnit').value;
            if (massUnit === "mg") {
                mass = mass / 1000; // mg to g
            }
            
            const volume = mass / (concentrationMol * molecularWeight);
            let volumeMl = volume * 1000; // 转换为 mL
            
            const volumeUnit = document.getElementById('volumeUnit').value;
            if (volumeUnit === "L") {
                volumeMl /= 1000;
            }
            
            document.getElementById('volume').value = volumeMl.toFixed(2);
            showResult(`计算的体积: ${volumeMl.toFixed(2)} ${volumeUnit}`);
            
        } else if (volumeInput && !massInput) {
            // 已知体积，计算质量
            let volumeMl = parseFloat(volumeInput);
            if (isNaN(volumeMl) || volumeMl <= 0) {
                showResult("请输入有效的体积", false);
                return;
            }
            
            const volumeUnit = document.getElementById('volumeUnit').value;
            if (volumeUnit === "L") {
                volumeMl *= 1000; // L to mL
            }
            
            const volume = volumeMl / 1000; // mL to L
            let mass = concentrationMol * molecularWeight * volume;
            
            const massUnit = document.getElementById('massUnit').value;
            if (massUnit === "mg") {
                mass *= 1000; // g to mg
            }
            
            document.getElementById('mass').value = mass.toFixed(4);
            showResult(`计算的质量: ${mass.toFixed(4)} ${massUnit}`);
            
        } else if (massInput && volumeInput) {
            showResult("请只填写质量或体积中的一个", false);
        } else {
            showResult("请填写质量或体积中的一个", false);
        }
        
    } catch (error) {
        showResult("计算出错: " + error.message, false);
    }
}
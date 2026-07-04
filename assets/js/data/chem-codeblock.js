(function () {
  'use strict';

  var counter = 0;

  function hasChemDoodle() {
    /* ChemDoodleWeb.js defines `let ChemDoodle` in the global lexical scope.
       That is available as the bare identifier `ChemDoodle`, but not as
       `window.ChemDoodle` in modern browsers. */
    return typeof ChemDoodle !== 'undefined' && !!ChemDoodle && !!ChemDoodle.structures;
  }

  function hasOpenChemLib() {
    return typeof OCL !== 'undefined' && !!OCL && !!OCL.Molecule;
  }

  function normalizeText(raw) {
    return String(raw || '')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n+$/, '');
  }

  function normalizeElementSymbol(rawSymbol) {
    if (!rawSymbol) return null;

    if (typeof window !== 'undefined' && window.XYZBondsLite && typeof window.XYZBondsLite.normalizeElement === 'function') {
      var normalizedByLite = window.XYZBondsLite.normalizeElement(rawSymbol);
      if (normalizedByLite && hasChemDoodle() && ChemDoodle.ELEMENT && ChemDoodle.ELEMENT[normalizedByLite]) {
        return normalizedByLite;
      }
    }

    var lettersOnly = String(rawSymbol).replace(/[^A-Za-z]/g, '');
    if (!lettersOnly) return null;

    var normalized = lettersOnly.charAt(0).toUpperCase() + lettersOnly.slice(1).toLowerCase();
    if (hasChemDoodle() && ChemDoodle.ELEMENT && ChemDoodle.ELEMENT[normalized]) {
      return normalized;
    }
    return null;
  }

  function parseCountsLine(line) {
    if (!line) return null;

    var atomFixed = parseInt(line.slice(0, 3), 10);
    var bondFixed = parseInt(line.slice(3, 6), 10);
    if (Number.isInteger(atomFixed) && Number.isInteger(bondFixed) && atomFixed > 0 && bondFixed >= 0) {
      return { atomCount: atomFixed, bondCount: bondFixed };
    }

    var spaced = line.match(/^\s*(\d{1,3})\s+(\d{1,3})(?:\s|$)/);
    if (spaced) {
      return { atomCount: parseInt(spaced[1], 10), bondCount: parseInt(spaced[2], 10) };
    }

    var compact = line.match(/^\s*(\d{1,3})(\d{3})(?:\s|$)/);
    if (compact) {
      return { atomCount: parseInt(compact[1], 10), bondCount: parseInt(compact[2], 10) };
    }

    return null;
  }

  function parseMolAtomLine(line) {
    if (!line) return null;

    var x = parseFloat(line.slice(0, 10));
    var y = parseFloat(line.slice(10, 20));
    var z = parseFloat(line.slice(20, 30));
    var element = normalizeElementSymbol(line.slice(31, 34).trim());

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !element) {
      var parts = line.trim().split(/\s+/);
      if (parts.length < 4) return null;
      x = parseFloat(parts[0]);
      y = parseFloat(parts[1]);
      z = parseFloat(parts[2]);
      element = normalizeElementSymbol(parts[3]);
    }

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !element) return null;
    return { x: x, y: y, z: z, element: element };
  }

  function parseMolBondLine(line) {
    if (!line) return null;

    var beginIndex = parseInt(line.slice(0, 3), 10) - 1;
    var endIndex = parseInt(line.slice(3, 6), 10) - 1;
    var order = parseInt(line.slice(6, 9), 10);

    if (!Number.isInteger(beginIndex) || !Number.isInteger(endIndex)) {
      var parts = line.trim().split(/\s+/);
      if (parts.length < 3) return null;
      beginIndex = parseInt(parts[0], 10) - 1;
      endIndex = parseInt(parts[1], 10) - 1;
      order = parseInt(parts[2], 10);
    }

    if (!Number.isInteger(beginIndex) || !Number.isInteger(endIndex)) return null;
    return { beginIndex: beginIndex, endIndex: endIndex, order: Number.isInteger(order) ? order : 1 };
  }

  function molBlockLooksParseable(lines, countsIndex, counts) {
    if (!counts || counts.atomCount <= 0 || counts.bondCount < 0) return false;
    if (countsIndex + 1 + counts.atomCount + counts.bondCount > lines.length) return false;

    for (var a = 0; a < counts.atomCount; a++) {
      if (!parseMolAtomLine(lines[countsIndex + 1 + a])) return false;
    }

    for (var b = 0; b < counts.bondCount; b++) {
      if (!parseMolBondLine(lines[countsIndex + 1 + counts.atomCount + b])) return false;
    }

    return true;
  }

  function findCountsLine(lines) {
    var preferred = [3, 4, 2];
    for (var p = 0; p < preferred.length; p++) {
      var idx = preferred[p];
      if (idx < lines.length) {
        var counts = parseCountsLine(lines[idx]);
        if (molBlockLooksParseable(lines, idx, counts)) return { index: idx, counts: counts };
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var detected = parseCountsLine(lines[i]);
      if (molBlockLooksParseable(lines, i, detected)) return { index: i, counts: detected };
    }

    return null;
  }

  function tryChemDoodleReadMOL(molData) {
    try {
      var molecule = ChemDoodle.readMOL(molData);
      if (molecule && molecule.atoms && molecule.atoms.length > 0) return molecule;
    } catch (err) {
      console.warn('ChemDoodle.readMOL failed, using fallback parser:', err);
    }
    return null;
  }

  function parseMolWithFallback(rawMol, options) {
    var molData = normalizeText(rawMol);
    if (!molData) return null;

    var molecule = tryChemDoodleReadMOL(molData);
    if (molecule) return molecule;

    var lines = molData.split('\n');
    var located = findCountsLine(lines);
    if (!located) return null;

    options = options || {};
    var coordinateScale = Number.isFinite(options.coordinateScale) ? options.coordinateScale : 1;
    var flipY = !!options.flipY;

    var countsIndex = located.index;
    var atomCount = located.counts.atomCount;
    var bondCount = located.counts.bondCount;
    var parsed = new ChemDoodle.structures.Molecule();

    for (var a = 0; a < atomCount; a++) {
      var atom = parseMolAtomLine(lines[countsIndex + 1 + a]);
      if (!atom) return null;
      parsed.atoms.push(new ChemDoodle.structures.Atom(
        atom.element,
        atom.x * coordinateScale,
        (flipY ? -atom.y : atom.y) * coordinateScale,
        atom.z * coordinateScale
      ));
    }

    for (var b = 0; b < bondCount; b++) {
      var bond = parseMolBondLine(lines[countsIndex + 1 + atomCount + b]);
      if (!bond || !parsed.atoms[bond.beginIndex] || !parsed.atoms[bond.endIndex]) return null;
      parsed.bonds.push(new ChemDoodle.structures.Bond(parsed.atoms[bond.beginIndex], parsed.atoms[bond.endIndex], bond.order));
    }

    return parsed.atoms.length > 0 ? parsed : null;
  }

  function extractXYZAtoms(rawXYZ) {
    var xyzData = normalizeText(rawXYZ).trim();
    if (!xyzData) return null;

    var allLines = xyzData.split('\n');
    var lines = [];
    for (var i = 0; i < allLines.length; i++) {
      var line = allLines[i].trim();
      if (!line || line.charAt(0) === '#') continue;
      lines.push(line);
    }

    if (!lines.length) return null;

    var hasCountHeader = /^\d+\s*$/.test(lines[0]);
    var expectedCount = hasCountHeader ? parseInt(lines[0], 10) : lines.length;
    var start = hasCountHeader ? 2 : 0;
    var end = hasCountHeader ? Math.min(start + expectedCount, lines.length) : lines.length;
    var atoms = [];

    for (var j = start; j < end; j++) {
      var parts = lines[j].trim().split(/\s+/);
      if (parts.length < 4) continue;

      var element = normalizeElementSymbol(parts[0]);
      var x = parseFloat(parts[1]);
      var y = parseFloat(parts[2]);
      var z = parseFloat(parts[3]);

      if (!element || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        console.warn('Skipping invalid XYZ atom line:', lines[j]);
        continue;
      }

      atoms.push({ element: element, x: x, y: y, z: z });
    }

    return atoms.length ? atoms : null;
  }

  function extractXYZAtomLines(rawXYZ) {
    var atoms = extractXYZAtoms(rawXYZ);
    if (!atoms || !atoms.length) return null;
    return atoms.map(function (atom) {
      return atom.element + ' ' + atom.x + ' ' + atom.y + ' ' + atom.z;
    });
  }

  function makeStandardXYZ(rawXYZ) {
    var atoms = extractXYZAtomLines(rawXYZ);
    if (!atoms || !atoms.length) return null;
    return String(atoms.length) + '\nGenerated by chem-codeblock.js\n' + atoms.join('\n');
  }

  function scaleMoleculeCoordinates(molecule, scale) {
    if (!molecule || !molecule.atoms || !Number.isFinite(scale) || scale === 1) return molecule;
    for (var i = 0; i < molecule.atoms.length; i++) {
      molecule.atoms[i].x *= scale;
      molecule.atoms[i].y *= scale;
      molecule.atoms[i].z *= scale;
    }
    return molecule;
  }

  function deduceCovalentBonds(molecule, bondMaxDistance) {
    if (!molecule || !molecule.atoms || molecule.bonds.length) return molecule;

    if (ChemDoodle.informatics && ChemDoodle.informatics.BondDeducer) {
      try {
        new ChemDoodle.informatics.BondDeducer().deduceCovalentBonds(
          molecule,
          Number.isFinite(bondMaxDistance) ? bondMaxDistance : 1
        );
        return molecule;
      } catch (err) {
        console.warn('ChemDoodle BondDeducer failed for XYZ source:', err);
      }
    }

    return molecule;
  }

  function applyXYZBonds(molecule, sourceAtoms, options) {
    if (!molecule || !molecule.atoms || !molecule.atoms.length) return molecule;

    options = options || {};
    var bondMode = String(options.bondMode || 'lite').toLowerCase();

    if (bondMode === 'none' || bondMode === 'off' || bondMode === 'false') {
      molecule.bonds = [];
      return molecule;
    }

    if (bondMode !== 'chemdoodle' && typeof window !== 'undefined' && window.XYZBondsLite && typeof window.XYZBondsLite.applyToMolecule === 'function') {
      return window.XYZBondsLite.applyToMolecule(molecule, sourceAtoms, ChemDoodle, {
        mode: 'lite',
        scale: options.bondScale,
        tolerance: options.bondTolerance,
        pruneByMaxNeighbors: options.pruneByMaxNeighbors
      });
    }

    molecule.bonds = [];
    return deduceCovalentBonds(molecule, options.bondMaxDistance);
  }

  function parseXYZ(rawXYZ, options) {
    options = options || {};
    var atoms = extractXYZAtoms(rawXYZ);
    if (!atoms || !atoms.length) return null;

    var molecule = new ChemDoodle.structures.Molecule();
    for (var i = 0; i < atoms.length; i++) {
      var atom = atoms[i];
      molecule.atoms.push(new ChemDoodle.structures.Atom(atom.element, atom.x, atom.y, atom.z));
    }

    applyXYZBonds(molecule, atoms, options);
    if (!molecule || !molecule.atoms || !molecule.atoms.length) return null;

    /* XYZ coordinates are normally in Angstrom. MOL files read through this
       ChemDoodle build are effectively much larger on the canvas, so scale XYZ
       after bond deduction to make atom_diameter_3d=8 and bond_diameter_3d=1
       behave consistently with your MOL examples. */
    scaleMoleculeCoordinates(molecule, Number.isFinite(options.coordinateScale) ? options.coordinateScale : 1);
    return molecule;
  }

  function getLanguage(node) {
    var candidates = [];
    if (node) candidates.push(node);
    if (node && node.parentElement) candidates.push(node.parentElement);
    var root = getCodeRoot(node);
    if (root) candidates.push(root);

    for (var i = 0; i < candidates.length; i++) {
      var cls = candidates[i].className || '';
      var match = String(cls).match(/(?:^|\s)language-(xyz|mol|sdf|smiles|smi)(?:\s|$)/i);
      if (match) return match[1].toLowerCase();
    }
    return null;
  }

  function getCodeRoot(code) {
    if (!code) return null;
    return code.closest('.highlighter-rouge, figure.highlight, div.highlight, pre') || code.parentElement;
  }

  function getChemOptions() {
    return typeof window !== 'undefined' ? window.ChemRenderOptions : null;
  }

  function getParams(code, root) {
    var options = getChemOptions();
    if (!options || typeof options.fromAttributes !== 'function') {
      console.error('ChemRenderOptions is not loaded; cannot resolve molecule code block parameters.');
      return null;
    }

    var highlight = root && root.querySelector ? root.querySelector('.highlight, pre, code') : null;
    var nodes = [code, root, highlight, code && code.parentElement].filter(Boolean);
    return options.fromAttributes(nodes, { profile: 'codeblock' });
  }

  function createCanvasElement(root, params) {
    counter += 1;
    var id = 'chem_codeblock_' + Date.now() + '_' + counter + '_' + Math.floor(Math.random() * 10000);

    var outer = document.createElement('div');
    outer.className = 'molecule-container chem-codeblock-rendered';
    outer.setAttribute('data-chem-codeblock', 'true');

    var inner = document.createElement('div');
    inner.className = 'canvas-container';

    var canvasEl = document.createElement('canvas');
    canvasEl.id = id;
    canvasEl.width = params.width;
    canvasEl.height = params.height;

    inner.appendChild(canvasEl);
    outer.appendChild(inner);

    root.parentNode.insertBefore(outer, root);
    if (params.replace) {
      root.remove();
    } else {
      root.setAttribute('data-chem-source-kept', 'true');
    }

    return id;
  }

  function buildMolecule(language, source, mode, params) {
    if (language === 'xyz') {
      return parseXYZ(source, {
        coordinateScale: mode === '3d' ? params.xyzCoordinateScale3D : 1,
        bondMode: params.bondMode,
        bondScale: params.bondScale,
        bondTolerance: params.bondTolerance,
        bondMaxDistance: params.bondMaxDistance
      });
    }

    if (language === 'mol' || language === 'sdf') {
      return parseMolWithFallback(source, {
        coordinateScale: mode === '3d' ? params.molCoordinateScale3D : 1,
        flipY: mode === '3d'
      });
    }

    if (language === 'smiles' || language === 'smi') {
      var smiles = normalizeText(source).trim().split(/\s+/)[0];
      if (!smiles || !hasOpenChemLib()) return null;
      var molfile = OCL.Molecule.fromSmiles(smiles).toMolfile();
      return ChemDoodle.readMOL(molfile);
    }

    return null;
  }

  function applyInitial3DScale(canvas, initialScale3D) {
    if (Number.isFinite(initialScale3D) && initialScale3D > 0 && canvas.camera) {
      canvas.camera.zoom = 1 / initialScale3D;
      if (typeof canvas.updateScene === 'function') {
        canvas.updateScene();
      } else {
        canvas.repaint();
      }
    }
  }

  function render2D(id, language, source, params) {
    var canvas = new ChemDoodle.ViewerCanvas(id, params.width, params.height);
    canvas.styles.bonds_width_2D = 0.6;
    canvas.styles.bonds_saturationWidthAbs_2D = 2.6;
    canvas.styles.atoms_font_size_2D = 10;

    var molecule = buildMolecule(language, source, '2d', params);
    if (!molecule || !molecule.atoms || !molecule.atoms.length) return false;

    if (typeof molecule.scaleToAverageBondLength === 'function') {
      molecule.scaleToAverageBondLength(params.scale2D);
    }
    canvas.loadMolecule(molecule);
    return true;
  }

  function render3D(id, language, source, params) {
    var options = getChemOptions();
    if (!options) return false;

    var canvas = new ChemDoodle.TransformCanvas3D(id, params.width, params.height);
    canvas.styles.set3DRepresentation(params.representation);
    canvas.styles.backgroundColor = params.bgcolor;
    canvas.styles.atoms_useVDWDiameters_3D = options.resolveUseVDW3D(params.useVDW3D, params.representation);
    canvas.styles.atoms_vdwMultiplier_3D = options.resolveVDWMultiplier3D(params.vdwMultiplier3D, params.atomDiameter3D);
    canvas.styles.atoms_sphereDiameter_3D = params.atomDiameter3D;
    canvas.styles.bonds_cylinderDiameter_3D = params.bondDiameter3D;

    var molecule = buildMolecule(language, source, '3d', params);
    if (!molecule || !molecule.atoms || !molecule.atoms.length) return false;

    canvas.loadMolecule(molecule);
    applyInitial3DScale(canvas, params.initialScale3D);
    return true;
  }

  function renderChemCodeBlock(code) {
    var language = getLanguage(code);
    if (!language) return;

    var root = getCodeRoot(code);
    if (!root || root.getAttribute('data-chem-rendered') === 'true') return;
    root.setAttribute('data-chem-rendered', 'true');

    var params = getParams(code, root);
    if (!params) return;

    var source = code.textContent || '';
    var id = createCanvasElement(root, params);
    var ok = params.mode === '2d'
      ? render2D(id, language, source, params)
      : render3D(id, language, source, params);

    if (!ok) {
      console.error('Failed to render molecule code block:', { language: language, source: source });
      var canvas = document.getElementById(id);
      var container = canvas && canvas.closest('.molecule-container');
      if (container) container.remove();
      if (params.replace) root.style.display = '';
    }
  }

  function findChemCodeBlocks() {
    var selectors = [
      'code.language-xyz',
      'code.language-mol',
      'code.language-sdf',
      'code.language-smiles',
      'code.language-smi',
      '.language-xyz code',
      '.language-mol code',
      '.language-sdf code',
      '.language-smiles code',
      '.language-smi code'
    ];

    var nodes = Array.prototype.slice.call(document.querySelectorAll(selectors.join(',')));
    var unique = [];
    var seen = new Set();

    nodes.forEach(function (node) {
      var code = node.tagName && node.tagName.toLowerCase() === 'code' ? node : node.querySelector('code');
      if (!code || seen.has(code)) return;
      seen.add(code);
      unique.push(code);
    });

    return unique;
  }

  function renderAllChemCodeBlocks(attempt) {
    attempt = attempt || 0;

    if (!hasChemDoodle()) {
      /* Usually this is only because ChemDoodleWeb.js created a global lexical
         binding instead of window.ChemDoodle. If the script is still loading,
         wait briefly instead of permanently skipping code blocks. */
      if (attempt < 50) {
        window.setTimeout(function () {
          renderAllChemCodeBlocks(attempt + 1);
        }, 100);
        return;
      }

      console.error('ChemDoodle is not loaded; cannot render molecule code blocks.');
      return;
    }

    findChemCodeBlocks().forEach(renderChemCodeBlock);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderAllChemCodeBlocks(0);
    });
  } else {
    renderAllChemCodeBlocks(0);
  }
})();

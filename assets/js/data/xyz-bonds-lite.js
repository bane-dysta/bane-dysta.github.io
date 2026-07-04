(function (root) {
  'use strict';

  var VERSION = '0.1.0';

  /* Cordero covalent radii, Å. Keep this table small enough for static pages,
     but broad enough for common organic molecules and simple coordination examples. */
  var RADII = {
    H: 0.31, He: 0.28,
    Li: 1.28, Be: 0.96, B: 0.84, C: 0.76, N: 0.71, O: 0.66, F: 0.57, Ne: 0.58,
    Na: 1.66, Mg: 1.41, Al: 1.21, Si: 1.11, P: 1.07, S: 1.05, Cl: 1.02, Ar: 1.06,
    K: 2.03, Ca: 1.76, Sc: 1.70, Ti: 1.60, V: 1.53, Cr: 1.39, Mn: 1.39,
    Fe: 1.32, Co: 1.26, Ni: 1.24, Cu: 1.32, Zn: 1.22,
    Ga: 1.22, Ge: 1.20, As: 1.19, Se: 1.20, Br: 1.20, Kr: 1.16,
    Rb: 2.20, Sr: 1.95, Y: 1.90, Zr: 1.75, Nb: 1.64, Mo: 1.54, Tc: 1.47,
    Ru: 1.46, Rh: 1.42, Pd: 1.39, Ag: 1.45, Cd: 1.44,
    In: 1.42, Sn: 1.39, Sb: 1.39, Te: 1.38, I: 1.39, Xe: 1.40,
    Cs: 2.44, Ba: 2.15,
    Hf: 1.75, Ta: 1.70, W: 1.62, Re: 1.51, Os: 1.44, Ir: 1.41, Pt: 1.36, Au: 1.36, Hg: 1.32,
    Tl: 1.45, Pb: 1.46, Bi: 1.48
  };

  var ELEMENTS_BY_ATOMIC_NUMBER = [
    null,
    'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
    'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar',
    'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
    'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
    'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd',
    'In', 'Sn', 'Sb', 'Te', 'I', 'Xe',
    'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy',
    'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt',
    'Au', 'Hg', 'Tl', 'Pb', 'Bi'
  ];

  var MAX_NEIGHBORS = {
    H: 1, F: 1, Cl: 1, Br: 1, I: 1,
    B: 4, C: 4, N: 3, O: 2,
    Si: 4, P: 5, S: 6,
    Li: 1, Na: 1, K: 1,
    Mg: 6, Ca: 8,
    Fe: 8, Co: 8, Ni: 8, Cu: 8, Zn: 8,
    Ru: 8, Rh: 8, Pd: 8, Ag: 8, Cd: 8,
    Ir: 8, Pt: 8, Au: 8, Hg: 8
  };
  var SPECIAL_CUTOFFS = {
    'H-H': 0.85,
    'C-H': 1.20,
    'H-N': 1.15,
    'H-O': 1.10,
    'C-C': 1.64,
    'C-N': 1.60,
    'C-O': 1.55,
    'N-N': 1.55,
    'N-O': 1.56,
    'O-O': 1.58
  };

  function pairKey(a, b) {
    return a < b ? a + '-' + b : b + '-' + a;
  }


  function finiteNumber(value, fallback) {
    var parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeElement(raw) {
    if (raw === null || raw === undefined) return null;

    var text = String(raw).trim();
    if (!text) return null;

    if (/^\d+$/.test(text)) {
      var atomicNumber = parseInt(text, 10);
      return ELEMENTS_BY_ATOMIC_NUMBER[atomicNumber] || null;
    }

    text = text.replace(/[^A-Za-z]/g, '');
    if (!text) return null;

    var normalized = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    return RADII[normalized] ? normalized : null;
  }

  function radiusOf(element) {
    var normalized = normalizeElement(element);
    return normalized ? RADII[normalized] || null : null;
  }

  function maxNeighbors(element, fallback) {
    var normalized = normalizeElement(element);
    if (!normalized) return 0;
    if (Object.prototype.hasOwnProperty.call(MAX_NEIGHBORS, normalized)) {
      return MAX_NEIGHBORS[normalized];
    }
    return Number.isFinite(fallback) ? fallback : 8;
  }

  function distance3D(a, b) {
    var dx = finiteNumber(a.x, NaN) - finiteNumber(b.x, NaN);
    var dy = finiteNumber(a.y, NaN) - finiteNumber(b.y, NaN);
    var dz = finiteNumber(a.z, NaN) - finiteNumber(b.z, NaN);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function getElement(atom) {
    return atom && (atom.element || atom.label || atom.symbol || atom.elem);
  }

  function perceiveBonds(atoms, options) {
    options = options || {};
    var mode = String(options.mode || 'lite').toLowerCase();
    if (mode === 'none' || mode === 'off' || mode === 'false') return [];

    if (!atoms || !atoms.length) return [];

    var scale = finiteNumber(options.scale, 1.0);
    var tolerance = finiteNumber(options.tolerance, 0.02);
    var fallbackScale = finiteNumber(options.fallbackScale, 1.10);
    var defaultMaxNeighbors = finiteNumber(options.defaultMaxNeighbors, 8);
    var pruneByMaxNeighbors = options.pruneByMaxNeighbors !== false;
    var candidates = [];
    var degrees = [];

    for (var i = 0; i < atoms.length; i++) {
      degrees[i] = 0;
    }

    for (var a = 0; a < atoms.length; a++) {
      var elementA = normalizeElement(getElement(atoms[a]));
      var radiusA = radiusOf(elementA);
      if (!elementA || !radiusA) continue;

      for (var b = a + 1; b < atoms.length; b++) {
        var elementB = normalizeElement(getElement(atoms[b]));
        var radiusB = radiusOf(elementB);
        if (!elementB || !radiusB) continue;

        var distance = distance3D(atoms[a], atoms[b]);
        if (!Number.isFinite(distance) || distance <= 0) continue;

        var radiusSum = radiusA + radiusB;
        var specialCutoff = SPECIAL_CUTOFFS[pairKey(elementA, elementB)];
        var cutoff = (Number.isFinite(specialCutoff) ? specialCutoff : radiusSum * fallbackScale) * scale + tolerance;
        if (distance <= cutoff) {
          candidates.push({
            i: a,
            j: b,
            distance: distance,
            score: distance / radiusSum
          });
        }
      }
    }

    candidates.sort(function (lhs, rhs) {
      if (lhs.score !== rhs.score) return lhs.score - rhs.score;
      if (lhs.distance !== rhs.distance) return lhs.distance - rhs.distance;
      if (lhs.i !== rhs.i) return lhs.i - rhs.i;
      return lhs.j - rhs.j;
    });

    var bonds = [];
    for (var c = 0; c < candidates.length; c++) {
      var candidate = candidates[c];
      if (pruneByMaxNeighbors) {
        var maxI = maxNeighbors(getElement(atoms[candidate.i]), defaultMaxNeighbors);
        var maxJ = maxNeighbors(getElement(atoms[candidate.j]), defaultMaxNeighbors);
        if (degrees[candidate.i] >= maxI || degrees[candidate.j] >= maxJ) continue;
      }

      bonds.push({ i: candidate.i, j: candidate.j, order: 1, distance: candidate.distance });
      degrees[candidate.i] += 1;
      degrees[candidate.j] += 1;
    }

    return bonds;
  }

  function applyToMolecule(molecule, sourceAtoms, ChemDoodleRef, options) {
    if (!molecule || !molecule.atoms || !molecule.atoms.length) return molecule;
    options = options || {};

    var mode = String(options.mode || 'lite').toLowerCase();
    if (mode === 'none' || mode === 'off' || mode === 'false') {
      molecule.bonds = [];
      return molecule;
    }

    if (!ChemDoodleRef || !ChemDoodleRef.structures || !ChemDoodleRef.structures.Bond) {
      return molecule;
    }

    var atomsForDetection = sourceAtoms && sourceAtoms.length === molecule.atoms.length ? sourceAtoms : molecule.atoms;
    var bonds = perceiveBonds(atomsForDetection, options);
    molecule.bonds = [];

    for (var i = 0; i < bonds.length; i++) {
      var bond = bonds[i];
      if (!molecule.atoms[bond.i] || !molecule.atoms[bond.j]) continue;
      molecule.bonds.push(new ChemDoodleRef.structures.Bond(molecule.atoms[bond.i], molecule.atoms[bond.j], bond.order || 1));
    }

    return molecule;
  }

  root.XYZBondsLite = {
    version: VERSION,
    normalizeElement: normalizeElement,
    radiusOf: radiusOf,
    maxNeighbors: maxNeighbors,
    pairKey: pairKey,
    distance3D: distance3D,
    perceiveBonds: perceiveBonds,
    applyToMolecule: applyToMolecule
  };
})(typeof window !== 'undefined' ? window : this);

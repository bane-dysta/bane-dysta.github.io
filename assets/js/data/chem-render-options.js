---
---
(function (root) {
  'use strict';

  var CONFIG = {{ site.data.chem_render_params | jsonify }};
  var DEFAULTS = CONFIG.defaults || {};
  var PROFILES = CONFIG.profiles || {};
  var PARAMS = CONFIG.params || [];

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }

  function isSet(value) {
    return value !== null && value !== undefined && value !== '';
  }

  function copyObject(object) {
    var result = {};
    Object.keys(object || {}).forEach(function (key) {
      result[key] = object[key];
    });
    return result;
  }

  function camelToSnake(name) {
    return String(name || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/__+/g, '_')
      .toLowerCase();
  }

  function snakeToKebab(name) {
    return String(name || '').replace(/_/g, '-');
  }

  function pushUnique(list, value) {
    if (!value && value !== 0) return;
    value = String(value);
    if (list.indexOf(value) === -1) list.push(value);
  }

  function specNames(spec) {
    var names = [];
    pushUnique(names, spec.key);
    pushUnique(names, spec.liquid_key);

    var snake = camelToSnake(spec.key);
    pushUnique(names, snake);
    pushUnique(names, snakeToKebab(snake));

    (spec.attr_aliases || []).forEach(function (alias) {
      pushUnique(names, alias);
    });

    return names;
  }

  function attrNames(spec) {
    var expanded = [];
    specNames(spec).forEach(function (name) {
      var normalized = String(name);
      var kebab = snakeToKebab(camelToSnake(normalized));
      pushUnique(expanded, normalized);
      pushUnique(expanded, kebab);
      pushUnique(expanded, 'data-' + normalized);
      pushUnique(expanded, 'data-' + kebab);
    });
    return expanded;
  }

  function defaultFor(key, profile) {
    var value = DEFAULTS[key];
    var profileDefaults = profile && PROFILES[profile] ? PROFILES[profile] : null;
    if (profileDefaults && hasOwn(profileDefaults, key)) {
      value = profileDefaults[key];
    }
    return value;
  }

  function finiteNumber(value, fallback) {
    var parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function parseBooleanOption(value, fallback) {
    if (value === true || value === false) return value;
    if (!isSet(value)) return fallback;

    var normalized = String(value).trim().toLowerCase();
    if (/^(true|1|yes|y|on)$/.test(normalized)) return true;
    if (/^(false|0|no|n|off)$/.test(normalized)) return false;
    return fallback;
  }

  function coerceValue(value, spec, fallback) {
    var effective = isSet(value) ? value : fallback;

    if (spec.type === 'number') {
      return finiteNumber(effective, fallback);
    }

    if (spec.type === 'boolean') {
      return parseBooleanOption(effective, !!fallback);
    }

    var text = String(isSet(effective) ? effective : '');
    return spec.lowercase ? text.toLowerCase() : text;
  }

  function readObjectValue(object, spec) {
    if (!object) return undefined;
    var names = specNames(spec);
    for (var i = 0; i < names.length; i++) {
      if (hasOwn(object, names[i]) && isSet(object[names[i]])) {
        return object[names[i]];
      }
    }
    return undefined;
  }

  function readAttr(nodes, names) {
    nodes = nodes || [];
    names = Array.isArray(names) ? names : [names];

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node || !node.getAttribute) continue;
      for (var j = 0; j < names.length; j++) {
        var value = node.getAttribute(names[j]);
        if (isSet(value)) return value;
      }
    }

    return undefined;
  }

  function normalize(raw, options) {
    options = options || {};
    raw = raw || {};

    var profile = options.profile || '';
    var result = {};

    PARAMS.forEach(function (spec) {
      var fallback = defaultFor(spec.key, profile);
      result[spec.key] = coerceValue(readObjectValue(raw, spec), spec, fallback);
    });

    return result;
  }

  function fromObject(raw, options) {
    return normalize(raw, options);
  }

  function fromAttributes(nodes, options) {
    options = options || {};
    var raw = {};

    PARAMS.forEach(function (spec) {
      var value = readAttr(nodes, attrNames(spec));
      if (isSet(value)) raw[spec.key] = value;
    });

    return normalize(raw, options);
  }

  function representationUsesVDWByDefault(representation) {
    var normalized = String(representation || '').trim().toLowerCase();
    return normalized === 'ball and stick' || normalized === 'van der waals spheres';
  }

  function resolveUseVDW3D(value, representation) {
    var normalized = String(value === null || value === undefined ? 'auto' : value).trim().toLowerCase();
    var fallback = representationUsesVDWByDefault(representation);
    if (!normalized || normalized === 'auto' || normalized === '__auto__') return fallback;
    return parseBooleanOption(value, fallback);
  }

  function resolveVDWMultiplier3D(value, atomDiameter3D) {
    var parsed = parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;

    /* Preserve roughly the old fixed-size carbon atom while using element-specific
       van der Waals ratios: radius = atom_diameter_3d / 2, C vdW ~= 1.70 Å. */
    var diameter = finiteNumber(atomDiameter3D, defaultFor('atomDiameter3D'));
    return Math.max(diameter / (2 * 1.70), 0.05);
  }

  root.ChemRenderOptions = {
    config: CONFIG,
    defaults: copyObject(DEFAULTS),
    profiles: copyObject(PROFILES),
    params: PARAMS.slice(),
    finiteNumber: finiteNumber,
    parseBooleanOption: parseBooleanOption,
    readAttr: readAttr,
    fromObject: fromObject,
    fromAttributes: fromAttributes,
    representationUsesVDWByDefault: representationUsesVDWByDefault,
    resolveUseVDW3D: resolveUseVDW3D,
    resolveVDWMultiplier3D: resolveVDWMultiplier3D
  };
})(typeof window !== 'undefined' ? window : this);

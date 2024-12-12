//
// ChemDoodle Web Components 10.0.0
//
// https://web.chemdoodle.com
//
// Copyright 2009-2024 iChemLabs, LLC.  All rights reserved.
//
// The ChemDoodle Web Components library is licensed under version 3
// of the GNU GENERAL PUBLIC LICENSE.
//
// You may redistribute it and/or modify it under the terms of the
// GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// Please contact iChemLabs <https://www.ichemlabs.com/contact-us> for
// alternate licensing options.
//

// google closure fails if undefined is provided to this module... but it is not needed so whatever...
let ChemDoodle = (function() {
	'use strict';
	let c = {};

	c.iChemLabs = {};
	c.informatics = {};
	c.io = {};
	c.lib = {};
	c.notations = {};
	c.structures = {PID:0};
	c.structures.d2 = {};
	c.structures.d3 = {};

	let VERSION = '10.0.0';

	c.getVersion = function() {
		return VERSION;
	};

	return c;

})();
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations for WebGL
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 1.3.7
 */

/*
 * Copyright (c) 2012 Brandon Jones, Colin MacKenzie IV
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

// Updated to use a modification of the "returnExportsGlobal" pattern from https://github.com/umdjs/umd

(function (root, factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(global);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            return factory(root);
        });
    } else {
        // Browser globals
        factory(root);
    }
}(ChemDoodle.lib, function (root) {
    "use strict";

    // Tweak to your liking
    var FLOAT_EPSILON = 0.000001;

    var glMath = {};
    (function() {
        if (typeof(Float32Array) != 'undefined') {
            var y = new Float32Array(1);
            var i = new Int32Array(y.buffer);

            /**
             * Fast way to calculate the inverse square root,
             * see http://jsperf.com/inverse-square-root/5
             *
             * If typed arrays are not available, a slower
             * implementation will be used.
             *
             * @param {Number} number the number
             * @returns {Number} Inverse square root
             */
            glMath.invsqrt = function(number) {
              var x2 = number * 0.5;
              y[0] = number;
              var threehalfs = 1.5;

              i[0] = 0x5f3759df - (i[0] >> 1);

              var number2 = y[0];

              return number2 * (threehalfs - (x2 * number2 * number2));
            };
        } else {
            glMath.invsqrt = function(number) { return 1.0 / Math.sqrt(number); };
        }
    })();

    /**
     * @class System-specific optimal array type
     * @name MatrixArray
     */
    var MatrixArray = null;
    
    // explicitly sets and returns the type of array to use within glMatrix
    function setMatrixArrayType(type) {
        MatrixArray = type;
        return MatrixArray;
    }

    // auto-detects and returns the best type of array to use within glMatrix, falling
    // back to Array if typed arrays are unsupported
    function determineMatrixArrayType() {
        MatrixArray = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
        return MatrixArray;
    }
    
    determineMatrixArrayType();

    /**
     * @class 3 Dimensional Vector
     * @name vec3
     */
    var vec3 = {};
     
    /**
     * Creates a new instance of a vec3 using the default array type
     * Any javascript array-like objects containing at least 3 numeric elements can serve as a vec3
     *
     * @param {vec3} [vec] vec3 containing values to initialize with
     *
     * @returns {vec3} New vec3
     */
    vec3.create = function (vec) {
        var dest = new MatrixArray(3);

        if (vec) {
            dest[0] = vec[0];
            dest[1] = vec[1];
            dest[2] = vec[2];
        } else {
            dest[0] = dest[1] = dest[2] = 0;
        }

        return dest;
    };

    /**
     * Creates a new instance of a vec3, initializing it with the given arguments
     *
     * @param {number} x X value
     * @param {number} y Y value
     * @param {number} z Z value

     * @returns {vec3} New vec3
     */
    vec3.createFrom = function (x, y, z) {
        var dest = new MatrixArray(3);

        dest[0] = x;
        dest[1] = y;
        dest[2] = z;

        return dest;
    };

    /**
     * Copies the values of one vec3 to another
     *
     * @param {vec3} vec vec3 containing values to copy
     * @param {vec3} dest vec3 receiving copied values
     *
     * @returns {vec3} dest
     */
    vec3.set = function (vec, dest) {
        dest[0] = vec[0];
        dest[1] = vec[1];
        dest[2] = vec[2];

        return dest;
    };

    /**
     * Compares two vectors for equality within a certain margin of error
     *
     * @param {vec3} a First vector
     * @param {vec3} b Second vector
     *
     * @returns {Boolean} True if a is equivalent to b
     */
    vec3.equal = function (a, b) {
        return a === b || (
            Math.abs(a[0] - b[0]) < FLOAT_EPSILON &&
            Math.abs(a[1] - b[1]) < FLOAT_EPSILON &&
            Math.abs(a[2] - b[2]) < FLOAT_EPSILON
        );
    };

    /**
     * Performs a vector addition
     *
     * @param {vec3} vec First operand
     * @param {vec3} vec2 Second operand
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    vec3.add = function (vec, vec2, dest) {
        if (!dest || vec === dest) {
            vec[0] += vec2[0];
            vec[1] += vec2[1];
            vec[2] += vec2[2];
            return vec;
        }

        dest[0] = vec[0] + vec2[0];
        dest[1] = vec[1] + vec2[1];
        dest[2] = vec[2] + vec2[2];
        return dest;
    };

    /**
     * Performs a vector subtraction
     *
     * @param {vec3} vec First operand
     * @param {vec3} vec2 Second operand
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    vec3.subtract = function (vec, vec2, dest) {
        if (!dest || vec === dest) {
            vec[0] -= vec2[0];
            vec[1] -= vec2[1];
            vec[2] -= vec2[2];
            return vec;
        }

        dest[0] = vec[0] - vec2[0];
        dest[1] = vec[1] - vec2[1];
        dest[2] = vec[2] - vec2[2];
        return dest;
    };

    /**
     * Performs a vector multiplication
     *
     * @param {vec3} vec First operand
     * @param {vec3} vec2 Second operand
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    vec3.multiply = function (vec, vec2, dest) {
        if (!dest || vec === dest) {
            vec[0] *= vec2[0];
            vec[1] *= vec2[1];
            vec[2] *= vec2[2];
            return vec;
        }

        dest[0] = vec[0] * vec2[0];
        dest[1] = vec[1] * vec2[1];
        dest[2] = vec[2] * vec2[2];
        return dest;
    };

    /**
     * Negates the components of a vec3
     *
     * @param {vec3} vec vec3 to negate
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    vec3.negate = function (vec, dest) {
        if (!dest) { dest = vec; }

        dest[0] = -vec[0];
        dest[1] = -vec[1];
        dest[2] = -vec[2];
        return dest;
    };

    /**
     * Multiplies the components of a vec3 by a scalar value
     *
     * @param {vec3} vec vec3 to scale
     * @param {number} val Value to scale by
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    vec3.scale = function (vec, val, dest) {
        if (!dest || vec === dest) {
            vec[0] *= val;
            vec[1] *= val;
            vec[2] *= val;
            return vec;
        }

        dest[0] = vec[0] * val;
        dest[1] = vec[1] * val;
        dest[2] = vec[2] * val;
        return dest;
    };

    /**
     * Generates a unit vector of the same direction as the provided vec3
     * If vector length is 0, returns [0, 0, 0]
     *
     * @param {vec3} vec vec3 to normalize
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    vec3.normalize = function (vec, dest) {
        if (!dest) { dest = vec; }

        var x = vec[0], y = vec[1], z = vec[2],
            len = Math.sqrt(x * x + y * y + z * z);

        if (!len) {
            dest[0] = 0;
            dest[1] = 0;
            dest[2] = 0;
            return dest;
        } else if (len === 1) {
            dest[0] = x;
            dest[1] = y;
            dest[2] = z;
            return dest;
        }

        len = 1 / len;
        dest[0] = x * len;
        dest[1] = y * len;
        dest[2] = z * len;
        return dest;
    };

    /**
     * Generates the cross product of two vec3s
     *
     * @param {vec3} vec First operand
     * @param {vec3} vec2 Second operand
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    vec3.cross = function (vec, vec2, dest) {
        if (!dest) { dest = vec; }

        var x = vec[0], y = vec[1], z = vec[2],
            x2 = vec2[0], y2 = vec2[1], z2 = vec2[2];

        dest[0] = y * z2 - z * y2;
        dest[1] = z * x2 - x * z2;
        dest[2] = x * y2 - y * x2;
        return dest;
    };

    /**
     * Caclulates the length of a vec3
     *
     * @param {vec3} vec vec3 to calculate length of
     *
     * @returns {number} Length of vec
     */
    vec3.length = function (vec) {
        var x = vec[0], y = vec[1], z = vec[2];
        return Math.sqrt(x * x + y * y + z * z);
    };

    /**
     * Caclulates the squared length of a vec3
     *
     * @param {vec3} vec vec3 to calculate squared length of
     *
     * @returns {number} Squared Length of vec
     */
    vec3.squaredLength = function (vec) {
        var x = vec[0], y = vec[1], z = vec[2];
        return x * x + y * y + z * z;
    };

    /**
     * Caclulates the dot product of two vec3s
     *
     * @param {vec3} vec First operand
     * @param {vec3} vec2 Second operand
     *
     * @returns {number} Dot product of vec and vec2
     */
    vec3.dot = function (vec, vec2) {
        return vec[0] * vec2[0] + vec[1] * vec2[1] + vec[2] * vec2[2];
    };

    /**
     * Generates a unit vector pointing from one vector to another
     *
     * @param {vec3} vec Origin vec3
     * @param {vec3} vec2 vec3 to point to
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    vec3.direction = function (vec, vec2, dest) {
        if (!dest) { dest = vec; }

        var x = vec[0] - vec2[0],
            y = vec[1] - vec2[1],
            z = vec[2] - vec2[2],
            len = Math.sqrt(x * x + y * y + z * z);

        if (!len) {
            dest[0] = 0;
            dest[1] = 0;
            dest[2] = 0;
            return dest;
        }

        len = 1 / len;
        dest[0] = x * len;
        dest[1] = y * len;
        dest[2] = z * len;
        return dest;
    };

    /**
     * Performs a linear interpolation between two vec3
     *
     * @param {vec3} vec First vector
     * @param {vec3} vec2 Second vector
     * @param {number} lerp Interpolation amount between the two inputs
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    vec3.lerp = function (vec, vec2, lerp, dest) {
        if (!dest) { dest = vec; }

        dest[0] = vec[0] + lerp * (vec2[0] - vec[0]);
        dest[1] = vec[1] + lerp * (vec2[1] - vec[1]);
        dest[2] = vec[2] + lerp * (vec2[2] - vec[2]);

        return dest;
    };

    /**
     * Calculates the euclidian distance between two vec3
     *
     * Params:
     * @param {vec3} vec First vector
     * @param {vec3} vec2 Second vector
     *
     * @returns {number} Distance between vec and vec2
     */
    vec3.dist = function (vec, vec2) {
        var x = vec2[0] - vec[0],
            y = vec2[1] - vec[1],
            z = vec2[2] - vec[2];
            
        return Math.sqrt(x*x + y*y + z*z);
    };

    // Pre-allocated to prevent unecessary garbage collection
    var unprojectMat = null;
    var unprojectVec = new MatrixArray(4);
    /**
     * Projects the specified vec3 from screen space into object space
     * Based on the <a href="http://webcvs.freedesktop.org/mesa/Mesa/src/glu/mesa/project.c?revision=1.4&view=markup">Mesa gluUnProject implementation</a>
     *
     * @param {vec3} vec Screen-space vector to project
     * @param {mat4} view View matrix
     * @param {mat4} proj Projection matrix
     * @param {vec4} viewport Viewport as given to gl.viewport [x, y, width, height]
     * @param {vec3} [dest] vec3 receiving unprojected result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    vec3.unproject = function (vec, view, proj, viewport, dest) {
        if (!dest) { dest = vec; }

        if(!unprojectMat) {
            unprojectMat = mat4.create();
        }

        var m = unprojectMat;
        var v = unprojectVec;
        
        v[0] = (vec[0] - viewport[0]) * 2.0 / viewport[2] - 1.0;
        v[1] = (vec[1] - viewport[1]) * 2.0 / viewport[3] - 1.0;
        v[2] = 2.0 * vec[2] - 1.0;
        v[3] = 1.0;
        
        mat4.multiply(proj, view, m);
        if(!mat4.inverse(m)) { return null; }
        
        mat4.multiplyVec4(m, v);
        if(v[3] === 0.0) { return null; }

        dest[0] = v[0] / v[3];
        dest[1] = v[1] / v[3];
        dest[2] = v[2] / v[3];
        
        return dest;
    };

    var xUnitVec3 = vec3.createFrom(1,0,0);
    var yUnitVec3 = vec3.createFrom(0,1,0);
    var zUnitVec3 = vec3.createFrom(0,0,1);

    var tmpvec3 = vec3.create();
    /**
     * Generates a quaternion of rotation between two given normalized vectors
     *
     * @param {vec3} a Normalized source vector
     * @param {vec3} b Normalized target vector
     * @param {quat4} [dest] quat4 receiving operation result.
     *
     * @returns {quat4} dest if specified, a new quat4 otherwise
     */
    vec3.rotationTo = function (a, b, dest) {
        if (!dest) { dest = quat4.create(); }
        
        var d = vec3.dot(a, b);
        var axis = tmpvec3;
        if (d >= 1.0) {
            quat4.set(identityQuat4, dest);
        } else if (d < (0.000001 - 1.0)) {
            vec3.cross(xUnitVec3, a, axis);
            if (vec3.length(axis) < 0.000001)
                vec3.cross(yUnitVec3, a, axis);
            if (vec3.length(axis) < 0.000001)
                vec3.cross(zUnitVec3, a, axis);
            vec3.normalize(axis);
            quat4.fromAngleAxis(Math.PI, axis, dest);
        } else {
            var s = Math.sqrt((1.0 + d) * 2.0);
            var sInv = 1.0 / s;
            vec3.cross(a, b, axis);
            dest[0] = axis[0] * sInv;
            dest[1] = axis[1] * sInv;
            dest[2] = axis[2] * sInv;
            dest[3] = s * 0.5;
            quat4.normalize(dest);
        }
        if (dest[3] > 1.0) dest[3] = 1.0;
        else if (dest[3] < -1.0) dest[3] = -1.0;
        return dest;
    };

    /**
     * Returns a string representation of a vector
     *
     * @param {vec3} vec Vector to represent as a string
     *
     * @returns {string} String representation of vec
     */
    vec3.str = function (vec) {
        return '[' + vec[0] + ', ' + vec[1] + ', ' + vec[2] + ']';
    };

    /**
     * @class 3x3 Matrix
     * @name mat3
     */
    var mat3 = {};

    /**
     * Creates a new instance of a mat3 using the default array type
     * Any javascript array-like object containing at least 9 numeric elements can serve as a mat3
     *
     * @param {mat3} [mat] mat3 containing values to initialize with
     *
     * @returns {mat3} New mat3
     */
    mat3.create = function (mat) {
        var dest = new MatrixArray(9);

        if (mat) {
            dest[0] = mat[0];
            dest[1] = mat[1];
            dest[2] = mat[2];
            dest[3] = mat[3];
            dest[4] = mat[4];
            dest[5] = mat[5];
            dest[6] = mat[6];
            dest[7] = mat[7];
            dest[8] = mat[8];
        } else {
            dest[0] = dest[1] =
            dest[2] = dest[3] =
            dest[4] = dest[5] =
            dest[6] = dest[7] =
            dest[8] = 0;
        }

        return dest;
    };

    /**
     * Creates a new instance of a mat3, initializing it with the given arguments
     *
     * @param {number} m00
     * @param {number} m01
     * @param {number} m02
     * @param {number} m10
     * @param {number} m11
     * @param {number} m12
     * @param {number} m20
     * @param {number} m21
     * @param {number} m22

     * @returns {mat3} New mat3
     */
    mat3.createFrom = function (m00, m01, m02, m10, m11, m12, m20, m21, m22) {
        var dest = new MatrixArray(9);

        dest[0] = m00;
        dest[1] = m01;
        dest[2] = m02;
        dest[3] = m10;
        dest[4] = m11;
        dest[5] = m12;
        dest[6] = m20;
        dest[7] = m21;
        dest[8] = m22;

        return dest;
    };

    /**
     * Calculates the determinant of a mat3
     *
     * @param {mat3} mat mat3 to calculate determinant of
     *
     * @returns {Number} determinant of mat
     */
    mat3.determinant = function (mat) {
        var a00 = mat[0], a01 = mat[1], a02 = mat[2],
            a10 = mat[3], a11 = mat[4], a12 = mat[5],
            a20 = mat[6], a21 = mat[7], a22 = mat[8];

        return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
    };

    /**
     * Calculates the inverse matrix of a mat3
     *
     * @param {mat3} mat mat3 to calculate inverse of
     * @param {mat3} [dest] mat3 receiving inverse matrix. If not specified result is written to mat
     *
     * @param {mat3} dest is specified, mat otherwise, null if matrix cannot be inverted
     */
    mat3.inverse = function (mat, dest) {
        var a00 = mat[0], a01 = mat[1], a02 = mat[2],
            a10 = mat[3], a11 = mat[4], a12 = mat[5],
            a20 = mat[6], a21 = mat[7], a22 = mat[8],

            b01 = a22 * a11 - a12 * a21,
            b11 = -a22 * a10 + a12 * a20,
            b21 = a21 * a10 - a11 * a20,

            d = a00 * b01 + a01 * b11 + a02 * b21,
            id;

        if (!d) { return null; }
        id = 1 / d;

        if (!dest) { dest = mat3.create(); }

        dest[0] = b01 * id;
        dest[1] = (-a22 * a01 + a02 * a21) * id;
        dest[2] = (a12 * a01 - a02 * a11) * id;
        dest[3] = b11 * id;
        dest[4] = (a22 * a00 - a02 * a20) * id;
        dest[5] = (-a12 * a00 + a02 * a10) * id;
        dest[6] = b21 * id;
        dest[7] = (-a21 * a00 + a01 * a20) * id;
        dest[8] = (a11 * a00 - a01 * a10) * id;
        return dest;
    };
    
    /**
     * Performs a matrix multiplication
     *
     * @param {mat3} mat First operand
     * @param {mat3} mat2 Second operand
     * @param {mat3} [dest] mat3 receiving operation result. If not specified result is written to mat
     *
     * @returns {mat3} dest if specified, mat otherwise
     */
    mat3.multiply = function (mat, mat2, dest) {
        if (!dest) { dest = mat; }
        

        // Cache the matrix values (makes for huge speed increases!)
        var a00 = mat[0], a01 = mat[1], a02 = mat[2],
            a10 = mat[3], a11 = mat[4], a12 = mat[5],
            a20 = mat[6], a21 = mat[7], a22 = mat[8],

            b00 = mat2[0], b01 = mat2[1], b02 = mat2[2],
            b10 = mat2[3], b11 = mat2[4], b12 = mat2[5],
            b20 = mat2[6], b21 = mat2[7], b22 = mat2[8];

        dest[0] = b00 * a00 + b01 * a10 + b02 * a20;
        dest[1] = b00 * a01 + b01 * a11 + b02 * a21;
        dest[2] = b00 * a02 + b01 * a12 + b02 * a22;

        dest[3] = b10 * a00 + b11 * a10 + b12 * a20;
        dest[4] = b10 * a01 + b11 * a11 + b12 * a21;
        dest[5] = b10 * a02 + b11 * a12 + b12 * a22;

        dest[6] = b20 * a00 + b21 * a10 + b22 * a20;
        dest[7] = b20 * a01 + b21 * a11 + b22 * a21;
        dest[8] = b20 * a02 + b21 * a12 + b22 * a22;

        return dest;
    };

    /**
     * Transforms the vec2 according to the given mat3.
     *
     * @param {mat3} matrix mat3 to multiply against
     * @param {vec2} vec    the vector to multiply
     * @param {vec2} [dest] an optional receiving vector. If not given, vec is used.
     *
     * @returns {vec2} The multiplication result
     **/
    mat3.multiplyVec2 = function(matrix, vec, dest) {
      if (!dest) dest = vec;
      var x = vec[0], y = vec[1];
      dest[0] = x * matrix[0] + y * matrix[3] + matrix[6];
      dest[1] = x * matrix[1] + y * matrix[4] + matrix[7];
      return dest;
    };

    /**
     * Transforms the vec3 according to the given mat3
     *
     * @param {mat3} matrix mat3 to multiply against
     * @param {vec3} vec    the vector to multiply
     * @param {vec3} [dest] an optional receiving vector. If not given, vec is used.
     *
     * @returns {vec3} The multiplication result
     **/
    mat3.multiplyVec3 = function(matrix, vec, dest) {
      if (!dest) dest = vec;
      var x = vec[0], y = vec[1], z = vec[2];
      dest[0] = x * matrix[0] + y * matrix[3] + z * matrix[6];
      dest[1] = x * matrix[1] + y * matrix[4] + z * matrix[7];
      dest[2] = x * matrix[2] + y * matrix[5] + z * matrix[8];
      
      return dest;
    };

    /**
     * Copies the values of one mat3 to another
     *
     * @param {mat3} mat mat3 containing values to copy
     * @param {mat3} dest mat3 receiving copied values
     *
     * @returns {mat3} dest
     */
    mat3.set = function (mat, dest) {
        dest[0] = mat[0];
        dest[1] = mat[1];
        dest[2] = mat[2];
        dest[3] = mat[3];
        dest[4] = mat[4];
        dest[5] = mat[5];
        dest[6] = mat[6];
        dest[7] = mat[7];
        dest[8] = mat[8];
        return dest;
    };

    /**
     * Compares two matrices for equality within a certain margin of error
     *
     * @param {mat3} a First matrix
     * @param {mat3} b Second matrix
     *
     * @returns {Boolean} True if a is equivalent to b
     */
    mat3.equal = function (a, b) {
        return a === b || (
            Math.abs(a[0] - b[0]) < FLOAT_EPSILON &&
            Math.abs(a[1] - b[1]) < FLOAT_EPSILON &&
            Math.abs(a[2] - b[2]) < FLOAT_EPSILON &&
            Math.abs(a[3] - b[3]) < FLOAT_EPSILON &&
            Math.abs(a[4] - b[4]) < FLOAT_EPSILON &&
            Math.abs(a[5] - b[5]) < FLOAT_EPSILON &&
            Math.abs(a[6] - b[6]) < FLOAT_EPSILON &&
            Math.abs(a[7] - b[7]) < FLOAT_EPSILON &&
            Math.abs(a[8] - b[8]) < FLOAT_EPSILON
        );
    };

    /**
     * Sets a mat3 to an identity matrix
     *
     * @param {mat3} dest mat3 to set
     *
     * @returns dest if specified, otherwise a new mat3
     */
    mat3.identity = function (dest) {
        if (!dest) { dest = mat3.create(); }
        dest[0] = 1;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 0;
        dest[4] = 1;
        dest[5] = 0;
        dest[6] = 0;
        dest[7] = 0;
        dest[8] = 1;
        return dest;
    };

    /**
     * Transposes a mat3 (flips the values over the diagonal)
     *
     * Params:
     * @param {mat3} mat mat3 to transpose
     * @param {mat3} [dest] mat3 receiving transposed values. If not specified result is written to mat
     *
     * @returns {mat3} dest is specified, mat otherwise
     */
    mat3.transpose = function (mat, dest) {
        // If we are transposing ourselves we can skip a few steps but have to cache some values
        if (!dest || mat === dest) {
            var a01 = mat[1], a02 = mat[2],
                a12 = mat[5];

            mat[1] = mat[3];
            mat[2] = mat[6];
            mat[3] = a01;
            mat[5] = mat[7];
            mat[6] = a02;
            mat[7] = a12;
            return mat;
        }

        dest[0] = mat[0];
        dest[1] = mat[3];
        dest[2] = mat[6];
        dest[3] = mat[1];
        dest[4] = mat[4];
        dest[5] = mat[7];
        dest[6] = mat[2];
        dest[7] = mat[5];
        dest[8] = mat[8];
        return dest;
    };

    /**
     * Copies the elements of a mat3 into the upper 3x3 elements of a mat4
     *
     * @param {mat3} mat mat3 containing values to copy
     * @param {mat4} [dest] mat4 receiving copied values
     *
     * @returns {mat4} dest if specified, a new mat4 otherwise
     */
    mat3.toMat4 = function (mat, dest) {
        if (!dest) { dest = mat4.create(); }

        dest[15] = 1;
        dest[14] = 0;
        dest[13] = 0;
        dest[12] = 0;

        dest[11] = 0;
        dest[10] = mat[8];
        dest[9] = mat[7];
        dest[8] = mat[6];

        dest[7] = 0;
        dest[6] = mat[5];
        dest[5] = mat[4];
        dest[4] = mat[3];

        dest[3] = 0;
        dest[2] = mat[2];
        dest[1] = mat[1];
        dest[0] = mat[0];

        return dest;
    };

    /**
     * Returns a string representation of a mat3
     *
     * @param {mat3} mat mat3 to represent as a string
     *
     * @param {string} String representation of mat
     */
    mat3.str = function (mat) {
        return '[' + mat[0] + ', ' + mat[1] + ', ' + mat[2] +
            ', ' + mat[3] + ', ' + mat[4] + ', ' + mat[5] +
            ', ' + mat[6] + ', ' + mat[7] + ', ' + mat[8] + ']';
    };

    /**
     * @class 4x4 Matrix
     * @name mat4
     */
    var mat4 = {};

    /**
     * Creates a new instance of a mat4 using the default array type
     * Any javascript array-like object containing at least 16 numeric elements can serve as a mat4
     *
     * @param {mat4} [mat] mat4 containing values to initialize with
     *
     * @returns {mat4} New mat4
     */
    mat4.create = function (mat) {
        var dest = new MatrixArray(16);

        if (mat) {
            dest[0] = mat[0];
            dest[1] = mat[1];
            dest[2] = mat[2];
            dest[3] = mat[3];
            dest[4] = mat[4];
            dest[5] = mat[5];
            dest[6] = mat[6];
            dest[7] = mat[7];
            dest[8] = mat[8];
            dest[9] = mat[9];
            dest[10] = mat[10];
            dest[11] = mat[11];
            dest[12] = mat[12];
            dest[13] = mat[13];
            dest[14] = mat[14];
            dest[15] = mat[15];
        }

        return dest;
    };

    /**
     * Creates a new instance of a mat4, initializing it with the given arguments
     *
     * @param {number} m00
     * @param {number} m01
     * @param {number} m02
     * @param {number} m03
     * @param {number} m10
     * @param {number} m11
     * @param {number} m12
     * @param {number} m13
     * @param {number} m20
     * @param {number} m21
     * @param {number} m22
     * @param {number} m23
     * @param {number} m30
     * @param {number} m31
     * @param {number} m32
     * @param {number} m33

     * @returns {mat4} New mat4
     */
    mat4.createFrom = function (m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
        var dest = new MatrixArray(16);

        dest[0] = m00;
        dest[1] = m01;
        dest[2] = m02;
        dest[3] = m03;
        dest[4] = m10;
        dest[5] = m11;
        dest[6] = m12;
        dest[7] = m13;
        dest[8] = m20;
        dest[9] = m21;
        dest[10] = m22;
        dest[11] = m23;
        dest[12] = m30;
        dest[13] = m31;
        dest[14] = m32;
        dest[15] = m33;

        return dest;
    };

    /**
     * Copies the values of one mat4 to another
     *
     * @param {mat4} mat mat4 containing values to copy
     * @param {mat4} dest mat4 receiving copied values
     *
     * @returns {mat4} dest
     */
    mat4.set = function (mat, dest) {
        dest[0] = mat[0];
        dest[1] = mat[1];
        dest[2] = mat[2];
        dest[3] = mat[3];
        dest[4] = mat[4];
        dest[5] = mat[5];
        dest[6] = mat[6];
        dest[7] = mat[7];
        dest[8] = mat[8];
        dest[9] = mat[9];
        dest[10] = mat[10];
        dest[11] = mat[11];
        dest[12] = mat[12];
        dest[13] = mat[13];
        dest[14] = mat[14];
        dest[15] = mat[15];
        return dest;
    };

    /**
     * Compares two matrices for equality within a certain margin of error
     *
     * @param {mat4} a First matrix
     * @param {mat4} b Second matrix
     *
     * @returns {Boolean} True if a is equivalent to b
     */
    mat4.equal = function (a, b) {
        return a === b || (
            Math.abs(a[0] - b[0]) < FLOAT_EPSILON &&
            Math.abs(a[1] - b[1]) < FLOAT_EPSILON &&
            Math.abs(a[2] - b[2]) < FLOAT_EPSILON &&
            Math.abs(a[3] - b[3]) < FLOAT_EPSILON &&
            Math.abs(a[4] - b[4]) < FLOAT_EPSILON &&
            Math.abs(a[5] - b[5]) < FLOAT_EPSILON &&
            Math.abs(a[6] - b[6]) < FLOAT_EPSILON &&
            Math.abs(a[7] - b[7]) < FLOAT_EPSILON &&
            Math.abs(a[8] - b[8]) < FLOAT_EPSILON &&
            Math.abs(a[9] - b[9]) < FLOAT_EPSILON &&
            Math.abs(a[10] - b[10]) < FLOAT_EPSILON &&
            Math.abs(a[11] - b[11]) < FLOAT_EPSILON &&
            Math.abs(a[12] - b[12]) < FLOAT_EPSILON &&
            Math.abs(a[13] - b[13]) < FLOAT_EPSILON &&
            Math.abs(a[14] - b[14]) < FLOAT_EPSILON &&
            Math.abs(a[15] - b[15]) < FLOAT_EPSILON
        );
    };

    /**
     * Sets a mat4 to an identity matrix
     *
     * @param {mat4} dest mat4 to set
     *
     * @returns {mat4} dest
     */
    mat4.identity = function (dest) {
        if (!dest) { dest = mat4.create(); }
        dest[0] = 1;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 0;
        dest[4] = 0;
        dest[5] = 1;
        dest[6] = 0;
        dest[7] = 0;
        dest[8] = 0;
        dest[9] = 0;
        dest[10] = 1;
        dest[11] = 0;
        dest[12] = 0;
        dest[13] = 0;
        dest[14] = 0;
        dest[15] = 1;
        return dest;
    };

    /**
     * Transposes a mat4 (flips the values over the diagonal)
     *
     * @param {mat4} mat mat4 to transpose
     * @param {mat4} [dest] mat4 receiving transposed values. If not specified result is written to mat
     *
     * @param {mat4} dest is specified, mat otherwise
     */
    mat4.transpose = function (mat, dest) {
        // If we are transposing ourselves we can skip a few steps but have to cache some values
        if (!dest || mat === dest) {
            var a01 = mat[1], a02 = mat[2], a03 = mat[3],
                a12 = mat[6], a13 = mat[7],
                a23 = mat[11];

            mat[1] = mat[4];
            mat[2] = mat[8];
            mat[3] = mat[12];
            mat[4] = a01;
            mat[6] = mat[9];
            mat[7] = mat[13];
            mat[8] = a02;
            mat[9] = a12;
            mat[11] = mat[14];
            mat[12] = a03;
            mat[13] = a13;
            mat[14] = a23;
            return mat;
        }

        dest[0] = mat[0];
        dest[1] = mat[4];
        dest[2] = mat[8];
        dest[3] = mat[12];
        dest[4] = mat[1];
        dest[5] = mat[5];
        dest[6] = mat[9];
        dest[7] = mat[13];
        dest[8] = mat[2];
        dest[9] = mat[6];
        dest[10] = mat[10];
        dest[11] = mat[14];
        dest[12] = mat[3];
        dest[13] = mat[7];
        dest[14] = mat[11];
        dest[15] = mat[15];
        return dest;
    };

    /**
     * Calculates the determinant of a mat4
     *
     * @param {mat4} mat mat4 to calculate determinant of
     *
     * @returns {number} determinant of mat
     */
    mat4.determinant = function (mat) {
        // Cache the matrix values (makes for huge speed increases!)
        var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3],
            a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7],
            a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11],
            a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];

        return (a30 * a21 * a12 * a03 - a20 * a31 * a12 * a03 - a30 * a11 * a22 * a03 + a10 * a31 * a22 * a03 +
                a20 * a11 * a32 * a03 - a10 * a21 * a32 * a03 - a30 * a21 * a02 * a13 + a20 * a31 * a02 * a13 +
                a30 * a01 * a22 * a13 - a00 * a31 * a22 * a13 - a20 * a01 * a32 * a13 + a00 * a21 * a32 * a13 +
                a30 * a11 * a02 * a23 - a10 * a31 * a02 * a23 - a30 * a01 * a12 * a23 + a00 * a31 * a12 * a23 +
                a10 * a01 * a32 * a23 - a00 * a11 * a32 * a23 - a20 * a11 * a02 * a33 + a10 * a21 * a02 * a33 +
                a20 * a01 * a12 * a33 - a00 * a21 * a12 * a33 - a10 * a01 * a22 * a33 + a00 * a11 * a22 * a33);
    };

    /**
     * Calculates the inverse matrix of a mat4
     *
     * @param {mat4} mat mat4 to calculate inverse of
     * @param {mat4} [dest] mat4 receiving inverse matrix. If not specified result is written to mat
     *
     * @param {mat4} dest is specified, mat otherwise, null if matrix cannot be inverted
     */
    mat4.inverse = function (mat, dest) {
        if (!dest) { dest = mat; }

        // Cache the matrix values (makes for huge speed increases!)
        var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3],
            a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7],
            a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11],
            a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32,

            d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06),
            invDet;

            // Calculate the determinant
            if (!d) { return null; }
            invDet = 1 / d;

        dest[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
        dest[1] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
        dest[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
        dest[3] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
        dest[4] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
        dest[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
        dest[6] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
        dest[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
        dest[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
        dest[9] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
        dest[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
        dest[11] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
        dest[12] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
        dest[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
        dest[14] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
        dest[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;

        return dest;
    };

    /**
     * Copies the upper 3x3 elements of a mat4 into another mat4
     *
     * @param {mat4} mat mat4 containing values to copy
     * @param {mat4} [dest] mat4 receiving copied values
     *
     * @returns {mat4} dest is specified, a new mat4 otherwise
     */
    mat4.toRotationMat = function (mat, dest) {
        if (!dest) { dest = mat4.create(); }

        dest[0] = mat[0];
        dest[1] = mat[1];
        dest[2] = mat[2];
        dest[3] = mat[3];
        dest[4] = mat[4];
        dest[5] = mat[5];
        dest[6] = mat[6];
        dest[7] = mat[7];
        dest[8] = mat[8];
        dest[9] = mat[9];
        dest[10] = mat[10];
        dest[11] = mat[11];
        dest[12] = 0;
        dest[13] = 0;
        dest[14] = 0;
        dest[15] = 1;

        return dest;
    };

    /**
     * Copies the upper 3x3 elements of a mat4 into a mat3
     *
     * @param {mat4} mat mat4 containing values to copy
     * @param {mat3} [dest] mat3 receiving copied values
     *
     * @returns {mat3} dest is specified, a new mat3 otherwise
     */
    mat4.toMat3 = function (mat, dest) {
        if (!dest) { dest = mat3.create(); }

        dest[0] = mat[0];
        dest[1] = mat[1];
        dest[2] = mat[2];
        dest[3] = mat[4];
        dest[4] = mat[5];
        dest[5] = mat[6];
        dest[6] = mat[8];
        dest[7] = mat[9];
        dest[8] = mat[10];

        return dest;
    };

    /**
     * Calculates the inverse of the upper 3x3 elements of a mat4 and copies the result into a mat3
     * The resulting matrix is useful for calculating transformed normals
     *
     * Params:
     * @param {mat4} mat mat4 containing values to invert and copy
     * @param {mat3} [dest] mat3 receiving values
     *
     * @returns {mat3} dest is specified, a new mat3 otherwise, null if the matrix cannot be inverted
     */
    mat4.toInverseMat3 = function (mat, dest) {
        // Cache the matrix values (makes for huge speed increases!)
        var a00 = mat[0], a01 = mat[1], a02 = mat[2],
            a10 = mat[4], a11 = mat[5], a12 = mat[6],
            a20 = mat[8], a21 = mat[9], a22 = mat[10],

            b01 = a22 * a11 - a12 * a21,
            b11 = -a22 * a10 + a12 * a20,
            b21 = a21 * a10 - a11 * a20,

            d = a00 * b01 + a01 * b11 + a02 * b21,
            id;

        if (!d) { return null; }
        id = 1 / d;

        if (!dest) { dest = mat3.create(); }

        dest[0] = b01 * id;
        dest[1] = (-a22 * a01 + a02 * a21) * id;
        dest[2] = (a12 * a01 - a02 * a11) * id;
        dest[3] = b11 * id;
        dest[4] = (a22 * a00 - a02 * a20) * id;
        dest[5] = (-a12 * a00 + a02 * a10) * id;
        dest[6] = b21 * id;
        dest[7] = (-a21 * a00 + a01 * a20) * id;
        dest[8] = (a11 * a00 - a01 * a10) * id;

        return dest;
    };

    /**
     * Performs a matrix multiplication
     *
     * @param {mat4} mat First operand
     * @param {mat4} mat2 Second operand
     * @param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
     *
     * @returns {mat4} dest if specified, mat otherwise
     */
    mat4.multiply = function (mat, mat2, dest) {
        if (!dest) { dest = mat; }

        // Cache the matrix values (makes for huge speed increases!)
        var a00 = mat[ 0], a01 = mat[ 1], a02 = mat[ 2], a03 = mat[3];
        var a10 = mat[ 4], a11 = mat[ 5], a12 = mat[ 6], a13 = mat[7];
        var a20 = mat[ 8], a21 = mat[ 9], a22 = mat[10], a23 = mat[11];
        var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];

        // Cache only the current line of the second matrix
        var b0  = mat2[0], b1 = mat2[1], b2 = mat2[2], b3 = mat2[3];  
        dest[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        dest[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        dest[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        dest[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = mat2[4];
        b1 = mat2[5];
        b2 = mat2[6];
        b3 = mat2[7];
        dest[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        dest[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        dest[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        dest[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = mat2[8];
        b1 = mat2[9];
        b2 = mat2[10];
        b3 = mat2[11];
        dest[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        dest[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        dest[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        dest[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = mat2[12];
        b1 = mat2[13];
        b2 = mat2[14];
        b3 = mat2[15];
        dest[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        dest[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        dest[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        dest[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        return dest;
    };

    /**
     * Transforms a vec3 with the given matrix
     * 4th vector component is implicitly '1'
     *
     * @param {mat4} mat mat4 to transform the vector with
     * @param {vec3} vec vec3 to transform
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec3} dest if specified, vec otherwise
     */
    mat4.multiplyVec3 = function (mat, vec, dest) {
        if (!dest) { dest = vec; }

        var x = vec[0], y = vec[1], z = vec[2];

        dest[0] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
        dest[1] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
        dest[2] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];

        return dest;
    };

    /**
     * Transforms a vec4 with the given matrix
     *
     * @param {mat4} mat mat4 to transform the vector with
     * @param {vec4} vec vec4 to transform
     * @param {vec4} [dest] vec4 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec4} dest if specified, vec otherwise
     */
    mat4.multiplyVec4 = function (mat, vec, dest) {
        if (!dest) { dest = vec; }

        var x = vec[0], y = vec[1], z = vec[2], w = vec[3];

        dest[0] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12] * w;
        dest[1] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13] * w;
        dest[2] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w;
        dest[3] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w;

        return dest;
    };

    /**
     * Translates a matrix by the given vector
     *
     * @param {mat4} mat mat4 to translate
     * @param {vec3} vec vec3 specifying the translation
     * @param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
     *
     * @returns {mat4} dest if specified, mat otherwise
     */
    mat4.translate = function (mat, vec, dest) {
        var x = vec[0], y = vec[1], z = vec[2],
            a00, a01, a02, a03,
            a10, a11, a12, a13,
            a20, a21, a22, a23;

        if (!dest || mat === dest) {
            mat[12] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
            mat[13] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
            mat[14] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];
            mat[15] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15];
            return mat;
        }

        a00 = mat[0]; a01 = mat[1]; a02 = mat[2]; a03 = mat[3];
        a10 = mat[4]; a11 = mat[5]; a12 = mat[6]; a13 = mat[7];
        a20 = mat[8]; a21 = mat[9]; a22 = mat[10]; a23 = mat[11];

        dest[0] = a00; dest[1] = a01; dest[2] = a02; dest[3] = a03;
        dest[4] = a10; dest[5] = a11; dest[6] = a12; dest[7] = a13;
        dest[8] = a20; dest[9] = a21; dest[10] = a22; dest[11] = a23;

        dest[12] = a00 * x + a10 * y + a20 * z + mat[12];
        dest[13] = a01 * x + a11 * y + a21 * z + mat[13];
        dest[14] = a02 * x + a12 * y + a22 * z + mat[14];
        dest[15] = a03 * x + a13 * y + a23 * z + mat[15];
        return dest;
    };

    /**
     * Scales a matrix by the given vector
     *
     * @param {mat4} mat mat4 to scale
     * @param {vec3} vec vec3 specifying the scale for each axis
     * @param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
     *
     * @param {mat4} dest if specified, mat otherwise
     */
    mat4.scale = function (mat, vec, dest) {
        var x = vec[0], y = vec[1], z = vec[2];

        if (!dest || mat === dest) {
            mat[0] *= x;
            mat[1] *= x;
            mat[2] *= x;
            mat[3] *= x;
            mat[4] *= y;
            mat[5] *= y;
            mat[6] *= y;
            mat[7] *= y;
            mat[8] *= z;
            mat[9] *= z;
            mat[10] *= z;
            mat[11] *= z;
            return mat;
        }

        dest[0] = mat[0] * x;
        dest[1] = mat[1] * x;
        dest[2] = mat[2] * x;
        dest[3] = mat[3] * x;
        dest[4] = mat[4] * y;
        dest[5] = mat[5] * y;
        dest[6] = mat[6] * y;
        dest[7] = mat[7] * y;
        dest[8] = mat[8] * z;
        dest[9] = mat[9] * z;
        dest[10] = mat[10] * z;
        dest[11] = mat[11] * z;
        dest[12] = mat[12];
        dest[13] = mat[13];
        dest[14] = mat[14];
        dest[15] = mat[15];
        return dest;
    };

    /**
     * Rotates a matrix by the given angle around the specified axis
     * If rotating around a primary axis (X,Y,Z) one of the specialized rotation functions should be used instead for performance
     *
     * @param {mat4} mat mat4 to rotate
     * @param {number} angle Angle (in radians) to rotate
     * @param {vec3} axis vec3 representing the axis to rotate around
     * @param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
     *
     * @returns {mat4} dest if specified, mat otherwise
     */
    mat4.rotate = function (mat, angle, axis, dest) {
        var x = axis[0], y = axis[1], z = axis[2],
            len = Math.sqrt(x * x + y * y + z * z),
            s, c, t,
            a00, a01, a02, a03,
            a10, a11, a12, a13,
            a20, a21, a22, a23,
            b00, b01, b02,
            b10, b11, b12,
            b20, b21, b22;

        if (!len) { return null; }
        if (len !== 1) {
            len = 1 / len;
            x *= len;
            y *= len;
            z *= len;
        }

        s = Math.sin(angle);
        c = Math.cos(angle);
        t = 1 - c;

        a00 = mat[0]; a01 = mat[1]; a02 = mat[2]; a03 = mat[3];
        a10 = mat[4]; a11 = mat[5]; a12 = mat[6]; a13 = mat[7];
        a20 = mat[8]; a21 = mat[9]; a22 = mat[10]; a23 = mat[11];

        // Construct the elements of the rotation matrix
        b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
        b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
        b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

        if (!dest) {
            dest = mat;
        } else if (mat !== dest) { // If the source and destination differ, copy the unchanged last row
            dest[12] = mat[12];
            dest[13] = mat[13];
            dest[14] = mat[14];
            dest[15] = mat[15];
        }

        // Perform rotation-specific matrix multiplication
        dest[0] = a00 * b00 + a10 * b01 + a20 * b02;
        dest[1] = a01 * b00 + a11 * b01 + a21 * b02;
        dest[2] = a02 * b00 + a12 * b01 + a22 * b02;
        dest[3] = a03 * b00 + a13 * b01 + a23 * b02;

        dest[4] = a00 * b10 + a10 * b11 + a20 * b12;
        dest[5] = a01 * b10 + a11 * b11 + a21 * b12;
        dest[6] = a02 * b10 + a12 * b11 + a22 * b12;
        dest[7] = a03 * b10 + a13 * b11 + a23 * b12;

        dest[8] = a00 * b20 + a10 * b21 + a20 * b22;
        dest[9] = a01 * b20 + a11 * b21 + a21 * b22;
        dest[10] = a02 * b20 + a12 * b21 + a22 * b22;
        dest[11] = a03 * b20 + a13 * b21 + a23 * b22;
        return dest;
    };

    /**
     * Rotates a matrix by the given angle around the X axis
     *
     * @param {mat4} mat mat4 to rotate
     * @param {number} angle Angle (in radians) to rotate
     * @param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
     *
     * @returns {mat4} dest if specified, mat otherwise
     */
    mat4.rotateX = function (mat, angle, dest) {
        var s = Math.sin(angle),
            c = Math.cos(angle),
            a10 = mat[4],
            a11 = mat[5],
            a12 = mat[6],
            a13 = mat[7],
            a20 = mat[8],
            a21 = mat[9],
            a22 = mat[10],
            a23 = mat[11];

        if (!dest) {
            dest = mat;
        } else if (mat !== dest) { // If the source and destination differ, copy the unchanged rows
            dest[0] = mat[0];
            dest[1] = mat[1];
            dest[2] = mat[2];
            dest[3] = mat[3];

            dest[12] = mat[12];
            dest[13] = mat[13];
            dest[14] = mat[14];
            dest[15] = mat[15];
        }

        // Perform axis-specific matrix multiplication
        dest[4] = a10 * c + a20 * s;
        dest[5] = a11 * c + a21 * s;
        dest[6] = a12 * c + a22 * s;
        dest[7] = a13 * c + a23 * s;

        dest[8] = a10 * -s + a20 * c;
        dest[9] = a11 * -s + a21 * c;
        dest[10] = a12 * -s + a22 * c;
        dest[11] = a13 * -s + a23 * c;
        return dest;
    };

    /**
     * Rotates a matrix by the given angle around the Y axis
     *
     * @param {mat4} mat mat4 to rotate
     * @param {number} angle Angle (in radians) to rotate
     * @param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
     *
     * @returns {mat4} dest if specified, mat otherwise
     */
    mat4.rotateY = function (mat, angle, dest) {
        var s = Math.sin(angle),
            c = Math.cos(angle),
            a00 = mat[0],
            a01 = mat[1],
            a02 = mat[2],
            a03 = mat[3],
            a20 = mat[8],
            a21 = mat[9],
            a22 = mat[10],
            a23 = mat[11];

        if (!dest) {
            dest = mat;
        } else if (mat !== dest) { // If the source and destination differ, copy the unchanged rows
            dest[4] = mat[4];
            dest[5] = mat[5];
            dest[6] = mat[6];
            dest[7] = mat[7];

            dest[12] = mat[12];
            dest[13] = mat[13];
            dest[14] = mat[14];
            dest[15] = mat[15];
        }

        // Perform axis-specific matrix multiplication
        dest[0] = a00 * c + a20 * -s;
        dest[1] = a01 * c + a21 * -s;
        dest[2] = a02 * c + a22 * -s;
        dest[3] = a03 * c + a23 * -s;

        dest[8] = a00 * s + a20 * c;
        dest[9] = a01 * s + a21 * c;
        dest[10] = a02 * s + a22 * c;
        dest[11] = a03 * s + a23 * c;
        return dest;
    };

    /**
     * Rotates a matrix by the given angle around the Z axis
     *
     * @param {mat4} mat mat4 to rotate
     * @param {number} angle Angle (in radians) to rotate
     * @param {mat4} [dest] mat4 receiving operation result. If not specified result is written to mat
     *
     * @returns {mat4} dest if specified, mat otherwise
     */
    mat4.rotateZ = function (mat, angle, dest) {
        var s = Math.sin(angle),
            c = Math.cos(angle),
            a00 = mat[0],
            a01 = mat[1],
            a02 = mat[2],
            a03 = mat[3],
            a10 = mat[4],
            a11 = mat[5],
            a12 = mat[6],
            a13 = mat[7];

        if (!dest) {
            dest = mat;
        } else if (mat !== dest) { // If the source and destination differ, copy the unchanged last row
            dest[8] = mat[8];
            dest[9] = mat[9];
            dest[10] = mat[10];
            dest[11] = mat[11];

            dest[12] = mat[12];
            dest[13] = mat[13];
            dest[14] = mat[14];
            dest[15] = mat[15];
        }

        // Perform axis-specific matrix multiplication
        dest[0] = a00 * c + a10 * s;
        dest[1] = a01 * c + a11 * s;
        dest[2] = a02 * c + a12 * s;
        dest[3] = a03 * c + a13 * s;

        dest[4] = a00 * -s + a10 * c;
        dest[5] = a01 * -s + a11 * c;
        dest[6] = a02 * -s + a12 * c;
        dest[7] = a03 * -s + a13 * c;

        return dest;
    };

    /**
     * Generates a frustum matrix with the given bounds
     *
     * @param {number} left Left bound of the frustum
     * @param {number} right Right bound of the frustum
     * @param {number} bottom Bottom bound of the frustum
     * @param {number} top Top bound of the frustum
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     * @param {mat4} [dest] mat4 frustum matrix will be written into
     *
     * @returns {mat4} dest if specified, a new mat4 otherwise
     */
    mat4.frustum = function (left, right, bottom, top, near, far, dest) {
        if (!dest) { dest = mat4.create(); }
        var rl = (right - left),
            tb = (top - bottom),
            fn = (far - near);
        dest[0] = (near * 2) / rl;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 0;
        dest[4] = 0;
        dest[5] = (near * 2) / tb;
        dest[6] = 0;
        dest[7] = 0;
        dest[8] = (right + left) / rl;
        dest[9] = (top + bottom) / tb;
        dest[10] = -(far + near) / fn;
        dest[11] = -1;
        dest[12] = 0;
        dest[13] = 0;
        dest[14] = -(far * near * 2) / fn;
        dest[15] = 0;
        return dest;
    };

    /**
     * Generates a perspective projection matrix with the given bounds
     *
     * @param {number} fovy Vertical field of view
     * @param {number} aspect Aspect ratio. typically viewport width/height
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     * @param {mat4} [dest] mat4 frustum matrix will be written into
     *
     * @returns {mat4} dest if specified, a new mat4 otherwise
     */
    mat4.perspective = function (fovy, aspect, near, far, dest) {
        var top = near * Math.tan(fovy * Math.PI / 360.0),
            right = top * aspect;
        return mat4.frustum(-right, right, -top, top, near, far, dest);
    };

    /**
     * Generates a orthogonal projection matrix with the given bounds
     *
     * @param {number} left Left bound of the frustum
     * @param {number} right Right bound of the frustum
     * @param {number} bottom Bottom bound of the frustum
     * @param {number} top Top bound of the frustum
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     * @param {mat4} [dest] mat4 frustum matrix will be written into
     *
     * @returns {mat4} dest if specified, a new mat4 otherwise
     */
    mat4.ortho = function (left, right, bottom, top, near, far, dest) {
        if (!dest) { dest = mat4.create(); }
        var rl = (right - left),
            tb = (top - bottom),
            fn = (far - near);
        dest[0] = 2 / rl;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 0;
        dest[4] = 0;
        dest[5] = 2 / tb;
        dest[6] = 0;
        dest[7] = 0;
        dest[8] = 0;
        dest[9] = 0;
        dest[10] = -2 / fn;
        dest[11] = 0;
        dest[12] = -(left + right) / rl;
        dest[13] = -(top + bottom) / tb;
        dest[14] = -(far + near) / fn;
        dest[15] = 1;
        return dest;
    };

    /**
     * Generates a look-at matrix with the given eye position, focal point, and up axis
     *
     * @param {vec3} eye Position of the viewer
     * @param {vec3} center Point the viewer is looking at
     * @param {vec3} up vec3 pointing "up"
     * @param {mat4} [dest] mat4 frustum matrix will be written into
     *
     * @returns {mat4} dest if specified, a new mat4 otherwise
     */
    mat4.lookAt = function (eye, center, up, dest) {
        if (!dest) { dest = mat4.create(); }

        var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
            eyex = eye[0],
            eyey = eye[1],
            eyez = eye[2],
            upx = up[0],
            upy = up[1],
            upz = up[2],
            centerx = center[0],
            centery = center[1],
            centerz = center[2];

        if (eyex === centerx && eyey === centery && eyez === centerz) {
            return mat4.identity(dest);
        }

        //vec3.direction(eye, center, z);
        z0 = eyex - centerx;
        z1 = eyey - centery;
        z2 = eyez - centerz;

        // normalize (no check needed for 0 because of early return)
        len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;

        //vec3.normalize(vec3.cross(up, z, x));
        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;
        len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if (!len) {
            x0 = 0;
            x1 = 0;
            x2 = 0;
        } else {
            len = 1 / len;
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }

        //vec3.normalize(vec3.cross(z, x, y));
        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;

        len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if (!len) {
            y0 = 0;
            y1 = 0;
            y2 = 0;
        } else {
            len = 1 / len;
            y0 *= len;
            y1 *= len;
            y2 *= len;
        }

        dest[0] = x0;
        dest[1] = y0;
        dest[2] = z0;
        dest[3] = 0;
        dest[4] = x1;
        dest[5] = y1;
        dest[6] = z1;
        dest[7] = 0;
        dest[8] = x2;
        dest[9] = y2;
        dest[10] = z2;
        dest[11] = 0;
        dest[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        dest[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        dest[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        dest[15] = 1;

        return dest;
    };

    /**
     * Creates a matrix from a quaternion rotation and vector translation
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, vec);
     *     var quatMat = mat4.create();
     *     quat4.toMat4(quat, quatMat);
     *     mat4.multiply(dest, quatMat);
     *
     * @param {quat4} quat Rotation quaternion
     * @param {vec3} vec Translation vector
     * @param {mat4} [dest] mat4 receiving operation result. If not specified result is written to a new mat4
     *
     * @returns {mat4} dest if specified, a new mat4 otherwise
     */
    mat4.fromRotationTranslation = function (quat, vec, dest) {
        if (!dest) { dest = mat4.create(); }

        // Quaternion math
        var x = quat[0], y = quat[1], z = quat[2], w = quat[3],
            x2 = x + x,
            y2 = y + y,
            z2 = z + z,

            xx = x * x2,
            xy = x * y2,
            xz = x * z2,
            yy = y * y2,
            yz = y * z2,
            zz = z * z2,
            wx = w * x2,
            wy = w * y2,
            wz = w * z2;

        dest[0] = 1 - (yy + zz);
        dest[1] = xy + wz;
        dest[2] = xz - wy;
        dest[3] = 0;
        dest[4] = xy - wz;
        dest[5] = 1 - (xx + zz);
        dest[6] = yz + wx;
        dest[7] = 0;
        dest[8] = xz + wy;
        dest[9] = yz - wx;
        dest[10] = 1 - (xx + yy);
        dest[11] = 0;
        dest[12] = vec[0];
        dest[13] = vec[1];
        dest[14] = vec[2];
        dest[15] = 1;
        
        return dest;
    };

    /**
     * Returns a string representation of a mat4
     *
     * @param {mat4} mat mat4 to represent as a string
     *
     * @returns {string} String representation of mat
     */
    mat4.str = function (mat) {
        return '[' + mat[0] + ', ' + mat[1] + ', ' + mat[2] + ', ' + mat[3] +
            ', ' + mat[4] + ', ' + mat[5] + ', ' + mat[6] + ', ' + mat[7] +
            ', ' + mat[8] + ', ' + mat[9] + ', ' + mat[10] + ', ' + mat[11] +
            ', ' + mat[12] + ', ' + mat[13] + ', ' + mat[14] + ', ' + mat[15] + ']';
    };

    /**
     * @class Quaternion
     * @name quat4
     */
    var quat4 = {};

    /**
     * Creates a new instance of a quat4 using the default array type
     * Any javascript array containing at least 4 numeric elements can serve as a quat4
     *
     * @param {quat4} [quat] quat4 containing values to initialize with
     *
     * @returns {quat4} New quat4
     */
    quat4.create = function (quat) {
        var dest = new MatrixArray(4);

        if (quat) {
            dest[0] = quat[0];
            dest[1] = quat[1];
            dest[2] = quat[2];
            dest[3] = quat[3];
        } else {
            dest[0] = dest[1] = dest[2] = dest[3] = 0;
        }

        return dest;
    };

    /**
     * Creates a new instance of a quat4, initializing it with the given arguments
     *
     * @param {number} x X value
     * @param {number} y Y value
     * @param {number} z Z value
     * @param {number} w W value

     * @returns {quat4} New quat4
     */
    quat4.createFrom = function (x, y, z, w) {
        var dest = new MatrixArray(4);

        dest[0] = x;
        dest[1] = y;
        dest[2] = z;
        dest[3] = w;

        return dest;
    };

    /**
     * Copies the values of one quat4 to another
     *
     * @param {quat4} quat quat4 containing values to copy
     * @param {quat4} dest quat4 receiving copied values
     *
     * @returns {quat4} dest
     */
    quat4.set = function (quat, dest) {
        dest[0] = quat[0];
        dest[1] = quat[1];
        dest[2] = quat[2];
        dest[3] = quat[3];

        return dest;
    };

    /**
     * Compares two quaternions for equality within a certain margin of error
     *
     * @param {quat4} a First vector
     * @param {quat4} b Second vector
     *
     * @returns {Boolean} True if a is equivalent to b
     */
    quat4.equal = function (a, b) {
        return a === b || (
            Math.abs(a[0] - b[0]) < FLOAT_EPSILON &&
            Math.abs(a[1] - b[1]) < FLOAT_EPSILON &&
            Math.abs(a[2] - b[2]) < FLOAT_EPSILON &&
            Math.abs(a[3] - b[3]) < FLOAT_EPSILON
        );
    };

    /**
     * Creates a new identity Quat4
     *
     * @param {quat4} [dest] quat4 receiving copied values
     *
     * @returns {quat4} dest is specified, new quat4 otherwise
     */
    quat4.identity = function (dest) {
        if (!dest) { dest = quat4.create(); }
        dest[0] = 0;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 1;
        return dest;
    };

    var identityQuat4 = quat4.identity();

    /**
     * Calculates the W component of a quat4 from the X, Y, and Z components.
     * Assumes that quaternion is 1 unit in length.
     * Any existing W component will be ignored.
     *
     * @param {quat4} quat quat4 to calculate W component of
     * @param {quat4} [dest] quat4 receiving calculated values. If not specified result is written to quat
     *
     * @returns {quat4} dest if specified, quat otherwise
     */
    quat4.calculateW = function (quat, dest) {
        var x = quat[0], y = quat[1], z = quat[2];

        if (!dest || quat === dest) {
            quat[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
            return quat;
        }
        dest[0] = x;
        dest[1] = y;
        dest[2] = z;
        dest[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
        return dest;
    };

    /**
     * Calculates the dot product of two quaternions
     *
     * @param {quat4} quat First operand
     * @param {quat4} quat2 Second operand
     *
     * @return {number} Dot product of quat and quat2
     */
    quat4.dot = function(quat, quat2){
        return quat[0]*quat2[0] + quat[1]*quat2[1] + quat[2]*quat2[2] + quat[3]*quat2[3];
    };

    /**
     * Calculates the inverse of a quat4
     *
     * @param {quat4} quat quat4 to calculate inverse of
     * @param {quat4} [dest] quat4 receiving inverse values. If not specified result is written to quat
     *
     * @returns {quat4} dest if specified, quat otherwise
     */
    quat4.inverse = function(quat, dest) {
        var q0 = quat[0], q1 = quat[1], q2 = quat[2], q3 = quat[3],
            dot = q0*q0 + q1*q1 + q2*q2 + q3*q3,
            invDot = dot ? 1.0/dot : 0;
        
        // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0
        
        if(!dest || quat === dest) {
            quat[0] *= -invDot;
            quat[1] *= -invDot;
            quat[2] *= -invDot;
            quat[3] *= invDot;
            return quat;
        }
        dest[0] = -quat[0]*invDot;
        dest[1] = -quat[1]*invDot;
        dest[2] = -quat[2]*invDot;
        dest[3] = quat[3]*invDot;
        return dest;
    };


    /**
     * Calculates the conjugate of a quat4
     * If the quaternion is normalized, this function is faster than quat4.inverse and produces the same result.
     *
     * @param {quat4} quat quat4 to calculate conjugate of
     * @param {quat4} [dest] quat4 receiving conjugate values. If not specified result is written to quat
     *
     * @returns {quat4} dest if specified, quat otherwise
     */
    quat4.conjugate = function (quat, dest) {
        if (!dest || quat === dest) {
            quat[0] *= -1;
            quat[1] *= -1;
            quat[2] *= -1;
            return quat;
        }
        dest[0] = -quat[0];
        dest[1] = -quat[1];
        dest[2] = -quat[2];
        dest[3] = quat[3];
        return dest;
    };

    /**
     * Calculates the length of a quat4
     *
     * Params:
     * @param {quat4} quat quat4 to calculate length of
     *
     * @returns Length of quat
     */
    quat4.length = function (quat) {
        var x = quat[0], y = quat[1], z = quat[2], w = quat[3];
        return Math.sqrt(x * x + y * y + z * z + w * w);
    };

    /**
     * Generates a unit quaternion of the same direction as the provided quat4
     * If quaternion length is 0, returns [0, 0, 0, 0]
     *
     * @param {quat4} quat quat4 to normalize
     * @param {quat4} [dest] quat4 receiving operation result. If not specified result is written to quat
     *
     * @returns {quat4} dest if specified, quat otherwise
     */
    quat4.normalize = function (quat, dest) {
        if (!dest) { dest = quat; }

        var x = quat[0], y = quat[1], z = quat[2], w = quat[3],
            len = Math.sqrt(x * x + y * y + z * z + w * w);
        if (len === 0) {
            dest[0] = 0;
            dest[1] = 0;
            dest[2] = 0;
            dest[3] = 0;
            return dest;
        }
        len = 1 / len;
        dest[0] = x * len;
        dest[1] = y * len;
        dest[2] = z * len;
        dest[3] = w * len;

        return dest;
    };

    /**
     * Performs quaternion addition
     *
     * @param {quat4} quat First operand
     * @param {quat4} quat2 Second operand
     * @param {quat4} [dest] quat4 receiving operation result. If not specified result is written to quat
     *
     * @returns {quat4} dest if specified, quat otherwise
     */
    quat4.add = function (quat, quat2, dest) {
        if(!dest || quat === dest) {
            quat[0] += quat2[0];
            quat[1] += quat2[1];
            quat[2] += quat2[2];
            quat[3] += quat2[3];
            return quat;
        }
        dest[0] = quat[0]+quat2[0];
        dest[1] = quat[1]+quat2[1];
        dest[2] = quat[2]+quat2[2];
        dest[3] = quat[3]+quat2[3];
        return dest;
    };

    /**
     * Performs a quaternion multiplication
     *
     * @param {quat4} quat First operand
     * @param {quat4} quat2 Second operand
     * @param {quat4} [dest] quat4 receiving operation result. If not specified result is written to quat
     *
     * @returns {quat4} dest if specified, quat otherwise
     */
    quat4.multiply = function (quat, quat2, dest) {
        if (!dest) { dest = quat; }

        var qax = quat[0], qay = quat[1], qaz = quat[2], qaw = quat[3],
            qbx = quat2[0], qby = quat2[1], qbz = quat2[2], qbw = quat2[3];

        dest[0] = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        dest[1] = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        dest[2] = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        dest[3] = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

        return dest;
    };

    /**
     * Transforms a vec3 with the given quaternion
     *
     * @param {quat4} quat quat4 to transform the vector with
     * @param {vec3} vec vec3 to transform
     * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
     *
     * @returns dest if specified, vec otherwise
     */
    quat4.multiplyVec3 = function (quat, vec, dest) {
        if (!dest) { dest = vec; }

        var x = vec[0], y = vec[1], z = vec[2],
            qx = quat[0], qy = quat[1], qz = quat[2], qw = quat[3],

            // calculate quat * vec
            ix = qw * x + qy * z - qz * y,
            iy = qw * y + qz * x - qx * z,
            iz = qw * z + qx * y - qy * x,
            iw = -qx * x - qy * y - qz * z;

        // calculate result * inverse quat
        dest[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        dest[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        dest[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;

        return dest;
    };

    /**
     * Multiplies the components of a quaternion by a scalar value
     *
     * @param {quat4} quat to scale
     * @param {number} val Value to scale by
     * @param {quat4} [dest] quat4 receiving operation result. If not specified result is written to quat
     *
     * @returns {quat4} dest if specified, quat otherwise
     */
    quat4.scale = function (quat, val, dest) {
        if(!dest || quat === dest) {
            quat[0] *= val;
            quat[1] *= val;
            quat[2] *= val;
            quat[3] *= val;
            return quat;
        }
        dest[0] = quat[0]*val;
        dest[1] = quat[1]*val;
        dest[2] = quat[2]*val;
        dest[3] = quat[3]*val;
        return dest;
    };

    /**
     * Calculates a 3x3 matrix from the given quat4
     *
     * @param {quat4} quat quat4 to create matrix from
     * @param {mat3} [dest] mat3 receiving operation result
     *
     * @returns {mat3} dest if specified, a new mat3 otherwise
     */
    quat4.toMat3 = function (quat, dest) {
        if (!dest) { dest = mat3.create(); }

        var x = quat[0], y = quat[1], z = quat[2], w = quat[3],
            x2 = x + x,
            y2 = y + y,
            z2 = z + z,

            xx = x * x2,
            xy = x * y2,
            xz = x * z2,
            yy = y * y2,
            yz = y * z2,
            zz = z * z2,
            wx = w * x2,
            wy = w * y2,
            wz = w * z2;

        dest[0] = 1 - (yy + zz);
        dest[1] = xy + wz;
        dest[2] = xz - wy;

        dest[3] = xy - wz;
        dest[4] = 1 - (xx + zz);
        dest[5] = yz + wx;

        dest[6] = xz + wy;
        dest[7] = yz - wx;
        dest[8] = 1 - (xx + yy);

        return dest;
    };

    /**
     * Calculates a 4x4 matrix from the given quat4
     *
     * @param {quat4} quat quat4 to create matrix from
     * @param {mat4} [dest] mat4 receiving operation result
     *
     * @returns {mat4} dest if specified, a new mat4 otherwise
     */
    quat4.toMat4 = function (quat, dest) {
        if (!dest) { dest = mat4.create(); }

        var x = quat[0], y = quat[1], z = quat[2], w = quat[3],
            x2 = x + x,
            y2 = y + y,
            z2 = z + z,

            xx = x * x2,
            xy = x * y2,
            xz = x * z2,
            yy = y * y2,
            yz = y * z2,
            zz = z * z2,
            wx = w * x2,
            wy = w * y2,
            wz = w * z2;

        dest[0] = 1 - (yy + zz);
        dest[1] = xy + wz;
        dest[2] = xz - wy;
        dest[3] = 0;

        dest[4] = xy - wz;
        dest[5] = 1 - (xx + zz);
        dest[6] = yz + wx;
        dest[7] = 0;

        dest[8] = xz + wy;
        dest[9] = yz - wx;
        dest[10] = 1 - (xx + yy);
        dest[11] = 0;

        dest[12] = 0;
        dest[13] = 0;
        dest[14] = 0;
        dest[15] = 1;

        return dest;
    };

    /**
     * Performs a spherical linear interpolation between two quat4
     *
     * @param {quat4} quat First quaternion
     * @param {quat4} quat2 Second quaternion
     * @param {number} slerp Interpolation amount between the two inputs
     * @param {quat4} [dest] quat4 receiving operation result. If not specified result is written to quat
     *
     * @returns {quat4} dest if specified, quat otherwise
     */
    quat4.slerp = function (quat, quat2, slerp, dest) {
        if (!dest) { dest = quat; }

        var cosHalfTheta = quat[0] * quat2[0] + quat[1] * quat2[1] + quat[2] * quat2[2] + quat[3] * quat2[3],
            halfTheta,
            sinHalfTheta,
            ratioA,
            ratioB;

        if (Math.abs(cosHalfTheta) >= 1.0) {
            if (dest !== quat) {
                dest[0] = quat[0];
                dest[1] = quat[1];
                dest[2] = quat[2];
                dest[3] = quat[3];
            }
            return dest;
        }

        halfTheta = Math.acos(cosHalfTheta);
        sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

        if (Math.abs(sinHalfTheta) < 0.001) {
            dest[0] = (quat[0] * 0.5 + quat2[0] * 0.5);
            dest[1] = (quat[1] * 0.5 + quat2[1] * 0.5);
            dest[2] = (quat[2] * 0.5 + quat2[2] * 0.5);
            dest[3] = (quat[3] * 0.5 + quat2[3] * 0.5);
            return dest;
        }

        ratioA = Math.sin((1 - slerp) * halfTheta) / sinHalfTheta;
        ratioB = Math.sin(slerp * halfTheta) / sinHalfTheta;

        dest[0] = (quat[0] * ratioA + quat2[0] * ratioB);
        dest[1] = (quat[1] * ratioA + quat2[1] * ratioB);
        dest[2] = (quat[2] * ratioA + quat2[2] * ratioB);
        dest[3] = (quat[3] * ratioA + quat2[3] * ratioB);

        return dest;
    };

    /**
     * Creates a quaternion from the given 3x3 rotation matrix.
     * If dest is omitted, a new quaternion will be created.
     *
     * @param {mat3}  mat    the rotation matrix
     * @param {quat4} [dest] an optional receiving quaternion
     *
     * @returns {quat4} the quaternion constructed from the rotation matrix
     *
     */
    quat4.fromRotationMatrix = function(mat, dest) {
        if (!dest) dest = quat4.create();
        
        // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
        // article "Quaternion Calculus and Fast Animation".

        var fTrace = mat[0] + mat[4] + mat[8];
        var fRoot;

        if ( fTrace > 0.0 ) {
            // |w| > 1/2, may as well choose w > 1/2
            fRoot = Math.sqrt(fTrace + 1.0);  // 2w
            dest[3] = 0.5 * fRoot;
            fRoot = 0.5/fRoot;  // 1/(4w)
            dest[0] = (mat[7]-mat[5])*fRoot;
            dest[1] = (mat[2]-mat[6])*fRoot;
            dest[2] = (mat[3]-mat[1])*fRoot;
        } else {
            // |w| <= 1/2
            var s_iNext = quat4.fromRotationMatrix.s_iNext = quat4.fromRotationMatrix.s_iNext || [1,2,0];
            var i = 0;
            if ( mat[4] > mat[0] )
              i = 1;
            if ( mat[8] > mat[i*3+i] )
              i = 2;
            var j = s_iNext[i];
            var k = s_iNext[j];
            
            fRoot = Math.sqrt(mat[i*3+i]-mat[j*3+j]-mat[k*3+k] + 1.0);
            dest[i] = 0.5 * fRoot;
            fRoot = 0.5 / fRoot;
            dest[3] = (mat[k*3+j] - mat[j*3+k]) * fRoot;
            dest[j] = (mat[j*3+i] + mat[i*3+j]) * fRoot;
            dest[k] = (mat[k*3+i] + mat[i*3+k]) * fRoot;
        }
        
        return dest;
    };

    /**
     * Alias. See the description for quat4.fromRotationMatrix().
     */
    mat3.toQuat4 = quat4.fromRotationMatrix;

    (function() {
        var mat = mat3.create();
        
        /**
         * Creates a quaternion from the 3 given vectors. They must be perpendicular
         * to one another and represent the X, Y and Z axes.
         *
         * If dest is omitted, a new quat4 will be created.
         *
         * Example: The default OpenGL orientation has a view vector [0, 0, -1],
         * right vector [1, 0, 0], and up vector [0, 1, 0]. A quaternion representing
         * this orientation could be constructed with:
         *
         *   quat = quat4.fromAxes([0, 0, -1], [1, 0, 0], [0, 1, 0], quat4.create());
         *
         * @param {vec3}  view   the view vector, or direction the object is pointing in
         * @param {vec3}  right  the right vector, or direction to the "right" of the object
         * @param {vec3}  up     the up vector, or direction towards the object's "up"
         * @param {quat4} [dest] an optional receiving quat4
         *
         * @returns {quat4} dest
         **/
        quat4.fromAxes = function(view, right, up, dest) {
            mat[0] = right[0];
            mat[3] = right[1];
            mat[6] = right[2];

            mat[1] = up[0];
            mat[4] = up[1];
            mat[7] = up[2];

            mat[2] = view[0];
            mat[5] = view[1];
            mat[8] = view[2];

            return quat4.fromRotationMatrix(mat, dest);
        };
    })();

    /**
     * Sets a quat4 to the Identity and returns it.
     *
     * @param {quat4} [dest] quat4 to set. If omitted, a
     * new quat4 will be created.
     *
     * @returns {quat4} dest
     */
    quat4.identity = function(dest) {
        if (!dest) dest = quat4.create();
        dest[0] = 0;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 1;
        return dest;
    };

    /**
     * Sets a quat4 from the given angle and rotation axis,
     * then returns it. If dest is not given, a new quat4 is created.
     *
     * @param {Number} angle  the angle in radians
     * @param {vec3}   axis   the axis around which to rotate
     * @param {quat4}  [dest] the optional quat4 to store the result
     *
     * @returns {quat4} dest
     **/
    quat4.fromAngleAxis = function(angle, axis, dest) {
        // The quaternion representing the rotation is
        //   q = cos(A/2)+sin(A/2)*(x*i+y*j+z*k)
        if (!dest) dest = quat4.create();
        
        var half = angle * 0.5;
        var s = Math.sin(half);
        dest[3] = Math.cos(half);
        dest[0] = s * axis[0];
        dest[1] = s * axis[1];
        dest[2] = s * axis[2];
        
        return dest;
    };

    /**
     * Stores the angle and axis in a vec4, where the XYZ components represent
     * the axis and the W (4th) component is the angle in radians.
     *
     * If dest is not given, src will be modified in place and returned, after
     * which it should not be considered not a quaternion (just an axis and angle).
     *
     * @param {quat4} quat   the quaternion whose angle and axis to store
     * @param {vec4}  [dest] the optional vec4 to receive the data
     *
     * @returns {vec4} dest
     */
    quat4.toAngleAxis = function(src, dest) {
        if (!dest) dest = src;
        // The quaternion representing the rotation is
        //   q = cos(A/2)+sin(A/2)*(x*i+y*j+z*k)

        var sqrlen = src[0]*src[0]+src[1]*src[1]+src[2]*src[2];
        if (sqrlen > 0)
        {
            dest[3] = 2 * Math.acos(src[3]);
            var invlen = glMath.invsqrt(sqrlen);
            dest[0] = src[0]*invlen;
            dest[1] = src[1]*invlen;
            dest[2] = src[2]*invlen;
        } else {
            // angle is 0 (mod 2*pi), so any axis will do
            dest[3] = 0;
            dest[0] = 1;
            dest[1] = 0;
            dest[2] = 0;
        }
        
        return dest;
    };

    /**
     * Returns a string representation of a quaternion
     *
     * @param {quat4} quat quat4 to represent as a string
     *
     * @returns {string} String representation of quat
     */
    quat4.str = function (quat) {
        return '[' + quat[0] + ', ' + quat[1] + ', ' + quat[2] + ', ' + quat[3] + ']';
    };
    
    /**
     * @class 2 Dimensional Vector
     * @name vec2
     */
    var vec2 = {};
     
    /**
     * Creates a new vec2, initializing it from vec if vec
     * is given.
     *
     * @param {vec2} [vec] the vector's initial contents
     * @returns {vec2} a new 2D vector
     */
    vec2.create = function(vec) {
        var dest = new MatrixArray(2);

        if (vec) {
            dest[0] = vec[0];
            dest[1] = vec[1];
        } else {
            dest[0] = 0;
            dest[1] = 0;
        }
        return dest;
    };

    /**
     * Creates a new instance of a vec2, initializing it with the given arguments
     *
     * @param {number} x X value
     * @param {number} y Y value

     * @returns {vec2} New vec2
     */
    vec2.createFrom = function (x, y) {
        var dest = new MatrixArray(2);

        dest[0] = x;
        dest[1] = y;

        return dest;
    };
    
    /**
     * Adds the vec2's together. If dest is given, the result
     * is stored there. Otherwise, the result is stored in vecB.
     *
     * @param {vec2} vecA the first operand
     * @param {vec2} vecB the second operand
     * @param {vec2} [dest] the optional receiving vector
     * @returns {vec2} dest
     */
    vec2.add = function(vecA, vecB, dest) {
        if (!dest) dest = vecB;
        dest[0] = vecA[0] + vecB[0];
        dest[1] = vecA[1] + vecB[1];
        return dest;
    };
    
    /**
     * Subtracts vecB from vecA. If dest is given, the result
     * is stored there. Otherwise, the result is stored in vecB.
     *
     * @param {vec2} vecA the first operand
     * @param {vec2} vecB the second operand
     * @param {vec2} [dest] the optional receiving vector
     * @returns {vec2} dest
     */
    vec2.subtract = function(vecA, vecB, dest) {
        if (!dest) dest = vecB;
        dest[0] = vecA[0] - vecB[0];
        dest[1] = vecA[1] - vecB[1];
        return dest;
    };
    
    /**
     * Multiplies vecA with vecB. If dest is given, the result
     * is stored there. Otherwise, the result is stored in vecB.
     *
     * @param {vec2} vecA the first operand
     * @param {vec2} vecB the second operand
     * @param {vec2} [dest] the optional receiving vector
     * @returns {vec2} dest
     */
    vec2.multiply = function(vecA, vecB, dest) {
        if (!dest) dest = vecB;
        dest[0] = vecA[0] * vecB[0];
        dest[1] = vecA[1] * vecB[1];
        return dest;
    };
    
    /**
     * Divides vecA by vecB. If dest is given, the result
     * is stored there. Otherwise, the result is stored in vecB.
     *
     * @param {vec2} vecA the first operand
     * @param {vec2} vecB the second operand
     * @param {vec2} [dest] the optional receiving vector
     * @returns {vec2} dest
     */
    vec2.divide = function(vecA, vecB, dest) {
        if (!dest) dest = vecB;
        dest[0] = vecA[0] / vecB[0];
        dest[1] = vecA[1] / vecB[1];
        return dest;
    };
    
    /**
     * Scales vecA by some scalar number. If dest is given, the result
     * is stored there. Otherwise, the result is stored in vecA.
     *
     * This is the same as multiplying each component of vecA
     * by the given scalar.
     *
     * @param {vec2}   vecA the vector to be scaled
     * @param {Number} scalar the amount to scale the vector by
     * @param {vec2}   [dest] the optional receiving vector
     * @returns {vec2} dest
     */
    vec2.scale = function(vecA, scalar, dest) {
        if (!dest) dest = vecA;
        dest[0] = vecA[0] * scalar;
        dest[1] = vecA[1] * scalar;
        return dest;
    };

    /**
     * Calculates the euclidian distance between two vec2
     *
     * Params:
     * @param {vec2} vecA First vector
     * @param {vec2} vecB Second vector
     *
     * @returns {number} Distance between vecA and vecB
     */
    vec2.dist = function (vecA, vecB) {
        var x = vecB[0] - vecA[0],
            y = vecB[1] - vecA[1];
        return Math.sqrt(x*x + y*y);
    };

    /**
     * Copies the values of one vec2 to another
     *
     * @param {vec2} vec vec2 containing values to copy
     * @param {vec2} dest vec2 receiving copied values
     *
     * @returns {vec2} dest
     */
    vec2.set = function (vec, dest) {
        dest[0] = vec[0];
        dest[1] = vec[1];
        return dest;
    };

    /**
     * Compares two vectors for equality within a certain margin of error
     *
     * @param {vec2} a First vector
     * @param {vec2} b Second vector
     *
     * @returns {Boolean} True if a is equivalent to b
     */
    vec2.equal = function (a, b) {
        return a === b || (
            Math.abs(a[0] - b[0]) < FLOAT_EPSILON &&
            Math.abs(a[1] - b[1]) < FLOAT_EPSILON
        );
    };

    /**
     * Negates the components of a vec2
     *
     * @param {vec2} vec vec2 to negate
     * @param {vec2} [dest] vec2 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec2} dest if specified, vec otherwise
     */
    vec2.negate = function (vec, dest) {
        if (!dest) { dest = vec; }
        dest[0] = -vec[0];
        dest[1] = -vec[1];
        return dest;
    };

    /**
     * Normlize a vec2
     *
     * @param {vec2} vec vec2 to normalize
     * @param {vec2} [dest] vec2 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec2} dest if specified, vec otherwise
     */
    vec2.normalize = function (vec, dest) {
        if (!dest) { dest = vec; }
        var mag = vec[0] * vec[0] + vec[1] * vec[1];
        if (mag > 0) {
            mag = Math.sqrt(mag);
            dest[0] = vec[0] / mag;
            dest[1] = vec[1] / mag;
        } else {
            dest[0] = dest[1] = 0;
        }
        return dest;
    };

    /**
     * Computes the cross product of two vec2's. Note that the cross product must by definition
     * produce a 3D vector. If a dest vector is given, it will contain the resultant 3D vector.
     * Otherwise, a scalar number will be returned, representing the vector's Z coordinate, since
     * its X and Y must always equal 0.
     *
     * Examples:
     *    var crossResult = vec3.create();
     *    vec2.cross([1, 2], [3, 4], crossResult);
     *    //=> [0, 0, -2]
     *
     *    vec2.cross([1, 2], [3, 4]);
     *    //=> -2
     *
     * See http://stackoverflow.com/questions/243945/calculating-a-2d-vectors-cross-product
     * for some interesting facts.
     *
     * @param {vec2} vecA left operand
     * @param {vec2} vecB right operand
     * @param {vec2} [dest] optional vec2 receiving result. If not specified a scalar is returned
     *
     */
    vec2.cross = function (vecA, vecB, dest) {
        var z = vecA[0] * vecB[1] - vecA[1] * vecB[0];
        if (!dest) return z;
        dest[0] = dest[1] = 0;
        dest[2] = z;
        return dest;
    };
    
    /**
     * Caclulates the length of a vec2
     *
     * @param {vec2} vec vec2 to calculate length of
     *
     * @returns {Number} Length of vec
     */
    vec2.length = function (vec) {
      var x = vec[0], y = vec[1];
      return Math.sqrt(x * x + y * y);
    };

    /**
     * Caclulates the squared length of a vec2
     *
     * @param {vec2} vec vec2 to calculate squared length of
     *
     * @returns {Number} Squared Length of vec
     */
    vec2.squaredLength = function (vec) {
      var x = vec[0], y = vec[1];
      return x * x + y * y;
    };

    /**
     * Caclulates the dot product of two vec2s
     *
     * @param {vec2} vecA First operand
     * @param {vec2} vecB Second operand
     *
     * @returns {Number} Dot product of vecA and vecB
     */
    vec2.dot = function (vecA, vecB) {
        return vecA[0] * vecB[0] + vecA[1] * vecB[1];
    };
    
    /**
     * Generates a 2D unit vector pointing from one vector to another
     *
     * @param {vec2} vecA Origin vec2
     * @param {vec2} vecB vec2 to point to
     * @param {vec2} [dest] vec2 receiving operation result. If not specified result is written to vecA
     *
     * @returns {vec2} dest if specified, vecA otherwise
     */
    vec2.direction = function (vecA, vecB, dest) {
        if (!dest) { dest = vecA; }

        var x = vecA[0] - vecB[0],
            y = vecA[1] - vecB[1],
            len = x * x + y * y;

        if (!len) {
            dest[0] = 0;
            dest[1] = 0;
            dest[2] = 0;
            return dest;
        }

        len = 1 / Math.sqrt(len);
        dest[0] = x * len;
        dest[1] = y * len;
        return dest;
    };

    /**
     * Performs a linear interpolation between two vec2
     *
     * @param {vec2} vecA First vector
     * @param {vec2} vecB Second vector
     * @param {Number} lerp Interpolation amount between the two inputs
     * @param {vec2} [dest] vec2 receiving operation result. If not specified result is written to vecA
     *
     * @returns {vec2} dest if specified, vecA otherwise
     */
    vec2.lerp = function (vecA, vecB, lerp, dest) {
        if (!dest) { dest = vecA; }
        dest[0] = vecA[0] + lerp * (vecB[0] - vecA[0]);
        dest[1] = vecA[1] + lerp * (vecB[1] - vecA[1]);
        return dest;
    };

    /**
     * Returns a string representation of a vector
     *
     * @param {vec2} vec Vector to represent as a string
     *
     * @returns {String} String representation of vec
     */
    vec2.str = function (vec) {
        return '[' + vec[0] + ', ' + vec[1] + ']';
    };
    
    /**
     * @class 2x2 Matrix
     * @name mat2
     */
    var mat2 = {};
    
    /**
     * Creates a new 2x2 matrix. If src is given, the new matrix
     * is initialized to those values.
     *
     * @param {mat2} [src] the seed values for the new matrix, if any
     * @returns {mat2} a new matrix
     */
    mat2.create = function(src) {
        var dest = new MatrixArray(4);
        
        if (src) {
            dest[0] = src[0];
            dest[1] = src[1];
            dest[2] = src[2];
            dest[3] = src[3];
        } else {
            dest[0] = dest[1] = dest[2] = dest[3] = 0;
        }
        return dest;
    };

    /**
     * Creates a new instance of a mat2, initializing it with the given arguments
     *
     * @param {number} m00
     * @param {number} m01
     * @param {number} m10
     * @param {number} m11

     * @returns {mat2} New mat2
     */
    mat2.createFrom = function (m00, m01, m10, m11) {
        var dest = new MatrixArray(4);

        dest[0] = m00;
        dest[1] = m01;
        dest[2] = m10;
        dest[3] = m11;

        return dest;
    };
    
    /**
     * Copies the values of one mat2 to another
     *
     * @param {mat2} mat mat2 containing values to copy
     * @param {mat2} dest mat2 receiving copied values
     *
     * @returns {mat2} dest
     */
    mat2.set = function (mat, dest) {
        dest[0] = mat[0];
        dest[1] = mat[1];
        dest[2] = mat[2];
        dest[3] = mat[3];
        return dest;
    };

    /**
     * Compares two matrices for equality within a certain margin of error
     *
     * @param {mat2} a First matrix
     * @param {mat2} b Second matrix
     *
     * @returns {Boolean} True if a is equivalent to b
     */
    mat2.equal = function (a, b) {
        return a === b || (
            Math.abs(a[0] - b[0]) < FLOAT_EPSILON &&
            Math.abs(a[1] - b[1]) < FLOAT_EPSILON &&
            Math.abs(a[2] - b[2]) < FLOAT_EPSILON &&
            Math.abs(a[3] - b[3]) < FLOAT_EPSILON
        );
    };

    /**
     * Sets a mat2 to an identity matrix
     *
     * @param {mat2} [dest] mat2 to set. If omitted a new one will be created.
     *
     * @returns {mat2} dest
     */
    mat2.identity = function (dest) {
        if (!dest) { dest = mat2.create(); }
        dest[0] = 1;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 1;
        return dest;
    };

    /**
     * Transposes a mat2 (flips the values over the diagonal)
     *
     * @param {mat2} mat mat2 to transpose
     * @param {mat2} [dest] mat2 receiving transposed values. If not specified result is written to mat
     *
     * @param {mat2} dest if specified, mat otherwise
     */
    mat2.transpose = function (mat, dest) {
        // If we are transposing ourselves we can skip a few steps but have to cache some values
        if (!dest || mat === dest) {
            var a00 = mat[1];
            mat[1] = mat[2];
            mat[2] = a00;
            return mat;
        }
        
        dest[0] = mat[0];
        dest[1] = mat[2];
        dest[2] = mat[1];
        dest[3] = mat[3];
        return dest;
    };

    /**
     * Calculates the determinant of a mat2
     *
     * @param {mat2} mat mat2 to calculate determinant of
     *
     * @returns {Number} determinant of mat
     */
    mat2.determinant = function (mat) {
      return mat[0] * mat[3] - mat[2] * mat[1];
    };
    
    /**
     * Calculates the inverse matrix of a mat2
     *
     * @param {mat2} mat mat2 to calculate inverse of
     * @param {mat2} [dest] mat2 receiving inverse matrix. If not specified result is written to mat
     *
     * @param {mat2} dest is specified, mat otherwise, null if matrix cannot be inverted
     */
    mat2.inverse = function (mat, dest) {
        if (!dest) { dest = mat; }
        var a0 = mat[0], a1 = mat[1], a2 = mat[2], a3 = mat[3];
        var det = a0 * a3 - a2 * a1;
        if (!det) return null;
        
        det = 1.0 / det;
        dest[0] =  a3 * det;
        dest[1] = -a1 * det;
        dest[2] = -a2 * det;
        dest[3] =  a0 * det;
        return dest;
    };
    
    /**
     * Performs a matrix multiplication
     *
     * @param {mat2} matA First operand
     * @param {mat2} matB Second operand
     * @param {mat2} [dest] mat2 receiving operation result. If not specified result is written to matA
     *
     * @returns {mat2} dest if specified, matA otherwise
     */
    mat2.multiply = function (matA, matB, dest) {
        if (!dest) { dest = matA; }
        var a11 = matA[0],
            a12 = matA[1],
            a21 = matA[2],
            a22 = matA[3];
        dest[0] = a11 * matB[0] + a12 * matB[2];
        dest[1] = a11 * matB[1] + a12 * matB[3];
        dest[2] = a21 * matB[0] + a22 * matB[2];
        dest[3] = a21 * matB[1] + a22 * matB[3];
        return dest;
    };

    /**
     * Rotates a 2x2 matrix by an angle
     *
     * @param {mat2}   mat   The matrix to rotate
     * @param {Number} angle The angle in radians
     * @param {mat2} [dest]  Optional mat2 receiving the result. If omitted mat will be used.
     *
     * @returns {mat2} dest if specified, mat otherwise
     */
    mat2.rotate = function (mat, angle, dest) {
        if (!dest) { dest = mat; }
        var a11 = mat[0],
            a12 = mat[1],
            a21 = mat[2],
            a22 = mat[3],
            s = Math.sin(angle),
            c = Math.cos(angle);
        dest[0] = a11 *  c + a12 * s;
        dest[1] = a11 * -s + a12 * c;
        dest[2] = a21 *  c + a22 * s;
        dest[3] = a21 * -s + a22 * c;
        return dest;
    };

    /**
     * Multiplies the vec2 by the given 2x2 matrix
     *
     * @param {mat2} matrix the 2x2 matrix to multiply against
     * @param {vec2} vec    the vector to multiply
     * @param {vec2} [dest] an optional receiving vector. If not given, vec is used.
     *
     * @returns {vec2} The multiplication result
     **/
    mat2.multiplyVec2 = function(matrix, vec, dest) {
      if (!dest) dest = vec;
      var x = vec[0], y = vec[1];
      dest[0] = x * matrix[0] + y * matrix[1];
      dest[1] = x * matrix[2] + y * matrix[3];
      return dest;
    };
    
    /**
     * Scales the mat2 by the dimensions in the given vec2
     *
     * @param {mat2} matrix the 2x2 matrix to scale
     * @param {vec2} vec    the vector containing the dimensions to scale by
     * @param {vec2} [dest] an optional receiving mat2. If not given, matrix is used.
     *
     * @returns {mat2} dest if specified, matrix otherwise
     **/
    mat2.scale = function(matrix, vec, dest) {
      if (!dest) { dest = matrix; }
      var a11 = matrix[0],
          a12 = matrix[1],
          a21 = matrix[2],
          a22 = matrix[3],
          b11 = vec[0],
          b22 = vec[1];
      dest[0] = a11 * b11;
      dest[1] = a12 * b22;
      dest[2] = a21 * b11;
      dest[3] = a22 * b22;
      return dest;
    };

    /**
     * Returns a string representation of a mat2
     *
     * @param {mat2} mat mat2 to represent as a string
     *
     * @param {String} String representation of mat
     */
    mat2.str = function (mat) {
        return '[' + mat[0] + ', ' + mat[1] + ', ' + mat[2] + ', ' + mat[3] + ']';
    };
    
    /**
     * @class 4 Dimensional Vector
     * @name vec4
     */
    var vec4 = {};
     
    /**
     * Creates a new vec4, initializing it from vec if vec
     * is given.
     *
     * @param {vec4} [vec] the vector's initial contents
     * @returns {vec4} a new 2D vector
     */
    vec4.create = function(vec) {
        var dest = new MatrixArray(4);
        
        if (vec) {
            dest[0] = vec[0];
            dest[1] = vec[1];
            dest[2] = vec[2];
            dest[3] = vec[3];
        } else {
            dest[0] = 0;
            dest[1] = 0;
            dest[2] = 0;
            dest[3] = 0;
        }
        return dest;
    };

    /**
     * Creates a new instance of a vec4, initializing it with the given arguments
     *
     * @param {number} x X value
     * @param {number} y Y value
     * @param {number} z Z value
     * @param {number} w W value

     * @returns {vec4} New vec4
     */
    vec4.createFrom = function (x, y, z, w) {
        var dest = new MatrixArray(4);

        dest[0] = x;
        dest[1] = y;
        dest[2] = z;
        dest[3] = w;

        return dest;
    };
    
    /**
     * Adds the vec4's together. If dest is given, the result
     * is stored there. Otherwise, the result is stored in vecB.
     *
     * @param {vec4} vecA the first operand
     * @param {vec4} vecB the second operand
     * @param {vec4} [dest] the optional receiving vector
     * @returns {vec4} dest
     */
    vec4.add = function(vecA, vecB, dest) {
      if (!dest) dest = vecB;
      dest[0] = vecA[0] + vecB[0];
      dest[1] = vecA[1] + vecB[1];
      dest[2] = vecA[2] + vecB[2];
      dest[3] = vecA[3] + vecB[3];
      return dest;
    };
    
    /**
     * Subtracts vecB from vecA. If dest is given, the result
     * is stored there. Otherwise, the result is stored in vecB.
     *
     * @param {vec4} vecA the first operand
     * @param {vec4} vecB the second operand
     * @param {vec4} [dest] the optional receiving vector
     * @returns {vec4} dest
     */
    vec4.subtract = function(vecA, vecB, dest) {
      if (!dest) dest = vecB;
      dest[0] = vecA[0] - vecB[0];
      dest[1] = vecA[1] - vecB[1];
      dest[2] = vecA[2] - vecB[2];
      dest[3] = vecA[3] - vecB[3];
      return dest;
    };
    
    /**
     * Multiplies vecA with vecB. If dest is given, the result
     * is stored there. Otherwise, the result is stored in vecB.
     *
     * @param {vec4} vecA the first operand
     * @param {vec4} vecB the second operand
     * @param {vec4} [dest] the optional receiving vector
     * @returns {vec4} dest
     */
    vec4.multiply = function(vecA, vecB, dest) {
      if (!dest) dest = vecB;
      dest[0] = vecA[0] * vecB[0];
      dest[1] = vecA[1] * vecB[1];
      dest[2] = vecA[2] * vecB[2];
      dest[3] = vecA[3] * vecB[3];
      return dest;
    };
    
    /**
     * Divides vecA by vecB. If dest is given, the result
     * is stored there. Otherwise, the result is stored in vecB.
     *
     * @param {vec4} vecA the first operand
     * @param {vec4} vecB the second operand
     * @param {vec4} [dest] the optional receiving vector
     * @returns {vec4} dest
     */
    vec4.divide = function(vecA, vecB, dest) {
      if (!dest) dest = vecB;
      dest[0] = vecA[0] / vecB[0];
      dest[1] = vecA[1] / vecB[1];
      dest[2] = vecA[2] / vecB[2];
      dest[3] = vecA[3] / vecB[3];
      return dest;
    };
    
    /**
     * Scales vecA by some scalar number. If dest is given, the result
     * is stored there. Otherwise, the result is stored in vecA.
     *
     * This is the same as multiplying each component of vecA
     * by the given scalar.
     *
     * @param {vec4}   vecA the vector to be scaled
     * @param {Number} scalar the amount to scale the vector by
     * @param {vec4}   [dest] the optional receiving vector
     * @returns {vec4} dest
     */
    vec4.scale = function(vecA, scalar, dest) {
      if (!dest) dest = vecA;
      dest[0] = vecA[0] * scalar;
      dest[1] = vecA[1] * scalar;
      dest[2] = vecA[2] * scalar;
      dest[3] = vecA[3] * scalar;
      return dest;
    };

    /**
     * Copies the values of one vec4 to another
     *
     * @param {vec4} vec vec4 containing values to copy
     * @param {vec4} dest vec4 receiving copied values
     *
     * @returns {vec4} dest
     */
    vec4.set = function (vec, dest) {
        dest[0] = vec[0];
        dest[1] = vec[1];
        dest[2] = vec[2];
        dest[3] = vec[3];
        return dest;
    };

    /**
     * Compares two vectors for equality within a certain margin of error
     *
     * @param {vec4} a First vector
     * @param {vec4} b Second vector
     *
     * @returns {Boolean} True if a is equivalent to b
     */
    vec4.equal = function (a, b) {
        return a === b || (
            Math.abs(a[0] - b[0]) < FLOAT_EPSILON &&
            Math.abs(a[1] - b[1]) < FLOAT_EPSILON &&
            Math.abs(a[2] - b[2]) < FLOAT_EPSILON &&
            Math.abs(a[3] - b[3]) < FLOAT_EPSILON
        );
    };

    /**
     * Negates the components of a vec4
     *
     * @param {vec4} vec vec4 to negate
     * @param {vec4} [dest] vec4 receiving operation result. If not specified result is written to vec
     *
     * @returns {vec4} dest if specified, vec otherwise
     */
    vec4.negate = function (vec, dest) {
        if (!dest) { dest = vec; }
        dest[0] = -vec[0];
        dest[1] = -vec[1];
        dest[2] = -vec[2];
        dest[3] = -vec[3];
        return dest;
    };

    /**
     * Caclulates the length of a vec2
     *
     * @param {vec2} vec vec2 to calculate length of
     *
     * @returns {Number} Length of vec
     */
    vec4.length = function (vec) {
      var x = vec[0], y = vec[1], z = vec[2], w = vec[3];
      return Math.sqrt(x * x + y * y + z * z + w * w);
    };

    /**
     * Caclulates the squared length of a vec4
     *
     * @param {vec4} vec vec4 to calculate squared length of
     *
     * @returns {Number} Squared Length of vec
     */
    vec4.squaredLength = function (vec) {
      var x = vec[0], y = vec[1], z = vec[2], w = vec[3];
      return x * x + y * y + z * z + w * w;
    };

    /**
     * Performs a linear interpolation between two vec4
     *
     * @param {vec4} vecA First vector
     * @param {vec4} vecB Second vector
     * @param {Number} lerp Interpolation amount between the two inputs
     * @param {vec4} [dest] vec4 receiving operation result. If not specified result is written to vecA
     *
     * @returns {vec4} dest if specified, vecA otherwise
     */
    vec4.lerp = function (vecA, vecB, lerp, dest) {
        if (!dest) { dest = vecA; }
        dest[0] = vecA[0] + lerp * (vecB[0] - vecA[0]);
        dest[1] = vecA[1] + lerp * (vecB[1] - vecA[1]);
        dest[2] = vecA[2] + lerp * (vecB[2] - vecA[2]);
        dest[3] = vecA[3] + lerp * (vecB[3] - vecA[3]);
        return dest;
    };

    /**
     * Returns a string representation of a vector
     *
     * @param {vec4} vec Vector to represent as a string
     *
     * @returns {String} String representation of vec
     */
    vec4.str = function (vec) {
        return '[' + vec[0] + ', ' + vec[1] + ', ' + vec[2] + ', ' + vec[3] + ']';
    };

    /*
     * Exports
     */

    if(root) {
        root.glMatrixArrayType = MatrixArray;
        root.MatrixArray = MatrixArray;
        root.setMatrixArrayType = setMatrixArrayType;
        root.determineMatrixArrayType = determineMatrixArrayType;
        root.glMath = glMath;
        root.vec2 = vec2;
        root.vec3 = vec3;
        root.vec4 = vec4;
        root.mat2 = mat2;
        root.mat3 = mat3;
        root.mat4 = mat4;
        root.quat4 = quat4;
    }

    return {
        glMatrixArrayType: MatrixArray,
        MatrixArray: MatrixArray,
        setMatrixArrayType: setMatrixArrayType,
        determineMatrixArrayType: determineMatrixArrayType,
        glMath: glMath,
        vec2: vec2,
        vec3: vec3,
        vec4: vec4,
        mat2: mat2,
        mat3: mat3,
        mat4: mat4,
        quat4: quat4
    };
}));

/**
 * jsBezier-0.5
 * 
 * Copyright (c) 2010 - 2011 Simon Porritt (simon.porritt@gmail.com)
 * 
 * licensed under the MIT license.
 * 
 * a set of Bezier curve functions that deal with Beziers, used by jsPlumb, and
 * perhaps useful for other people. These functions work with Bezier curves of
 * arbitrary degree.
 *  - functions are all in the 'jsBezier' namespace.
 *  - all input points should be in the format {x:.., y:..}. all output points
 * are in this format too.
 *  - all input curves should be in the format [ {x:.., y:..}, {x:.., y:..},
 * {x:.., y:..}, {x:.., y:..} ]
 *  - 'location' as used as an input here refers to a decimal in the range 0-1
 * inclusive, which indicates a point some proportion along the length of the
 * curve. location as output has the same format and meaning.
 * 
 * 
 * Function List: --------------
 * 
 * distanceFromCurve(point, curve)
 * 
 * Calculates the distance that the given point lies from the given Bezier. Note
 * that it is computed relative to the center of the Bezier, so if you have
 * stroked the curve with a wide pen you may wish to take that into account! The
 * distance returned is relative to the values of the curve and the point - it
 * will most likely be pixels.
 * 
 * gradientAtPoint(curve, location)
 * 
 * Calculates the gradient to the curve at the given location, as a decimal
 * between 0 and 1 inclusive.
 * 
 * gradientAtPointAlongCurveFrom (curve, location)
 * 
 * Calculates the gradient at the point on the given curve that is 'distance'
 * units from location.
 * 
 * nearestPointOnCurve(point, curve)
 * 
 * Calculates the nearest point to the given point on the given curve. The
 * return value of this is a JS object literal, containing both the point's
 * coordinates and also the 'location' of the point (see above), for example: {
 * point:{x:551,y:150}, location:0.263365 }.
 * 
 * pointOnCurve(curve, location)
 * 
 * Calculates the coordinates of the point on the given Bezier curve at the
 * given location.
 * 
 * pointAlongCurveFrom(curve, location, distance)
 * 
 * Calculates the coordinates of the point on the given curve that is 'distance'
 * units from location. 'distance' should be in the same coordinate space as
 * that used to construct the Bezier curve. For an HTML Canvas usage, for
 * example, distance would be a measure of pixels.
 * 
 * locationAlongCurveFrom(curve, location, distance)
 * 
 * Calculates the location on the given curve that is 'distance' units from
 * location. 'distance' should be in the same coordinate space as that used to
 * construct the Bezier curve. For an HTML Canvas usage, for example, distance
 * would be a measure of pixels.
 * 
 * perpendicularToCurveAt(curve, location, length, distance)
 * 
 * Calculates the perpendicular to the given curve at the given location. length
 * is the length of the line you wish for (it will be centered on the point at
 * 'location'). distance is optional, and allows you to specify a point along
 * the path from the given location as the center of the perpendicular returned.
 * The return value of this is an array of two points: [ {x:...,y:...},
 * {x:...,y:...} ].
 * 
 * 
 */

(function(lib) {
	'use strict';
	function sgn(x) {
		return x == 0 ? 0 : x > 0 ? 1 : -1;
	}

	var Vectors = {
		subtract : function(v1, v2) {
			return {
				x : v1.x - v2.x,
				y : v1.y - v2.y
			};
		},
		dotProduct : function(v1, v2) {
			return (v1.x * v2.x) + (v1.y * v2.y);
		},
		square : function(v) {
			return Math.sqrt((v.x * v.x) + (v.y * v.y));
		},
		scale : function(v, s) {
			return {
				x : v.x * s,
				y : v.y * s
			};
		}
	},

	maxRecursion = 64, flatnessTolerance = Math.pow(2.0, -maxRecursion - 1);

	/**
	 * Calculates the distance that the point lies from the curve.
	 * 
	 * @param point
	 *            a point in the form {x:567, y:3342}
	 * @param curve
	 *            a Bezier curve in the form [{x:..., y:...}, {x:..., y:...},
	 *            {x:..., y:...}, {x:..., y:...}]. note that this is currently
	 *            hardcoded to assume cubiz beziers, but would be better off
	 *            supporting any degree.
	 * @return a JS object literal containing location and distance, for
	 *         example: {location:0.35, distance:10}. Location is analogous to
	 *         the location argument you pass to the pointOnPath function: it is
	 *         a ratio of distance travelled along the curve. Distance is the
	 *         distance in pixels from the point to the curve.
	 */
	var _distanceFromCurve = function(point, curve) {
		var candidates = [], w = _convertToBezier(point, curve), degree = curve.length - 1, higherDegree = (2 * degree) - 1, numSolutions = _findRoots(w, higherDegree, candidates, 0), v = Vectors.subtract(point, curve[0]), dist = Vectors.square(v), t = 0.0;

		for ( var i = 0; i < numSolutions; i++) {
			v = Vectors.subtract(point, _bezier(curve, degree, candidates[i], null, null));
			var newDist = Vectors.square(v);
			if (newDist < dist) {
				dist = newDist;
				t = candidates[i];
			}
		}
		v = Vectors.subtract(point, curve[degree]);
		newDist = Vectors.square(v);
		if (newDist < dist) {
			dist = newDist;
			t = 1.0;
		}
		return {
			location : t,
			distance : dist
		};
	};
	/**
	 * finds the nearest point on the curve to the given point.
	 */
	var _nearestPointOnCurve = function(point, curve) {
		var td = _distanceFromCurve(point, curve);
		return {
			point : _bezier(curve, curve.length - 1, td.location, null, null),
			location : td.location
		};
	};
	var _convertToBezier = function(point, curve) {
		var degree = curve.length - 1, higherDegree = (2 * degree) - 1, c = [], d = [], cdTable = [], w = [], z = [ [ 1.0, 0.6, 0.3, 0.1 ], [ 0.4, 0.6, 0.6, 0.4 ], [ 0.1, 0.3, 0.6, 1.0 ] ];

		for ( var i = 0; i <= degree; i++)
			c[i] = Vectors.subtract(curve[i], point);
		for ( var i = 0; i <= degree - 1; i++) {
			d[i] = Vectors.subtract(curve[i + 1], curve[i]);
			d[i] = Vectors.scale(d[i], 3.0);
		}
		for ( var row = 0; row <= degree - 1; row++) {
			for ( var column = 0; column <= degree; column++) {
				if (!cdTable[row])
					cdTable[row] = [];
				cdTable[row][column] = Vectors.dotProduct(d[row], c[column]);
			}
		}
		for (i = 0; i <= higherDegree; i++) {
			if (!w[i])
				w[i] = [];
			w[i].y = 0.0;
			w[i].x = parseFloat(i) / higherDegree;
		}
		var n = degree, m = degree - 1;
		for ( var k = 0; k <= n + m; k++) {
			var lb = Math.max(0, k - m), ub = Math.min(k, n);
			for (i = lb; i <= ub; i++) {
				var j = k - i;
				w[i + j].y += cdTable[j][i] * z[j][i];
			}
		}
		return w;
	};
	/**
	 * counts how many roots there are.
	 */
	var _findRoots = function(w, degree, t, depth) {
		var left = [], right = [], left_count, right_count, left_t = [], right_t = [];

		switch (_getCrossingCount(w, degree)) {
		case 0: {
			return 0;
		}
		case 1: {
			if (depth >= maxRecursion) {
				t[0] = (w[0].x + w[degree].x) / 2.0;
				return 1;
			}
			if (_isFlatEnough(w, degree)) {
				t[0] = _computeXIntercept(w, degree);
				return 1;
			}
			break;
		}
		}
		_bezier(w, degree, 0.5, left, right);
		left_count = _findRoots(left, degree, left_t, depth + 1);
		right_count = _findRoots(right, degree, right_t, depth + 1);
		for ( var i = 0; i < left_count; i++)
			t[i] = left_t[i];
		for ( var i = 0; i < right_count; i++)
			t[i + left_count] = right_t[i];
		return (left_count + right_count);
	};
	var _getCrossingCount = function(curve, degree) {
		var n_crossings = 0, sign, old_sign;
		sign = old_sign = sgn(curve[0].y);
		for ( var i = 1; i <= degree; i++) {
			sign = sgn(curve[i].y);
			if (sign != old_sign)
				n_crossings++;
			old_sign = sign;
		}
		return n_crossings;
	};
	var _isFlatEnough = function(curve, degree) {
		var error, intercept_1, intercept_2, left_intercept, right_intercept, a, b, c, det, dInv, a1, b1, c1, a2, b2, c2;
		a = curve[0].y - curve[degree].y;
		b = curve[degree].x - curve[0].x;
		c = curve[0].x * curve[degree].y - curve[degree].x * curve[0].y;

		var max_distance_above = 0.0, max_distance_below = 0.0;

		for ( var i = 1; i < degree; i++) {
			var value = a * curve[i].x + b * curve[i].y + c;
			if (value > max_distance_above)
				max_distance_above = value;
			else if (value < max_distance_below)
				max_distance_below = value;
		}

		a1 = 0.0;
		b1 = 1.0;
		c1 = 0.0;
		a2 = a;
		b2 = b;
		c2 = c - max_distance_above;
		det = a1 * b2 - a2 * b1;
		dInv = 1.0 / det;
		intercept_1 = (b1 * c2 - b2 * c1) * dInv;
		a2 = a;
		b2 = b;
		c2 = c - max_distance_below;
		det = a1 * b2 - a2 * b1;
		dInv = 1.0 / det;
		intercept_2 = (b1 * c2 - b2 * c1) * dInv;
		left_intercept = Math.min(intercept_1, intercept_2);
		right_intercept = Math.max(intercept_1, intercept_2);
		error = right_intercept - left_intercept;
		return (error < flatnessTolerance) ? 1 : 0;
	};
	var _computeXIntercept = function(curve, degree) {
		var XLK = 1.0, YLK = 0.0, XNM = curve[degree].x - curve[0].x, YNM = curve[degree].y - curve[0].y, XMK = curve[0].x - 0.0, YMK = curve[0].y - 0.0, det = XNM * YLK - YNM * XLK, detInv = 1.0 / det, S = (XNM * YMK - YNM * XMK) * detInv;
		return 0.0 + XLK * S;
	};
	var _bezier = function(curve, degree, t, left, right) {
		var temp = [ [] ];
		for ( var j = 0; j <= degree; j++)
			temp[0][j] = curve[j];
		for ( var i = 1; i <= degree; i++) {
			for ( var j = 0; j <= degree - i; j++) {
				if (!temp[i])
					temp[i] = [];
				if (!temp[i][j])
					temp[i][j] = {};
				temp[i][j].x = (1.0 - t) * temp[i - 1][j].x + t * temp[i - 1][j + 1].x;
				temp[i][j].y = (1.0 - t) * temp[i - 1][j].y + t * temp[i - 1][j + 1].y;
			}
		}
		if (left != null)
			for (j = 0; j <= degree; j++)
				left[j] = temp[j][0];
		if (right != null)
			for (j = 0; j <= degree; j++)
				right[j] = temp[degree - j][j];

		return (temp[degree][0]);
	};

	var _curveFunctionCache = {};
	var _getCurveFunctions = function(order) {
		var fns = _curveFunctionCache[order];
		if (!fns) {
			fns = [];
			var f_term = function() {
				return function(t) {
					return Math.pow(t, order);
				};
			}, l_term = function() {
				return function(t) {
					return Math.pow((1 - t), order);
				};
			}, c_term = function(c) {
				return function(t) {
					return c;
				};
			}, t_term = function() {
				return function(t) {
					return t;
				};
			}, one_minus_t_term = function() {
				return function(t) {
					return 1 - t;
				};
			}, _termFunc = function(terms) {
				return function(t) {
					var p = 1;
					for ( var i = 0; i < terms.length; i++)
						p = p * terms[i](t);
					return p;
				};
			};

			fns.push(new f_term()); // first is t to the power of the curve
									// order
			for ( var i = 1; i < order; i++) {
				var terms = [ new c_term(order) ];
				for ( var j = 0; j < (order - i); j++)
					terms.push(new t_term());
				for ( var j = 0; j < i; j++)
					terms.push(new one_minus_t_term());
				fns.push(new _termFunc(terms));
			}
			fns.push(new l_term()); // last is (1-t) to the power of the curve
									// order

			_curveFunctionCache[order] = fns;
		}

		return fns;
	};

	/**
	 * calculates a point on the curve, for a Bezier of arbitrary order.
	 * 
	 * @param curve
	 *            an array of control points, eg [{x:10,y:20}, {x:50,y:50},
	 *            {x:100,y:100}, {x:120,y:100}]. For a cubic bezier this should
	 *            have four points.
	 * @param location
	 *            a decimal indicating the distance along the curve the point
	 *            should be located at. this is the distance along the curve as
	 *            it travels, taking the way it bends into account. should be a
	 *            number from 0 to 1, inclusive.
	 */
	var _pointOnPath = function(curve, location) {
		var cc = _getCurveFunctions(curve.length - 1), _x = 0, _y = 0;
		for ( var i = 0; i < curve.length; i++) {
			_x = _x + (curve[i].x * cc[i](location));
			_y = _y + (curve[i].y * cc[i](location));
		}

		return {
			x : _x,
			y : _y
		};
	};

	var _dist = function(p1, p2) {
		return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
	};

	/**
	 * finds the point that is 'distance' along the path from 'location'. this
	 * method returns both the x,y location of the point and also its 'location'
	 * (proportion of travel along the path); the method below -
	 * _pointAlongPathFrom - calls this method and just returns the point.
	 */
	var _pointAlongPath = function(curve, location, distance) {
		var prev = _pointOnPath(curve, location), tally = 0, curLoc = location, direction = distance > 0 ? 1 : -1, cur = null;

		while (tally < Math.abs(distance)) {
			curLoc += (0.005 * direction);
			cur = _pointOnPath(curve, curLoc);
			tally += _dist(cur, prev);
			prev = cur;
		}
		return {
			point : cur,
			location : curLoc
		};
	};

	var _length = function(curve) {
		var prev = _pointOnPath(curve, 0), tally = 0, curLoc = 0, direction = 1, cur = null;

		while (curLoc < 1) {
			curLoc += (0.005 * direction);
			cur = _pointOnPath(curve, curLoc);
			tally += _dist(cur, prev);
			prev = cur;
		}
		return tally;
	};

	/**
	 * finds the point that is 'distance' along the path from 'location'.
	 */
	var _pointAlongPathFrom = function(curve, location, distance) {
		return _pointAlongPath(curve, location, distance).point;
	};

	/**
	 * finds the location that is 'distance' along the path from 'location'.
	 */
	var _locationAlongPathFrom = function(curve, location, distance) {
		return _pointAlongPath(curve, location, distance).location;
	};

	/**
	 * returns the gradient of the curve at the given location, which is a
	 * decimal between 0 and 1 inclusive.
	 * 
	 * thanks // http://bimixual.org/AnimationLibrary/beziertangents.html
	 */
	var _gradientAtPoint = function(curve, location) {
		var p1 = _pointOnPath(curve, location), p2 = _pointOnPath(curve.slice(0, curve.length - 1), location), dy = p2.y - p1.y, dx = p2.x - p1.x;
		return dy == 0 ? Infinity : Math.atan(dy / dx);
	};

	/**
	 * returns the gradient of the curve at the point which is 'distance' from
	 * the given location. if this point is greater than location 1, the
	 * gradient at location 1 is returned. if this point is less than location
	 * 0, the gradient at location 0 is returned.
	 */
	var _gradientAtPointAlongPathFrom = function(curve, location, distance) {
		var p = _pointAlongPath(curve, location, distance);
		if (p.location > 1)
			p.location = 1;
		if (p.location < 0)
			p.location = 0;
		return _gradientAtPoint(curve, p.location);
	};

	/**
	 * calculates a line that is 'length' pixels long, perpendicular to, and
	 * centered on, the path at 'distance' pixels from the given location. if
	 * distance is not supplied, the perpendicular for the given location is
	 * computed (ie. we set distance to zero).
	 */
	var _perpendicularToPathAt = function(curve, location, length, distance) {
		distance = distance == null ? 0 : distance;
		var p = _pointAlongPath(curve, location, distance), m = _gradientAtPoint(curve, p.location), _theta2 = Math.atan(-1 / m), y = length / 2 * Math.sin(_theta2), x = length / 2 * Math.cos(_theta2);
		return [ {
			x : p.point.x + x,
			y : p.point.y + y
		}, {
			x : p.point.x - x,
			y : p.point.y - y
		} ];
	};

	ChemDoodle.lib.jsBezier = {
		distanceFromCurve : _distanceFromCurve,
		gradientAtPoint : _gradientAtPoint,
		gradientAtPointAlongCurveFrom : _gradientAtPointAlongPathFrom,
		nearestPointOnCurve : _nearestPointOnCurve,
		pointOnCurve : _pointOnPath,
		pointAlongCurveFrom : _pointAlongPathFrom,
		perpendicularToCurveAt : _perpendicularToPathAt,
		locationAlongCurveFrom : _locationAlongPathFrom,
		getLength : _length
	};
})(ChemDoodle.lib);
// The MIT License (MIT)
// Copyright (c) 2012-2013 Mikola Lysenko
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/**
 * Javascript Marching Cubes
 *
 * Based on Paul Bourke's classic implementation:
 *    http://local.wasp.uwa.edu.au/~pbourke/geometry/polygonise/
 *
 * JS port by Mikola Lysenko
 */

ChemDoodle.lib.MarchingCubes = (function() {
var edgeTable= new Uint32Array([
      0x0  , 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
      0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
      0x190, 0x99 , 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
      0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
      0x230, 0x339, 0x33 , 0x13a, 0x636, 0x73f, 0x435, 0x53c,
      0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
      0x3a0, 0x2a9, 0x1a3, 0xaa , 0x7a6, 0x6af, 0x5a5, 0x4ac,
      0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
      0x460, 0x569, 0x663, 0x76a, 0x66 , 0x16f, 0x265, 0x36c,
      0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
      0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff , 0x3f5, 0x2fc,
      0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
      0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55 , 0x15c,
      0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
      0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc ,
      0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
      0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
      0xcc , 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
      0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
      0x15c, 0x55 , 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
      0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
      0x2fc, 0x3f5, 0xff , 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
      0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
      0x36c, 0x265, 0x16f, 0x66 , 0x76a, 0x663, 0x569, 0x460,
      0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
      0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa , 0x1a3, 0x2a9, 0x3a0,
      0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
      0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33 , 0x339, 0x230,
      0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
      0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99 , 0x190,
      0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
      0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0   ])
  , triTable = [
      [],
      [0, 8, 3],
      [0, 1, 9],
      [1, 8, 3, 9, 8, 1],
      [1, 2, 10],
      [0, 8, 3, 1, 2, 10],
      [9, 2, 10, 0, 2, 9],
      [2, 8, 3, 2, 10, 8, 10, 9, 8],
      [3, 11, 2],
      [0, 11, 2, 8, 11, 0],
      [1, 9, 0, 2, 3, 11],
      [1, 11, 2, 1, 9, 11, 9, 8, 11],
      [3, 10, 1, 11, 10, 3],
      [0, 10, 1, 0, 8, 10, 8, 11, 10],
      [3, 9, 0, 3, 11, 9, 11, 10, 9],
      [9, 8, 10, 10, 8, 11],
      [4, 7, 8],
      [4, 3, 0, 7, 3, 4],
      [0, 1, 9, 8, 4, 7],
      [4, 1, 9, 4, 7, 1, 7, 3, 1],
      [1, 2, 10, 8, 4, 7],
      [3, 4, 7, 3, 0, 4, 1, 2, 10],
      [9, 2, 10, 9, 0, 2, 8, 4, 7],
      [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4],
      [8, 4, 7, 3, 11, 2],
      [11, 4, 7, 11, 2, 4, 2, 0, 4],
      [9, 0, 1, 8, 4, 7, 2, 3, 11],
      [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1],
      [3, 10, 1, 3, 11, 10, 7, 8, 4],
      [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4],
      [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3],
      [4, 7, 11, 4, 11, 9, 9, 11, 10],
      [9, 5, 4],
      [9, 5, 4, 0, 8, 3],
      [0, 5, 4, 1, 5, 0],
      [8, 5, 4, 8, 3, 5, 3, 1, 5],
      [1, 2, 10, 9, 5, 4],
      [3, 0, 8, 1, 2, 10, 4, 9, 5],
      [5, 2, 10, 5, 4, 2, 4, 0, 2],
      [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8],
      [9, 5, 4, 2, 3, 11],
      [0, 11, 2, 0, 8, 11, 4, 9, 5],
      [0, 5, 4, 0, 1, 5, 2, 3, 11],
      [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5],
      [10, 3, 11, 10, 1, 3, 9, 5, 4],
      [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10],
      [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3],
      [5, 4, 8, 5, 8, 10, 10, 8, 11],
      [9, 7, 8, 5, 7, 9],
      [9, 3, 0, 9, 5, 3, 5, 7, 3],
      [0, 7, 8, 0, 1, 7, 1, 5, 7],
      [1, 5, 3, 3, 5, 7],
      [9, 7, 8, 9, 5, 7, 10, 1, 2],
      [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3],
      [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2],
      [2, 10, 5, 2, 5, 3, 3, 5, 7],
      [7, 9, 5, 7, 8, 9, 3, 11, 2],
      [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11],
      [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7],
      [11, 2, 1, 11, 1, 7, 7, 1, 5],
      [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11],
      [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0],
      [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0],
      [11, 10, 5, 7, 11, 5],
      [10, 6, 5],
      [0, 8, 3, 5, 10, 6],
      [9, 0, 1, 5, 10, 6],
      [1, 8, 3, 1, 9, 8, 5, 10, 6],
      [1, 6, 5, 2, 6, 1],
      [1, 6, 5, 1, 2, 6, 3, 0, 8],
      [9, 6, 5, 9, 0, 6, 0, 2, 6],
      [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8],
      [2, 3, 11, 10, 6, 5],
      [11, 0, 8, 11, 2, 0, 10, 6, 5],
      [0, 1, 9, 2, 3, 11, 5, 10, 6],
      [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11],
      [6, 3, 11, 6, 5, 3, 5, 1, 3],
      [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6],
      [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9],
      [6, 5, 9, 6, 9, 11, 11, 9, 8],
      [5, 10, 6, 4, 7, 8],
      [4, 3, 0, 4, 7, 3, 6, 5, 10],
      [1, 9, 0, 5, 10, 6, 8, 4, 7],
      [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4],
      [6, 1, 2, 6, 5, 1, 4, 7, 8],
      [1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7],
      [8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6],
      [7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9],
      [3, 11, 2, 7, 8, 4, 10, 6, 5],
      [5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11],
      [0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6],
      [9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6],
      [8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6],
      [5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11],
      [0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7],
      [6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9],
      [10, 4, 9, 6, 4, 10],
      [4, 10, 6, 4, 9, 10, 0, 8, 3],
      [10, 0, 1, 10, 6, 0, 6, 4, 0],
      [8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10],
      [1, 4, 9, 1, 2, 4, 2, 6, 4],
      [3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4],
      [0, 2, 4, 4, 2, 6],
      [8, 3, 2, 8, 2, 4, 4, 2, 6],
      [10, 4, 9, 10, 6, 4, 11, 2, 3],
      [0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6],
      [3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10],
      [6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1],
      [9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3],
      [8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1],
      [3, 11, 6, 3, 6, 0, 0, 6, 4],
      [6, 4, 8, 11, 6, 8],
      [7, 10, 6, 7, 8, 10, 8, 9, 10],
      [0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10],
      [10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0],
      [10, 6, 7, 10, 7, 1, 1, 7, 3],
      [1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7],
      [2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9],
      [7, 8, 0, 7, 0, 6, 6, 0, 2],
      [7, 3, 2, 6, 7, 2],
      [2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7],
      [2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7],
      [1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11],
      [11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1],
      [8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6],
      [0, 9, 1, 11, 6, 7],
      [7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0],
      [7, 11, 6],
      [7, 6, 11],
      [3, 0, 8, 11, 7, 6],
      [0, 1, 9, 11, 7, 6],
      [8, 1, 9, 8, 3, 1, 11, 7, 6],
      [10, 1, 2, 6, 11, 7],
      [1, 2, 10, 3, 0, 8, 6, 11, 7],
      [2, 9, 0, 2, 10, 9, 6, 11, 7],
      [6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8],
      [7, 2, 3, 6, 2, 7],
      [7, 0, 8, 7, 6, 0, 6, 2, 0],
      [2, 7, 6, 2, 3, 7, 0, 1, 9],
      [1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6],
      [10, 7, 6, 10, 1, 7, 1, 3, 7],
      [10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8],
      [0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7],
      [7, 6, 10, 7, 10, 8, 8, 10, 9],
      [6, 8, 4, 11, 8, 6],
      [3, 6, 11, 3, 0, 6, 0, 4, 6],
      [8, 6, 11, 8, 4, 6, 9, 0, 1],
      [9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6],
      [6, 8, 4, 6, 11, 8, 2, 10, 1],
      [1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6],
      [4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9],
      [10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3],
      [8, 2, 3, 8, 4, 2, 4, 6, 2],
      [0, 4, 2, 4, 6, 2],
      [1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8],
      [1, 9, 4, 1, 4, 2, 2, 4, 6],
      [8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1],
      [10, 1, 0, 10, 0, 6, 6, 0, 4],
      [4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3],
      [10, 9, 4, 6, 10, 4],
      [4, 9, 5, 7, 6, 11],
      [0, 8, 3, 4, 9, 5, 11, 7, 6],
      [5, 0, 1, 5, 4, 0, 7, 6, 11],
      [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5],
      [9, 5, 4, 10, 1, 2, 7, 6, 11],
      [6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5],
      [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2],
      [3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6],
      [7, 2, 3, 7, 6, 2, 5, 4, 9],
      [9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7],
      [3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0],
      [6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8],
      [9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7],
      [1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4],
      [4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10],
      [7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10],
      [6, 9, 5, 6, 11, 9, 11, 8, 9],
      [3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5],
      [0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11],
      [6, 11, 3, 6, 3, 5, 5, 3, 1],
      [1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6],
      [0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10],
      [11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5],
      [6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3],
      [5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2],
      [9, 5, 6, 9, 6, 0, 0, 6, 2],
      [1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8],
      [1, 5, 6, 2, 1, 6],
      [1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6],
      [10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0],
      [0, 3, 8, 5, 6, 10],
      [10, 5, 6],
      [11, 5, 10, 7, 5, 11],
      [11, 5, 10, 11, 7, 5, 8, 3, 0],
      [5, 11, 7, 5, 10, 11, 1, 9, 0],
      [10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1],
      [11, 1, 2, 11, 7, 1, 7, 5, 1],
      [0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11],
      [9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7],
      [7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2],
      [2, 5, 10, 2, 3, 5, 3, 7, 5],
      [8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5],
      [9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2],
      [9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2],
      [1, 3, 5, 3, 7, 5],
      [0, 8, 7, 0, 7, 1, 1, 7, 5],
      [9, 0, 3, 9, 3, 5, 5, 3, 7],
      [9, 8, 7, 5, 9, 7],
      [5, 8, 4, 5, 10, 8, 10, 11, 8],
      [5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0],
      [0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5],
      [10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4],
      [2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8],
      [0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11],
      [0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5],
      [9, 4, 5, 2, 11, 3],
      [2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4],
      [5, 10, 2, 5, 2, 4, 4, 2, 0],
      [3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9],
      [5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2],
      [8, 4, 5, 8, 5, 3, 3, 5, 1],
      [0, 4, 5, 1, 0, 5],
      [8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5],
      [9, 4, 5],
      [4, 11, 7, 4, 9, 11, 9, 10, 11],
      [0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11],
      [1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11],
      [3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4],
      [4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2],
      [9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3],
      [11, 7, 4, 11, 4, 2, 2, 4, 0],
      [11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4],
      [2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9],
      [9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7],
      [3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10],
      [1, 10, 2, 8, 7, 4],
      [4, 9, 1, 4, 1, 7, 7, 1, 3],
      [4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1],
      [4, 0, 3, 7, 4, 3],
      [4, 8, 7],
      [9, 10, 8, 10, 11, 8],
      [3, 0, 9, 3, 9, 11, 11, 9, 10],
      [0, 1, 10, 0, 10, 8, 8, 10, 11],
      [3, 1, 10, 11, 3, 10],
      [1, 2, 11, 1, 11, 9, 9, 11, 8],
      [3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9],
      [0, 2, 11, 8, 0, 11],
      [3, 2, 11],
      [2, 3, 8, 2, 8, 10, 10, 8, 9],
      [9, 10, 2, 0, 9, 2],
      [2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8],
      [1, 10, 2],
      [1, 3, 8, 9, 1, 8],
      [0, 9, 1],
      [0, 3, 8],
      []]
  , cubeVerts = [
     [0,0,0]
    ,[1,0,0]
    ,[1,1,0]
    ,[0,1,0]
    ,[0,0,1]
    ,[1,0,1]
    ,[1,1,1]
    ,[0,1,1]]
  , edgeIndex = [ [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7] ];

return function(data, dims) {
  var vertices = []
    , faces = []
    , n = 0
    , grid = new Float32Array(8)
    , edges = new Int32Array(12)
    , x = new Int32Array(3);
  //March over the volume
  for(x[2]=0; x[2]<dims[2]-1; ++x[2], n+=dims[0])
  for(x[1]=0; x[1]<dims[1]-1; ++x[1], ++n)
  for(x[0]=0; x[0]<dims[0]-1; ++x[0], ++n) {
    //For each cell, compute cube mask
    var cube_index = 0;
    for(var i=0; i<8; ++i) {
      var v = cubeVerts[i]
        , s = data[n + v[0] + dims[0] * (v[1] + dims[1] * v[2])];
      grid[i] = s;
      cube_index |= (s > 0) ? 1 << i : 0;
    }
    //Compute vertices
    var edge_mask = edgeTable[cube_index];
    if(edge_mask === 0) {
      continue;
    }
    for(var i=0; i<12; ++i) {
      if((edge_mask & (1<<i)) === 0) {
        continue;
      }
      edges[i] = vertices.length;
      var nv = [0,0,0]
        , e = edgeIndex[i]
        , p0 = cubeVerts[e[0]]
        , p1 = cubeVerts[e[1]]
        , a = grid[e[0]]
        , b = grid[e[1]]
        , d = a - b
        , t = 0;
      if(Math.abs(d) > 1e-6) {
        t = a / d;
      }
      for(var j=0; j<3; ++j) {
        nv[j] = (x[j] + p0[j]) + t * (p1[j] - p0[j]);
      }
      vertices.push(nv);
    }
    //Add faces
    var f = triTable[cube_index];
    for(var i=0; i<f.length; i += 3) {
      faces.push([edges[f[i]], edges[f[i+1]], edges[f[i+2]]]);
    }
  }
  return { vertices: vertices, faces: faces };
};
})();


ChemDoodle.animations = (function(window, undefined) {
	'use strict';
	let ext = {};

	// Drop in replace functions for setTimeout() & setInterval() that 
	// make use of requestAnimationFrame() for performance where available
	// http://www.joelambert.co.uk
	 
	// Copyright 2011, Joe Lambert.
	// Free to use under the MIT license.
	// http://www.opensource.org/licenses/mit-license.php
	
	// requestAnimationFrame() shim by Paul Irish
	// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	window.requestAnimFrame = (function() {
		return  window.requestAnimationFrame       || 
				window.webkitRequestAnimationFrame || 
				window.mozRequestAnimationFrame    || 
				window.oRequestAnimationFrame      || 
				window.msRequestAnimationFrame     || 
				function(/* function */ callback, /* DOMElement */ element){
					window.setTimeout(callback, 1000 / 60);
				};
	})();
	
	/**
	 * Behaves the same as setInterval except uses requestAnimationFrame() where possible for better performance
	 * @param {function} fn The callback function
	 * @param {int} delay The delay in milliseconds
	 */
	ext.requestInterval = function(fn, delay) {
		if( !window.requestAnimationFrame       && 
			!window.webkitRequestAnimationFrame && 
			!(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
			!window.oRequestAnimationFrame      && 
			!window.msRequestAnimationFrame)
				return window.setInterval(fn, delay);
				
		let start = new Date().getTime(),
			handle = new Object();
			
		function loop() {
			let current = new Date().getTime(),
				delta = current - start;
				
			if(delta >= delay) {
				fn.call();
				start = new Date().getTime();
			}
	 
			handle.value = window.requestAnimFrame(loop);
		};
		
		handle.value = window.requestAnimFrame(loop);
		return handle;
	};
	 
	/**
	 * Behaves the same as clearInterval except uses cancelRequestAnimationFrame() where possible for better performance
	 * @param {int|object} fn The callback function
	 */
	ext.clearRequestInterval = function(handle) {
	    window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
	    window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) :
	    window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
	    window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
	    window.oCancelRequestAnimationFrame	? window.oCancelRequestAnimationFrame(handle.value) :
	    window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) :
	    clearInterval(handle);
	};
	
	/**
	 * Behaves the same as setTimeout except uses requestAnimationFrame() where possible for better performance
	 * @param {function} fn The callback function
	 * @param {int} delay The delay in milliseconds
	 */
	 
	ext.requestTimeout = function(fn, delay) {
		if( !window.requestAnimationFrame      	&& 
			!window.webkitRequestAnimationFrame && 
			!(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
			!window.oRequestAnimationFrame      && 
			!window.msRequestAnimationFrame)
				return window.setTimeout(fn, delay);
				
		let start = new Date().getTime(),
			handle = new Object();
			
		function loop(){
			let current = new Date().getTime(),
				delta = current - start;
				
			delta >= delay ? fn.call() : handle.value = window.requestAnimFrame(loop);
		};
		
		handle.value = window.requestAnimFrame(loop);
		return handle;
	};
	 
	/**
	 * Behaves the same as clearTimeout except uses cancelRequestAnimationFrame() where possible for better performance
	 * @param {int|object} fn The callback function
	 */
	ext.clearRequestTimeout = function(handle) {
	    window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
	    window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) :
	    window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
	    window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
	    window.oCancelRequestAnimationFrame	? window.oCancelRequestAnimationFrame(handle.value) :
	    window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) :
	    clearTimeout(handle);
	};

	return ext;

})(window);

ChemDoodle.extensions = (function(structures, v3, m, undefined) {
	'use strict';
	let ext = {};

	ext.vec3AngleFrom = function(v1, v2) {
		let length1 = v3.length(v1);
		let length2 = v3.length(v2);
		let dot = v3.dot(v1, v2);
		let cosine = dot / length1 / length2;
		return m.acos(cosine);
	};

	ext.contextRoundRect = function(ctx, x, y, width, height, radius) {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
	};

	ext.contextEllipse = function(ctx, x, y, w, h) {
		let kappa = .5522848;
		let ox = (w / 2) * kappa;
		let oy = (h / 2) * kappa;
		let xe = x + w;
		let ye = y + h;
		let xm = x + w / 2;
		let ym = y + h / 2;

		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
	};

	ext.getFontString = function(size, families, bold, italic) {
		let sb = [];
		if (bold) {
			sb.push('bold ');
		}
		if (italic) {
			sb.push('italic ');
		}
		sb.push(size + 'px ');
		for ( let i = 0, ii = families.length; i < ii; i++) {
			let use = families[i];
			if (use.indexOf(' ') !== -1) {
				use = '"' + use + '"';
			}
			sb.push((i !== 0 ? ',' : '') + use);
		}
		return sb.join('');
	};

	return ext;

})(ChemDoodle.structures, ChemDoodle.lib.vec3, Math);

(function(Object, Math, undefined) {
	'use strict';
	
	// polyfills exist here, mostly for IE11 support
	
	// Math.sign used by SESSurface.generate()
	if (!Math.sign) {
	  Math.sign = function(x) {
	    // If x is NaN, the result is NaN.
	    // If x is -0, the result is -0.
	    // If x is +0, the result is +0.
	    // If x is negative and not -0, the result is -1.
	    // If x is positive and not +0, the result is +1.
	    return ((x > 0) - (x < 0)) || +x;
	    // A more aesthetic pseudo-representation:
	    // ( (x > 0) ? 1 : 0 )  // if x is positive, then positive one
	    //          +           // else (because you can't be both - and +)
	    // ( (x < 0) ? -1 : 0 ) // if x is negative, then negative one
	    //         ||           // if x is 0, -0, or NaN, or not a number,
	    //         +x           // then the result will be x, (or) if x is
	    //                      // not a number, then x converts to number
	  };
	}
	
	// polyfill for Object.assign on IE11
	// used by Styles constructor
	if (typeof Object.assign != 'function') {
	    Object.assign = function (target, varArgs) {
	        'use strict';
	        if (target == null) { // TypeError if undefined or null
	            throw new TypeError('Cannot convert undefined or null to object');
	        }
	
	        var to = Object(target);
	
	        for (var index = 1; index < arguments.length; index++) {
	            var nextSource = arguments[index];
	
	            if (nextSource != null) { // Skip over if undefined or null
	                for (var nextKey in nextSource) {
	                    // Avoid bugs when hasOwnProperty is shadowed
	                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
	                        to[nextKey] = nextSource[nextKey];
	                    }
	                }
	            }
	        }
	        return to;
	    };
	}

	// polyfill for String.startsWith() on IE11
	if (!String.prototype.startsWith) {
		String.prototype.startsWith = function(searchString, position){
		  position = position || 0;
		  return this.substr(position, searchString.length) === searchString;
	  };
	}

})(Object, Math);

ChemDoodle.math = (function(c, structures, m, document, undefined) {
	'use strict';
	let pack = {};

	let namedColors = {
		'aliceblue' : '#f0f8ff',
		'antiquewhite' : '#faebd7',
		'aqua' : '#00ffff',
		'aquamarine' : '#7fffd4',
		'azure' : '#f0ffff',
		'beige' : '#f5f5dc',
		'bisque' : '#ffe4c4',
		'black' : '#000000',
		'blanchedalmond' : '#ffebcd',
		'blue' : '#0000ff',
		'blueviolet' : '#8a2be2',
		'brown' : '#a52a2a',
		'burlywood' : '#deb887',
		'cadetblue' : '#5f9ea0',
		'chartreuse' : '#7fff00',
		'chocolate' : '#d2691e',
		'coral' : '#ff7f50',
		'cornflowerblue' : '#6495ed',
		'cornsilk' : '#fff8dc',
		'crimson' : '#dc143c',
		'cyan' : '#00ffff',
		'darkblue' : '#00008b',
		'darkcyan' : '#008b8b',
		'darkgoldenrod' : '#b8860b',
		'darkgray' : '#a9a9a9',
		'darkgreen' : '#006400',
		'darkkhaki' : '#bdb76b',
		'darkmagenta' : '#8b008b',
		'darkolivegreen' : '#556b2f',
		'darkorange' : '#ff8c00',
		'darkorchid' : '#9932cc',
		'darkred' : '#8b0000',
		'darksalmon' : '#e9967a',
		'darkseagreen' : '#8fbc8f',
		'darkslateblue' : '#483d8b',
		'darkslategray' : '#2f4f4f',
		'darkturquoise' : '#00ced1',
		'darkviolet' : '#9400d3',
		'deeppink' : '#ff1493',
		'deepskyblue' : '#00bfff',
		'dimgray' : '#696969',
		'dodgerblue' : '#1e90ff',
		'firebrick' : '#b22222',
		'floralwhite' : '#fffaf0',
		'forestgreen' : '#228b22',
		'fuchsia' : '#ff00ff',
		'gainsboro' : '#dcdcdc',
		'ghostwhite' : '#f8f8ff',
		'gold' : '#ffd700',
		'goldenrod' : '#daa520',
		'gray' : '#808080',
		'green' : '#008000',
		'greenyellow' : '#adff2f',
		'honeydew' : '#f0fff0',
		'hotpink' : '#ff69b4',
		'indianred ' : '#cd5c5c',
		'indigo ' : '#4b0082',
		'ivory' : '#fffff0',
		'khaki' : '#f0e68c',
		'lavender' : '#e6e6fa',
		'lavenderblush' : '#fff0f5',
		'lawngreen' : '#7cfc00',
		'lemonchiffon' : '#fffacd',
		'lightblue' : '#add8e6',
		'lightcoral' : '#f08080',
		'lightcyan' : '#e0ffff',
		'lightgoldenrodyellow' : '#fafad2',
		'lightgrey' : '#d3d3d3',
		'lightgreen' : '#90ee90',
		'lightpink' : '#ffb6c1',
		'lightsalmon' : '#ffa07a',
		'lightseagreen' : '#20b2aa',
		'lightskyblue' : '#87cefa',
		'lightslategray' : '#778899',
		'lightsteelblue' : '#b0c4de',
		'lightyellow' : '#ffffe0',
		'lime' : '#00ff00',
		'limegreen' : '#32cd32',
		'linen' : '#faf0e6',
		'magenta' : '#ff00ff',
		'maroon' : '#800000',
		'mediumaquamarine' : '#66cdaa',
		'mediumblue' : '#0000cd',
		'mediumorchid' : '#ba55d3',
		'mediumpurple' : '#9370d8',
		'mediumseagreen' : '#3cb371',
		'mediumslateblue' : '#7b68ee',
		'mediumspringgreen' : '#00fa9a',
		'mediumturquoise' : '#48d1cc',
		'mediumvioletred' : '#c71585',
		'midnightblue' : '#191970',
		'mintcream' : '#f5fffa',
		'mistyrose' : '#ffe4e1',
		'moccasin' : '#ffe4b5',
		'navajowhite' : '#ffdead',
		'navy' : '#000080',
		'oldlace' : '#fdf5e6',
		'olive' : '#808000',
		'olivedrab' : '#6b8e23',
		'orange' : '#ffa500',
		'orangered' : '#ff4500',
		'orchid' : '#da70d6',
		'palegoldenrod' : '#eee8aa',
		'palegreen' : '#98fb98',
		'paleturquoise' : '#afeeee',
		'palevioletred' : '#d87093',
		'papayawhip' : '#ffefd5',
		'peachpuff' : '#ffdab9',
		'peru' : '#cd853f',
		'pink' : '#ffc0cb',
		'plum' : '#dda0dd',
		'powderblue' : '#b0e0e6',
		'purple' : '#800080',
		'red' : '#ff0000',
		'rosybrown' : '#bc8f8f',
		'royalblue' : '#4169e1',
		'saddlebrown' : '#8b4513',
		'salmon' : '#fa8072',
		'sandybrown' : '#f4a460',
		'seagreen' : '#2e8b57',
		'seashell' : '#fff5ee',
		'sienna' : '#a0522d',
		'silver' : '#c0c0c0',
		'skyblue' : '#87ceeb',
		'slateblue' : '#6a5acd',
		'slategray' : '#708090',
		'snow' : '#fffafa',
		'springgreen' : '#00ff7f',
		'steelblue' : '#4682b4',
		'tan' : '#d2b48c',
		'teal' : '#008080',
		'thistle' : '#d8bfd8',
		'tomato' : '#ff6347',
		'turquoise' : '#40e0d0',
		'violet' : '#ee82ee',
		'wheat' : '#f5deb3',
		'white' : '#ffffff',
		'whitesmoke' : '#f5f5f5',
		'yellow' : '#ffff00',
		'yellowgreen' : '#9acd32'
	};

	pack.angleBetweenLargest = function(angles) {
		if (angles.length === 0) {
			return {
				angle : 0,
				largest : m.PI * 2
			};
		}
		if (angles.length === 1) {
			return {
				angle : angles[0] + m.PI,
				largest : m.PI * 2
			};
		}
		let largest = 0;
		let angle = 0;
		for ( let i = 0, ii = angles.length - 1; i < ii; i++) {
			let dif = angles[i + 1] - angles[i];
			if (dif > largest) {
				largest = dif;
				angle = (angles[i + 1] + angles[i]) / 2;
			}
		}
		let last = angles[0] + m.PI * 2 - angles[angles.length - 1];
		if (last > largest) {
			angle = angles[0] - last / 2;
			largest = last;
			if (angle < 0) {
				angle += m.PI * 2;
			}
		}
		return {
			angle : angle,
			largest : largest
		};
	};

	pack.isBetween = function(x, left, right) {
		if (left > right) {
			let tmp = left;
			left = right;
			right = tmp;
		}
		return x >= left && x <= right;
	};

	// be careful not to remove this, as this will cause corruption issues
	// contact iChemLabs for instructions to remove this
	document.addEventListener("DOMContentLoaded", function(event) {
		if(c && c.iChemLabs && c.iChemLabs.checkForUpdates){
			c.iChemLabs.checkForUpdates({});
		}
	});

	pack.getRGB = function(color, multiplier) {
		let err = [ 0, 0, 0 ];
		if (namedColors[color.toLowerCase()]) {
			color = namedColors[color.toLowerCase()];
		}
		if (color.charAt(0) === '#') {
			if (color.length === 4) {
				color = '#' + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2) + color.charAt(3) + color.charAt(3);
			}
			return [ parseInt(color.substring(1, 3), 16) / 255.0 * multiplier, parseInt(color.substring(3, 5), 16) / 255.0 * multiplier, parseInt(color.substring(5, 7), 16) / 255.0 * multiplier ];
		} else if (color.startsWith('rgba')) {
			// check for rgba before check for rgb
			let cs = color.replace(/rgba\(|\)/g, '').split(',');
			if (cs.length !== 4) {
				return err;
			}
			return [ parseInt(cs[0]) / 255.0 * multiplier, parseInt(cs[1]) / 255.0 * multiplier, parseInt(cs[2]) / 255.0 * multiplier, parseInt(cs[3]) / 255.0 * multiplier ];
		} else if (color.startsWith('rgb')) {
			let cs = color.replace(/rgb\(|\)/g, '').split(',');
			if (cs.length !== 3) {
				return err;
			}
			return [ parseInt(cs[0]) / 255.0 * multiplier, parseInt(cs[1]) / 255.0 * multiplier, parseInt(cs[2]) / 255.0 * multiplier ];
		}
		return err;
	};

	pack.hsl2rgb = function(h, s, l) {
		let hue2rgb = function(p, q, t) {
			if (t < 0) {
				t += 1;
			} else if (t > 1) {
				t -= 1;
			}
			if (t < 1 / 6) {
				return p + (q - p) * 6 * t;
			} else if (t < 1 / 2) {
				return q;
			} else if (t < 2 / 3) {
				return p + (q - p) * (2 / 3 - t) * 6;
			}
			return p;
		};
		let r, g, b;
		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			let p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}
		return [ r * 255, g * 255, b * 255 ];
	};

	pack.idx2color = function(value) {
		let hex = value.toString(16);

		// add '0' padding
		for ( let i = 0, ii = 6 - hex.length; i < ii; i++) {
			hex = "0" + hex;
		}

		return "#" + hex;
	};

	pack.distanceFromPointToLineInclusive = function(p, l1, l2, retract) {
		let length = l1.distance(l2);
		let angle = l1.angle(l2);
		let angleDif = m.PI / 2 - angle;
		let newAngleP = l1.angle(p) + angleDif;
		let pDist = l1.distance(p);
		let pcopRot = new structures.Point(pDist * m.cos(newAngleP), -pDist * m.sin(newAngleP));
		let pull = retract?retract:0;
		if (pack.isBetween(-pcopRot.y, pull, length-pull)) {
			return m.abs(pcopRot.x);
		}
		return -1;
	};

	pack.calculateDistanceInterior = function(to, from, r) {
		if (this.isBetween(from.x, r.x, r.x + r.w) && this.isBetween(from.y, r.y, r.y + r.h)) {
			return to.distance(from);
		}
		// calculates the distance that a line needs to remove from itself to be
		// outside that rectangle
		let lines = [];
		// top
		lines.push({
			x1 : r.x,
			y1 : r.y,
			x2 : r.x + r.w,
			y2 : r.y
		});
		// bottom
		lines.push({
			x1 : r.x,
			y1 : r.y + r.h,
			x2 : r.x + r.w,
			y2 : r.y + r.h
		});
		// left
		lines.push({
			x1 : r.x,
			y1 : r.y,
			x2 : r.x,
			y2 : r.y + r.h
		});
		// right
		lines.push({
			x1 : r.x + r.w,
			y1 : r.y,
			x2 : r.x + r.w,
			y2 : r.y + r.h
		});

		let intersections = [];
		for ( let i = 0; i < 4; i++) {
			let l = lines[i];
			let p = this.intersectLines(from.x, from.y, to.x, to.y, l.x1, l.y1, l.x2, l.y2);
			if (p) {
				intersections.push(p);
			}
		}
		if (intersections.length === 0) {
			return 0;
		}
		let max = 0;
		for ( let i = 0, ii = intersections.length; i < ii; i++) {
			let p = intersections[i];
			let dx = to.x - p.x;
			let dy = to.y - p.y;
			max = m.max(max, m.sqrt(dx * dx + dy * dy));
		}
		return max;
	};

	pack.intersectLines = function(ax, ay, bx, by, cx, cy, dx, dy) {
		// calculate the direction vectors
		bx -= ax;
		by -= ay;
		dx -= cx;
		dy -= cy;

		// are they parallel?
		let denominator = by * dx - bx * dy;
		if (denominator === 0) {
			return false;
		}

		// calculate point of intersection
		let r = (dy * (ax - cx) - dx * (ay - cy)) / denominator;
		let s = (by * (ax - cx) - bx * (ay - cy)) / denominator;
		if ((s >= 0) && (s <= 1) && (r >= 0) && (r <= 1)) {
			return {
				x : (ax + r * bx),
				y : (ay + r * by)
			};
		} else {
			return false;
		}
	};

	pack.clamp = function(value, min, max) {
		return value < min ? min : value > max ? max : value;
	};

	pack.rainbowAt = function(i, ii, colors) {

		// The rainbow colors length must be more than one color
		if (colors.length < 1) {
			colors.push('#000000', '#FFFFFF');
		} else if (colors.length < 2) {
			colors.push('#FFFFFF');
		}

		let step = ii / (colors.length - 1);
		let j = m.floor(i / step);
		let t = (i - j * step) / step;
		let startColor = pack.getRGB(colors[j], 1);
		let endColor = pack.getRGB(colors[j + 1], 1);

		let lerpColor = [ (startColor[0] + (endColor[0] - startColor[0]) * t) * 255, (startColor[1] + (endColor[1] - startColor[1]) * t) * 255, (startColor[2] + (endColor[2] - startColor[2]) * t) * 255 ];

		return 'rgb(' + lerpColor.join(',') + ')';
	};

	pack.angleBounds = function(angle, convertToDegrees, limitToPi) {
		let full = m.PI*2;
		while(angle<0){
			angle+=full;
		}
		while(angle>full){
			angle-=full;
		}
		if(limitToPi && angle>m.PI){
			angle = 2*m.PI-angle;
		}
		if(convertToDegrees){
			angle = 180*angle/m.PI;
		}
		return angle;
	};

	pack.isPointInPoly = function(poly, pt) {
		// this function needs var to work properly
		for ( var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
			((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y)) && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) && (c = !c);
		}
		return c;
	};

	return pack;

})(ChemDoodle, ChemDoodle.structures, Math, document);

(function(math, m, undefined) {
	'use strict';
	math.Bounds = function() {
	};
	let _ = math.Bounds.prototype;
	_.minX = _.minY = _.minZ = Infinity;
	_.maxX = _.maxY = _.maxZ = -Infinity;
	_.expand = function(x1, y1, x2, y2) {
		if (x1 instanceof math.Bounds) {
			// only need to compare min and max since bounds already has
			// them ordered
			this.minX = m.min(this.minX, x1.minX);
			this.minY = m.min(this.minY, x1.minY);
			this.maxX = m.max(this.maxX, x1.maxX);
			this.maxY = m.max(this.maxY, x1.maxY);
			if(x1.maxZ!==Infinity){
				this.minZ = m.min(this.minZ, x1.minZ);
				this.maxZ = m.max(this.maxZ, x1.maxZ);
			}
		} else {
			this.minX = m.min(this.minX, x1);
			this.maxX = m.max(this.maxX, x1);
			this.minY = m.min(this.minY, y1);
			this.maxY = m.max(this.maxY, y1);
			// these two values could be 0, so check if undefined
			if (x2 !== undefined && y2 !== undefined) {
				this.minX = m.min(this.minX, x2);
				this.maxX = m.max(this.maxX, x2);
				this.minY = m.min(this.minY, y2);
				this.maxY = m.max(this.maxY, y2);
			}
		}
	};
	_.expand3D = function(x1, y1, z1, x2, y2, z2) {
		this.minX = m.min(this.minX, x1);
		this.maxX = m.max(this.maxX, x1);
		this.minY = m.min(this.minY, y1);
		this.maxY = m.max(this.maxY, y1);
		this.minZ = m.min(this.minZ, z1);
		this.maxZ = m.max(this.maxZ, z1);
		// these two values could be 0, so check if undefined
		if (x2 !== undefined && y2 !== undefined && z2 !== undefined) {
			this.minX = m.min(this.minX, x2);
			this.maxX = m.max(this.maxX, x2);
			this.minY = m.min(this.minY, y2);
			this.maxY = m.max(this.maxY, y2);
			this.minZ = m.min(this.minZ, z2);
			this.maxZ = m.max(this.maxZ, z2);
		}
	};

})(ChemDoodle.math, Math);

ChemDoodle.featureDetection = (function (iChemLabs, document, window, undefined) {
	'use strict';
	let features = {};

	features.supports_canvas = function () {
		return !!document.createElement('canvas').getContext;
	};

	features.supports_canvas_text = function () {
		if (!features.supports_canvas()) {
			return false;
		}
		let dummy_canvas = document.createElement('canvas');
		let context = dummy_canvas.getContext('2d');
		return typeof context.fillText === 'function';
	};

	features.supports_webgl = function () {
		let dummy_canvas = document.createElement('canvas');
		try {
			if (dummy_canvas.getContext('webgl')) {
				return true;
			}
			if (dummy_canvas.getContext('experimental-webgl')) {
				return true;
			}
		} catch (b) {
		}
		return false;
	};

	features.supports_xhr2 = function () {
		return 'withCredentials' in new XMLHttpRequest();
	};

	features.supports_touch = function () {
		// check the mobile os so we don't interfere with hybrid pcs
		let isMobile = (/iPhone|iPad|iPod|Android|BlackBerry|BB10/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && !window.MSStream;
		return 'ontouchstart' in window && isMobile;
	};

	features.supports_gesture = function () {
		return 'ongesturestart' in window;
	};

	return features;

})(ChemDoodle.iChemLabs, document, window);

// all symbols
ChemDoodle.SYMBOLS = [ 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl',
		'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og' ];

ChemDoodle.ELEMENT = (function(SYMBOLS, undefined) {
	'use strict';
	let E = [];

	function Element(symbol, name, atomicNumber, addH, color, covalentRadius, vdWRadius, valency, mass) {
		this.symbol = symbol;
		this.name = name;
		this.atomicNumber = atomicNumber;
		this.addH = addH;
		this.jmolColor = this.pymolColor = color;
		this.covalentRadius = covalentRadius;
		this.vdWRadius = vdWRadius;
		this.valency = valency;
		this.mass = mass;
	}

	E.H = new Element('H', 'Hydrogen', 1, false, '#FFFFFF', 0.31, 1.1, 1, 1);
	E.He = new Element('He', 'Helium', 2, false, '#D9FFFF', 0.28, 1.4, 0, 4);
	E.Li = new Element('Li', 'Lithium', 3, false, '#CC80FF', 1.28, 1.82, 1, 7);
	E.Be = new Element('Be', 'Beryllium', 4, false, '#C2FF00', 0.96, 1.53, 2, 9);
	E.B = new Element('B', 'Boron', 5, true, '#FFB5B5', 0.84, 1.92, 3, 11);
	E.C = new Element('C', 'Carbon', 6, true, '#909090', 0.76, 1.7, 4, 12);
	E.N = new Element('N', 'Nitrogen', 7, true, '#3050F8', 0.71, 1.55, 3, 14);
	E.O = new Element('O', 'Oxygen', 8, true, '#FF0D0D', 0.66, 1.52, 2, 16);
	E.F = new Element('F', 'Fluorine', 9, true, '#90E050', 0.57, 1.47, 1, 19);
	E.Ne = new Element('Ne', 'Neon', 10, false, '#B3E3F5', 0.58, 1.54, 0, 20);
	E.Na = new Element('Na', 'Sodium', 11, false, '#AB5CF2', 1.66, 2.27, 1, 23);
	E.Mg = new Element('Mg', 'Magnesium', 12, false, '#8AFF00', 1.41, 1.73, 0, 24);
	E.Al = new Element('Al', 'Aluminum', 13, false, '#BFA6A6', 1.21, 1.84, 0, 27);
	E.Si = new Element('Si', 'Silicon', 14, true, '#F0C8A0', 1.11, 2.1, 4, 28);
	E.P = new Element('P', 'Phosphorus', 15, true, '#FF8000', 1.07, 1.8, 3, 31);
	E.S = new Element('S', 'Sulfur', 16, true, '#FFFF30', 1.05, 1.8, 2, 32);
	E.Cl = new Element('Cl', 'Chlorine', 17, true, '#1FF01F', 1.02, 1.75, 1, 35);
	E.Ar = new Element('Ar', 'Argon', 18, false, '#80D1E3', 1.06, 1.88, 0, 40);
	E.K = new Element('K', 'Potassium', 19, false, '#8F40D4', 2.03, 2.75, 0, 39);
	E.Ca = new Element('Ca', 'Calcium', 20, false, '#3DFF00', 1.76, 2.31, 0, 40);
	E.Sc = new Element('Sc', 'Scandium', 21, false, '#E6E6E6', 1.7, 0, 0, 45);
	E.Ti = new Element('Ti', 'Titanium', 22, false, '#BFC2C7', 1.6, 0, 1, 48);
	E.V = new Element('V', 'Vanadium', 23, false, '#A6A6AB', 1.53, 0, 1, 51);
	E.Cr = new Element('Cr', 'Chromium', 24, false, '#8A99C7', 1.39, 0, 2, 52);
	E.Mn = new Element('Mn', 'Manganese', 25, false, '#9C7AC7', 1.39, 0, 3, 55);
	E.Fe = new Element('Fe', 'Iron', 26, false, '#E06633', 1.32, 0, 2, 56);
	E.Co = new Element('Co', 'Cobalt', 27, false, '#F090A0', 1.26, 0, 1, 59);
	E.Ni = new Element('Ni', 'Nickel', 28, false, '#50D050', 1.24, 1.63, 1, 58);
	E.Cu = new Element('Cu', 'Copper', 29, false, '#C88033', 1.32, 1.4, 0, 63);
	E.Zn = new Element('Zn', 'Zinc', 30, false, '#7D80B0', 1.22, 1.39, 0, 64);
	E.Ga = new Element('Ga', 'Gallium', 31, false, '#C28F8F', 1.22, 1.87, 0, 69);
	E.Ge = new Element('Ge', 'Germanium', 32, false, '#668F8F', 1.2, 2.11, 4, 74);
	E.As = new Element('As', 'Arsenic', 33, true, '#BD80E3', 1.19, 1.85, 3, 75);
	E.Se = new Element('Se', 'Selenium', 34, true, '#FFA100', 1.2, 1.9, 2, 80);
	E.Br = new Element('Br', 'Bromine', 35, true, '#A62929', 1.2, 1.85, 1, 79);
	E.Kr = new Element('Kr', 'Krypton', 36, false, '#5CB8D1', 1.16, 2.02, 0, 84);
	E.Rb = new Element('Rb', 'Rubidium', 37, false, '#702EB0', 2.2, 3.03, 0, 85);
	E.Sr = new Element('Sr', 'Strontium', 38, false, '#00FF00', 1.95, 2.49, 0, 88);
	E.Y = new Element('Y', 'Yttrium', 39, false, '#94FFFF', 1.9, 0, 0, 89);
	E.Zr = new Element('Zr', 'Zirconium', 40, false, '#94E0E0', 1.75, 0, 0, 90);
	E.Nb = new Element('Nb', 'Niobium', 41, false, '#73C2C9', 1.64, 0, 1, 93);
	E.Mo = new Element('Mo', 'Molybdenum', 42, false, '#54B5B5', 1.54, 0, 2, 98);
	E.Tc = new Element('Tc', 'Technetium', 43, false, '#3B9E9E', 1.47, 0, 3, 0);
	E.Ru = new Element('Ru', 'Ruthenium', 44, false, '#248F8F', 1.46, 0, 2, 102);
	E.Rh = new Element('Rh', 'Rhodium', 45, false, '#0A7D8C', 1.42, 0, 1, 103);
	E.Pd = new Element('Pd', 'Palladium', 46, false, '#006985', 1.39, 1.63, 0, 106);
	E.Ag = new Element('Ag', 'Silver', 47, false, '#C0C0C0', 1.45, 1.72, 0, 107);
	E.Cd = new Element('Cd', 'Cadmium', 48, false, '#FFD98F', 1.44, 1.58, 0, 114);
	E.In = new Element('In', 'Indium', 49, false, '#A67573', 1.42, 1.93, 0, 115);
	E.Sn = new Element('Sn', 'Tin', 50, false, '#668080', 1.39, 2.17, 4, 120);
	E.Sb = new Element('Sb', 'Antimony', 51, false, '#9E63B5', 1.39, 2.06, 3, 121);
	E.Te = new Element('Te', 'Tellurium', 52, true, '#D47A00', 1.38, 2.06, 2, 130);
	E.I = new Element('I', 'Iodine', 53, true, '#940094', 1.39, 1.98, 1, 127);
	E.Xe = new Element('Xe', 'Xenon', 54, false, '#429EB0', 1.4, 2.16, 0, 132);
	E.Cs = new Element('Cs', 'Cesium', 55, false, '#57178F', 2.44, 3.43, 0, 133);
	E.Ba = new Element('Ba', 'Barium', 56, false, '#00C900', 2.15, 2.68, 0, 138);
	E.La = new Element('La', 'Lanthanum', 57, false, '#70D4FF', 2.07, 0, 0, 139);
	E.Ce = new Element('Ce', 'Cerium', 58, false, '#FFFFC7', 2.04, 0, 0, 140);
	E.Pr = new Element('Pr', 'Praseodymium', 59, false, '#D9FFC7', 2.03, 0, 0, 141);
	E.Nd = new Element('Nd', 'Neodymium', 60, false, '#C7FFC7', 2.01, 0, 0, 142);
	E.Pm = new Element('Pm', 'Promethium', 61, false, '#A3FFC7', 1.99, 0, 0, 0);
	E.Sm = new Element('Sm', 'Samarium', 62, false, '#8FFFC7', 1.98, 0, 0, 152);
	E.Eu = new Element('Eu', 'Europium', 63, false, '#61FFC7', 1.98, 0, 0, 153);
	E.Gd = new Element('Gd', 'Gadolinium', 64, false, '#45FFC7', 1.96, 0, 0, 158);
	E.Tb = new Element('Tb', 'Terbium', 65, false, '#30FFC7', 1.94, 0, 0, 159);
	E.Dy = new Element('Dy', 'Dysprosium', 66, false, '#1FFFC7', 1.92, 0, 0, 164);
	E.Ho = new Element('Ho', 'Holmium', 67, false, '#00FF9C', 1.92, 0, 0, 165);
	E.Er = new Element('Er', 'Erbium', 68, false, '#00E675', 1.89, 0, 0, 166);
	E.Tm = new Element('Tm', 'Thulium', 69, false, '#00D452', 1.9, 0, 0, 169);
	E.Yb = new Element('Yb', 'Ytterbium', 70, false, '#00BF38', 1.87, 0, 0, 174);
	E.Lu = new Element('Lu', 'Lutetium', 71, false, '#00AB24', 1.87, 0, 0, 175);
	E.Hf = new Element('Hf', 'Hafnium', 72, false, '#4DC2FF', 1.75, 0, 0, 180);
	E.Ta = new Element('Ta', 'Tantalum', 73, false, '#4DA6FF', 1.7, 0, 1, 181);
	E.W = new Element('W', 'Tungsten', 74, false, '#2194D6', 1.62, 0, 2, 184);
	E.Re = new Element('Re', 'Rhenium', 75, false, '#267DAB', 1.51, 0, 3, 187);
	E.Os = new Element('Os', 'Osmium', 76, false, '#266696', 1.44, 0, 2, 192);
	E.Ir = new Element('Ir', 'Iridium', 77, false, '#175487', 1.41, 0, 3, 193);
	E.Pt = new Element('Pt', 'Platinum', 78, false, '#D0D0E0', 1.36, 1.75, 0, 195);
	E.Au = new Element('Au', 'Gold', 79, false, '#FFD123', 1.36, 1.66, 1, 197);
	E.Hg = new Element('Hg', 'Mercury', 80, false, '#B8B8D0', 1.32, 1.55, 0, 202);
	E.Tl = new Element('Tl', 'Thallium', 81, false, '#A6544D', 1.45, 1.96, 0, 205);
	E.Pb = new Element('Pb', 'Lead', 82, false, '#575961', 1.46, 2.02, 4, 208);
	E.Bi = new Element('Bi', 'Bismuth', 83, false, '#9E4FB5', 1.48, 2.07, 3, 209);
	E.Po = new Element('Po', 'Polonium', 84, false, '#AB5C00', 1.4, 1.97, 2, 0);
	E.At = new Element('At', 'Astatine', 85, true, '#754F45', 1.5, 2.02, 1, 0);
	E.Rn = new Element('Rn', 'Radon', 86, false, '#428296', 1.5, 2.2, 0, 0);
	E.Fr = new Element('Fr', 'Francium', 87, false, '#420066', 2.6, 3.48, 0, 0);
	E.Ra = new Element('Ra', 'Radium', 88, false, '#007D00', 2.21, 2.83, 0, 0);
	E.Ac = new Element('Ac', 'Actinium', 89, false, '#70ABFA', 2.15, 0, 0, 0);
	E.Th = new Element('Th', 'Thorium', 90, false, '#00BAFF', 2.06, 0, 0, 232);
	E.Pa = new Element('Pa', 'Protactinium', 91, false, '#00A1FF', 2, 0, 0, 231);
	E.U = new Element('U', 'Uranium', 92, false, '#008FFF', 1.96, 1.86, 0, 238);
	E.Np = new Element('Np', 'Neptunium', 93, false, '#0080FF', 1.9, 0, 0, 0);
	E.Pu = new Element('Pu', 'Plutonium', 94, false, '#006BFF', 1.87, 0, 0, 0);
	E.Am = new Element('Am', 'Americium', 95, false, '#545CF2', 1.8, 0, 0, 0);
	E.Cm = new Element('Cm', 'Curium', 96, false, '#785CE3', 1.69, 0, 0, 0);
	E.Bk = new Element('Bk', 'Berkelium', 97, false, '#8A4FE3', 0, 0, 0, 0);
	E.Cf = new Element('Cf', 'Californium', 98, false, '#A136D4', 0, 0, 0, 0);
	E.Es = new Element('Es', 'Einsteinium', 99, false, '#B31FD4', 0, 0, 0, 0);
	E.Fm = new Element('Fm', 'Fermium', 100, false, '#B31FBA', 0, 0, 0, 0);
	E.Md = new Element('Md', 'Mendelevium', 101, false, '#B30DA6', 0, 0, 0, 0);
	E.No = new Element('No', 'Nobelium', 102, false, '#BD0D87', 0, 0, 0, 0);
	E.Lr = new Element('Lr', 'Lawrencium', 103, false, '#C70066', 0, 0, 0, 0);
	E.Rf = new Element('Rf', 'Rutherfordium', 104, false, '#CC0059', 0, 0, 0, 0);
	E.Db = new Element('Db', 'Dubnium', 105, false, '#D1004F', 0, 0, 0, 0);
	E.Sg = new Element('Sg', 'Seaborgium', 106, false, '#D90045', 0, 0, 0, 0);
	E.Bh = new Element('Bh', 'Bohrium', 107, false, '#E00038', 0, 0, 0, 0);
	E.Hs = new Element('Hs', 'Hassium', 108, false, '#E6002E', 0, 0, 0, 0);
	E.Mt = new Element('Mt', 'Meitnerium', 109, false, '#EB0026', 0, 0, 0, 0);
	E.Ds = new Element('Ds', 'Darmstadtium', 110, false, '#000000', 0, 0, 0, 0);
	E.Rg = new Element('Rg', 'Roentgenium', 111, false, '#000000', 0, 0, 0, 0);
	E.Cn = new Element('Cn', 'Copernicium', 112, false, '#000000', 0, 0, 0, 0);
	E.Nh = new Element('Nh', 'Nihonium', 113, false, '#000000', 0, 0, 0, 0);
	E.Fl = new Element('Fl', 'Flerovium', 114, false, '#000000', 0, 0, 0, 0);
	E.Mc = new Element('Mc', 'Moscovium', 115, false, '#000000', 0, 0, 0, 0);
	E.Lv = new Element('Lv', 'Livermorium', 116, false, '#000000', 0, 0, 0, 0);
	E.Ts = new Element('Ts', 'Tennessine', 117, false, '#000000', 0, 0, 0, 0);
	E.Og = new Element('Og', 'Oganesson', 118, false, '#000000', 0, 0, 0, 0);

	E.H.pymolColor = '#E6E6E6';
	E.C.pymolColor = '#33FF33';
	E.N.pymolColor = '#3333FF';
	E.O.pymolColor = '#FF4D4D';
	E.F.pymolColor = '#B3FFFF';
	E.S.pymolColor = '#E6C640';

	return E;

})(ChemDoodle.SYMBOLS);
ChemDoodle.RESIDUE = (function(undefined) {
	'use strict';
	let R = [];

	function Residue(symbol, name, polar, aminoColor, shapelyColor, acidity) {
		this.symbol = symbol;
		this.name = name;
		this.polar = polar;
		this.aminoColor = aminoColor;
		this.shapelyColor = shapelyColor;
		this.acidity = acidity;
	}

	R.Ala = new Residue('Ala', 'Alanine', false, '#C8C8C8', '#8CFF8C', 0);
	R.Arg = new Residue('Arg', 'Arginine', true, '#145AFF', '#00007C', 1);
	R.Asn = new Residue('Asn', 'Asparagine', true, '#00DCDC', '#FF7C70', 0);
	R.Asp = new Residue('Asp', 'Aspartic Acid', true, '#E60A0A', '#A00042', -1);
	R.Cys = new Residue('Cys', 'Cysteine', true, '#E6E600', '#FFFF70', 0);
	R.Gln = new Residue('Gln', 'Glutamine', true, '#00DCDC', '#FF4C4C', 0);
	R.Glu = new Residue('Glu', 'Glutamic Acid', true, '#E60A0A', '#660000', -1);
	R.Gly = new Residue('Gly', 'Glycine', false, '#EBEBEB', '#FFFFFF', 0);
	R.His = new Residue('His', 'Histidine', true, '#8282D2', '#7070FF', 1);
	R.Ile = new Residue('Ile', 'Isoleucine', false, '#0F820F', '#004C00', 0);
	R.Leu = new Residue('Leu', 'Leucine', false, '#0F820F', '#455E45', 0);
	R.Lys = new Residue('Lys', 'Lysine', true, '#145AFF', '#4747B8', 1);
	R.Met = new Residue('Met', 'Methionine', false, '#E6E600', '#B8A042', 0);
	R.Phe = new Residue('Phe', 'Phenylalanine', false, '#3232AA', '#534C52', 0);
	R.Pro = new Residue('Pro', 'Proline', false, '#DC9682', '#525252', 0);
	R.Ser = new Residue('Ser', 'Serine', true, '#FA9600', '#FF7042', 0);
	R.Thr = new Residue('Thr', 'Threonine', true, '#FA9600', '#B84C00', 0);
	R.Trp = new Residue('Trp', 'Tryptophan', true, '#B45AB4', '#4F4600', 0);
	R.Tyr = new Residue('Tyr', 'Tyrosine', true, '#3232AA', '#8C704C', 0);
	R.Val = new Residue('Val', 'Valine', false, '#0F820F', '#FF8CFF', 0);
	R.Asx = new Residue('Asx', 'Asparagine/Aspartic Acid', true, '#FF69B4', '#FF00FF', 0);
	R.Glx = new Residue('Glx', 'Glutamine/Glutamic Acid', true, '#FF69B4', '#FF00FF', 0);
	R['*'] = new Residue('*', 'Other', false, '#BEA06E', '#FF00FF', 0);
	R.A = new Residue('A', 'Adenine', false, '#BEA06E', '#A0A0FF', 0);
	R.G = new Residue('G', 'Guanine', false, '#BEA06E', '#FF7070', 0);
	R.I = new Residue('I', '', false, '#BEA06E', '#80FFFF', 0);
	R.C = new Residue('C', 'Cytosine', false, '#BEA06E', '#FF8C4B', 0);
	R.T = new Residue('T', 'Thymine', false, '#BEA06E', '#A0FFA0', 0);
	R.U = new Residue('U', 'Uracil', false, '#BEA06E', '#FF8080', 0);

	return R;

})();

(function(structures, undefined) {
	'use strict';
	
	// This is a more efficient Queue implementation other than using Array.shift() on each dequeue, which is very expensive
	// this is 2-3x faster
	
	/*
	 * Creates a new Queue. A Queue is a first-in-first-out (FIFO) data
	 * structure. Functions of the Queue object allow elements to be
	 * enthis.queued and dethis.queued, the first element to be obtained without
	 * dequeuing, and for the current size of the Queue and empty/non-empty
	 * status to be obtained.
	 */
	structures.Queue = function() {
		// the list of elements, initialised to the empty array
		this.queue = [];
	};
	let _ = structures.Queue.prototype;

	// the amount of space at the front of the this.queue, initialised to zero
	_.queueSpace = 0;

	/*
	 * Returns the size of this Queue. The size of a Queue is equal to the
	 * number of elements that have been enthis.queued minus the number of
	 * elements that have been dethis.queued.
	 */
	_.getSize = function() {

		// return the number of elements in the this.queue
		return this.queue.length - this.queueSpace;

	};

	/*
	 * Returns true if this Queue is empty, and false otherwise. A Queue is
	 * empty if the number of elements that have been enthis.queued equals the
	 * number of elements that have been dethis.queued.
	 */
	_.isEmpty = function() {

		// return true if the this.queue is empty, and false otherwise
		return this.queue.length === 0;

	};

	/*
	 * Enthis.queues the specified element in this Queue. The parameter is:
	 * 
	 * element - the element to enthis.queue
	 */
	_.enqueue = function(element) {
		this.queue.push(element);
	};

	/*
	 * Dethis.queues an element from this Queue. The oldest element in this
	 * Queue is removed and returned. If this Queue is empty then undefined is
	 * returned.
	 */
	_.dequeue = function() {

		// initialise the element to return to be undefined
		let element;

		// check whether the this.queue is empty
		if (this.queue.length) {

			// fetch the oldest element in the this.queue
			element = this.queue[this.queueSpace];

			// update the amount of space and check whether a shift should
			// occur
			if (++this.queueSpace * 2 >= this.queue.length) {

				// set the this.queue equal to the non-empty portion of the
				// this.queue
				this.queue = this.queue.slice(this.queueSpace);

				// reset the amount of space at the front of the this.queue
				this.queueSpace = 0;

			}

		}

		// return the removed element
		return element;

	};

	/*
	 * Returns the oldest element in this Queue. If this Queue is empty then
	 * undefined is returned. This function returns the same value as the
	 * dethis.queue function, but does not remove the returned element from this
	 * Queue.
	 */
	_.getOldestElement = function() {

		// initialise the element to return to be undefined
		let element;

		// if the this.queue is not element then fetch the oldest element in the
		// this.queue
		if (this.queue.length) {
			element = this.queue[this.queueSpace];
		}

		// return the oldest element
		return element;
	};

})(ChemDoodle.structures);

(function(structures, m, undefined) {
	'use strict';
	structures.Point = function(x, y) {
		this.x = x ? x : 0;
		this.y = y ? y : 0;
	};
	let _ = structures.Point.prototype;
	_.sub = function(p) {
		this.x -= p.x;
		this.y -= p.y;
	};
	_.add = function(p) {
		this.x += p.x;
		this.y += p.y;
	};
	_.distance = function(p) {
		let dx = p.x - this.x;
		let dy = p.y - this.y;
		return m.sqrt(dx * dx + dy * dy);
	};
	_.angleForStupidCanvasArcs = function(p) {
		let dx = p.x - this.x;
		let dy = p.y - this.y;
		let angle = 0;
		// Calculate angle
		if (dx === 0) {
			if (dy === 0) {
				angle = 0;
			} else if (dy > 0) {
				angle = m.PI / 2;
			} else {
				angle = 3 * m.PI / 2;
			}
		} else if (dy === 0) {
			if (dx > 0) {
				angle = 0;
			} else {
				angle = m.PI;
			}
		} else {
			if (dx < 0) {
				angle = m.atan(dy / dx) + m.PI;
			} else if (dy < 0) {
				angle = m.atan(dy / dx) + 2 * m.PI;
			} else {
				angle = m.atan(dy / dx);
			}
		}
		while (angle < 0) {
			angle += m.PI * 2;
		}
		angle = angle % (m.PI * 2);
		return angle;
	};
	_.angle = function(p) {
		// y is upside down to account for inverted canvas
		let dx = p.x - this.x;
		let dy = this.y - p.y;
		let angle = 0;
		// Calculate angle
		if (dx === 0) {
			if (dy === 0) {
				angle = 0;
			} else if (dy > 0) {
				angle = m.PI / 2;
			} else {
				angle = 3 * m.PI / 2;
			}
		} else if (dy === 0) {
			if (dx > 0) {
				angle = 0;
			} else {
				angle = m.PI;
			}
		} else {
			if (dx < 0) {
				angle = m.atan(dy / dx) + m.PI;
			} else if (dy < 0) {
				angle = m.atan(dy / dx) + 2 * m.PI;
			} else {
				angle = m.atan(dy / dx);
			}
		}
		while (angle < 0) {
			angle += m.PI * 2;
		}
		angle = angle % (m.PI * 2);
		return angle;
	};

})(ChemDoodle.structures, Math);

(function(extensions, structures, m, undefined) {
	'use strict';
	
	let COMMA_SPACE_REGEX = /[ ,]+/;
	let COMMA_DASH_REGEX = /\-+/;
	let FONTS = [ 'Helvetica', 'Arial', 'Dialog' ];
	
	structures.Query = function(type) {
		this.type = type;
		// atom properties
		this.elements = {v:[],not:false};
		this.charge = undefined;
		this.chirality = undefined;
		this.connectivity = undefined;
		this.connectivityNoH = undefined;
		this.hydrogens = undefined;
		this.saturation = undefined;
		// bond properties
		this.orders = {v:[],not:false};
		this.stereo = undefined;
		// generic properties
		this.aromatic = undefined;
		this.ringCount = undefined;
		// cache the string value
		this.cache = undefined;
	};
	structures.Query.TYPE_ATOM = 0;
	structures.Query.TYPE_BOND = 1;
	let _ = structures.Query.prototype;
	_.parseRange = function(range){
		let points = [];
		let splits = range.split(COMMA_SPACE_REGEX);
		for(let i = 0, ii = splits.length; i<ii; i++){
			let t = splits[i];
			let neg = false;
			let neg2 = false;
			if(t.charAt(0)==='-'){
				neg = true;
				t = t.substring(1);
			}
			if (t.indexOf('--')!=-1) {
				neg2 = true;
			}
			if (t.indexOf('-')!=-1) {
				let parts = t.split(COMMA_DASH_REGEX);
				let p = {x:parseInt(parts[0]) * (neg ? -1 : 1),y:parseInt(parts[1]) * (neg2 ? -1 : 1)};
				if (p.y < p.x) {
					let tmp = p.y;
					p.y = p.x;
					p.x = tmp;
				}
				points.push(p);
			} else {
				points.push({x:parseInt(t) * (neg ? -1 : 1)});
			}
		}
		return points;
	};
	_.draw = function(ctx, styles, pos) {
		if(!this.cache){
			this.cache = this.toString();
		}
		let top = this.cache;
		let bottom = undefined;
		let split = top.indexOf('(');
		if(split!=-1){
			top = this.cache.substring(0, split);
			bottom = this.cache.substring(split, this.cache.length);
		}
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = extensions.getFontString(12, FONTS, true, false);
		let tw = ctx.measureText(top).width;
		ctx.fillStyle = styles.backgroundColor;
		ctx.fillRect(pos.x-tw/2, pos.y-6, tw, 12);
		ctx.fillStyle = 'black';
		ctx.fillText(top, pos.x, pos.y);
		if(bottom){
			ctx.font = extensions.getFontString(10, FONTS, false, true);
			tw = ctx.measureText(bottom).width;
			ctx.fillStyle = styles.backgroundColor;
			ctx.fillRect(pos.x-tw/2, pos.y+6, tw, 11);
			ctx.fillStyle = 'black';
			ctx.fillText(bottom, pos.x, pos.y+11);
		}
	};
	_.outputRange = function(array){
		let comma = false;
		let sb = [];
		for(let i = 0, ii = array.length; i<ii; i++){
			if(comma){
				sb.push(',');
			}
			comma = true;
			let p = array[i];
			if(p.y){
				sb.push(p.x);
				sb.push('-');
				sb.push(p.y);
			}else{
				sb.push(p.x);
			}
		}
		return sb.join('');
	};
	_.toString = function() {
		let sb = [];
		let attributes = [];
		if(this.type===structures.Query.TYPE_ATOM){
			if(!this.elements || this.elements.v.length===0){
				sb.push('[a]');
			}else{
				if(this.elements.not){
					sb.push('!');
				}
				sb.push('[');
				sb.push(this.elements.v.join(','));
				sb.push(']');
			}
			if(this.chirality){
				attributes.push((this.chirality.not?'!':'')+'@='+this.chirality.v);
			}
			if(this.aromatic){
				attributes.push((this.aromatic.not?'!':'')+'A');
			}
			if(this.charge){
				attributes.push((this.charge.not?'!':'')+'C='+this.outputRange(this.charge.v));
			}
			if(this.hydrogens){
				attributes.push((this.hydrogens.not?'!':'')+'H='+this.outputRange(this.hydrogens.v));
			}
			if(this.ringCount){
				attributes.push((this.ringCount.not?'!':'')+'R='+this.outputRange(this.ringCount.v));
			}
			if(this.saturation){
				attributes.push((this.saturation.not?'!':'')+'S');
			}
			if(this.connectivity){
				attributes.push((this.connectivity.not?'!':'')+'X='+this.outputRange(this.connectivity.v));
			}
			if(this.connectivityNoH){
				attributes.push((this.connectivityNoH.not?'!':'')+'x='+this.outputRange(this.connectivityNoH.v));
			}
		}else if(this.type===structures.Query.TYPE_BOND){
			if(!this.orders || this.orders.v.length===0){
				sb.push('[a]');
			}else{
				if(this.orders.not){
					sb.push('!');
				}
				sb.push('[');
				sb.push(this.orders.v.join(','));
				sb.push(']');
			}
			if(this.stereo){
				attributes.push((this.stereo.not?'!':'')+'@='+this.stereo.v);
			}
			if(this.aromatic){
				attributes.push((this.aromatic.not?'!':'')+'A');
			}
			if(this.ringCount){
				attributes.push((this.ringCount.not?'!':'')+'R='+this.outputRange(this.ringCount.v));
			}
		}
		if(attributes.length>0){
			sb.push('(');
			sb.push(attributes.join(','));
			sb.push(')');
		}
		return sb.join('');
	};

})(ChemDoodle.extensions, ChemDoodle.structures, Math);

(function (ELEMENT, extensions, math, structures, m, m4, undefined) {
	'use strict';
	let whitespaceRegex = /\s+/g;

	structures.Atom = function (label, x, y, z) {
		this.label = label ? label.trim() : 'C';
		this.x = x ? x : 0;
		this.y = y ? y : 0;
		this.z = z ? z : 0;
		// objects cannot be placed directly on the prototype
		this.enhancedStereo = {type:structures.Atom.ESTEREO_ABSOLUTE, group:1};
		this.pid = structures.PID++;
	};
	structures.Atom.ESTEREO_ABSOLUTE = 'abs';
	structures.Atom.ESTEREO_OR = 'or';
	structures.Atom.ESTEREO_AND = '&';
	let _ = structures.Atom.prototype = new structures.Point(0, 0);
	_.charge = 0;
	_.numLonePair = 0;
	_.numRadical = 0;
	_.mass = -1;
	_.implicitH = -1;
	_.coordinationNumber = 0;
	_.bondNumber = 0;
	_.angleOfLeastInterference = 0;
	_.isHidden = false;
	_.altLabel = undefined;
	_.isLone = false;
	_.isHover = false;
	_.isSelected = false;
	_.add3D = function (p) {
		this.x += p.x;
		this.y += p.y;
		this.z += p.z;
	};
	_.sub3D = function (p) {
		this.x -= p.x;
		this.y -= p.y;
		this.z -= p.z;
	};
	_.distance3D = function (p) {
		let dx = p.x - this.x;
		let dy = p.y - this.y;
		let dz = p.z - this.z;
		return m.sqrt(dx * dx + dy * dy + dz * dz);
	};
	_.draw = function (ctx, styles) {
		if (this.dontDraw) {
			// this is used when the atom shouldn't be visible, such as when the text input field is open over this atom
			return;
		}
		if (this.isLassoed) {
			let grd = ctx.createRadialGradient(this.x - 1, this.y - 1, 0, this.x, this.y, 7);
			grd.addColorStop(0, 'rgba(212, 99, 0, 0)');
			grd.addColorStop(0.7, 'rgba(212, 99, 0, 0.8)');
			ctx.fillStyle = grd;
			ctx.beginPath();
			ctx.arc(this.x, this.y, 5, 0, m.PI * 2, false);
			ctx.fill();
		}
		if (this.query) {
			return;
		}
		this.textBounds = [];
		if (this.styles) {
			styles = this.styles;
		}
		let font = extensions.getFontString(styles.atoms_font_size_2D, styles.atoms_font_families_2D, styles.atoms_font_bold_2D, styles.atoms_font_italic_2D);
		ctx.font = font;
		ctx.fillStyle = this.getElementColor(styles.atoms_useJMOLColors, styles.atoms_usePYMOLColors, styles.atoms_color, 2);
		if (this.label === 'H' && styles.atoms_HBlack_2D) {
			ctx.fillStyle = 'black';
		}
		if (this.error) {
			ctx.fillStyle = styles.colorError;
		}
		let hAngle;
		let labelVisible = this.isLabelVisible(styles);
		if (this.isLone && !labelVisible || styles.atoms_circles_2D) {
			// always use carbon gray for lone carbon atom dots
			if (this.isLone) {
				ctx.fillStyle = '#909090';
			}
			ctx.beginPath();
			ctx.arc(this.x, this.y, styles.atoms_circleDiameter_2D / 2, 0, m.PI * 2, false);
			ctx.fill();
			if (styles.atoms_circleBorderWidth_2D > 0) {
				ctx.lineWidth = styles.atoms_circleBorderWidth_2D;
				ctx.strokeStyle = 'black';
				ctx.stroke();
			}
		} else if (labelVisible) {
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			// keep check to undefined here as dev may set altLabel to empty
			// string
			if (this.altLabel !== undefined) {
				// altLabel can be 0, so check if undefined
				ctx.fillText(this.altLabel, this.x, this.y);
				let symbolWidth = ctx.measureText(this.altLabel).width;
				this.textBounds.push({
					x: this.x - symbolWidth / 2,
					y: this.y - styles.atoms_font_size_2D / 2 + 1,
					w: symbolWidth,
					h: styles.atoms_font_size_2D - 2
				});
			} else if (!ELEMENT[this.label]) {
				if (structures.CondensedLabel) {
					if (this.label.match(whitespaceRegex)) {
						// if a space is included in the string, it is reasonable to expect this to be written text and not chemically interpretted
						ctx.textAlign = 'left';
						if (this.error) {
							ctx.fillStyle = styles.colorError;
						}
						ctx.fillText(this.label, this.x, this.y);
						let symbolWidth = ctx.measureText(this.label).width;
						this.textBounds.push({
							x: this.x + 1,
							y: this.y - styles.atoms_font_size_2D / 2 + 1,
							w: symbolWidth,
							h: styles.atoms_font_size_2D - 2
						});
					} else {
						// CondensedLabel is proprietary and not included in the GPL version
						if (!this.condensed || this.condensed.text !== this.label) {
							this.condensed = new structures.CondensedLabel(this, this.label);
						}
						this.condensed.draw(ctx, styles);
					}
				} else {
					ctx.fillText(this.label, this.x, this.y);
					let symbolWidth = ctx.measureText(this.label).width;
					this.textBounds.push({
						x: this.x - symbolWidth / 2,
						y: this.y - styles.atoms_font_size_2D / 2 + 1,
						w: symbolWidth,
						h: styles.atoms_font_size_2D - 2
					});
				}
			} else {
				ctx.fillText(this.label, this.x, this.y);
				let symbolWidth = ctx.measureText(this.label).width;
				this.textBounds.push({
					x: this.x - symbolWidth / 2,
					y: this.y - styles.atoms_font_size_2D / 2 + 1,
					w: symbolWidth,
					h: styles.atoms_font_size_2D - 2
				});
				// massmassWidth
				let massWidth = 0;
				if (this.mass !== -1) {
					let fontSave = ctx.font;
					ctx.font = extensions.getFontString(styles.atoms_font_size_2D * .7, styles.atoms_font_families_2D, styles.atoms_font_bold_2D, styles.atoms_font_italic_2D);
					massWidth = ctx.measureText(this.mass).width;
					ctx.textAlign = 'right';
					ctx.fillText(this.mass, this.x - symbolWidth / 2 - 1, this.y - styles.atoms_font_size_2D / 2 + 1);
					this.textBounds.push({
						x: this.x - symbolWidth / 2 - massWidth - .5,
						y: this.y - (styles.atoms_font_size_2D * 1.7) / 2 + 1,
						w: massWidth,
						h: styles.atoms_font_size_2D / 2 - 1
					});
					ctx.font = fontSave;
					ctx.textAlign = 'center';
				}
				// implicit hydrogens
				let chargeOffset = symbolWidth / 2;
				let numHs = this.getImplicitHydrogenCount();
				if (styles.atoms_implicitHydrogens_2D && numHs > 0) {
					hAngle = 0;
					let hWidth = ctx.measureText('H').width;
					let moveCharge = true;
					if (numHs > 1) {
						let xoffset = symbolWidth / 2 + hWidth / 2;
						let yoffset = 0;
						let subFont = extensions.getFontString(styles.atoms_font_size_2D * .8, styles.atoms_font_families_2D, styles.atoms_font_bold_2D, styles.atoms_font_italic_2D);
						ctx.font = subFont;
						let numWidth = ctx.measureText(numHs).width;
						if (this.bondNumber === 1) {
							if (this.angleOfLeastInterference > m.PI / 2 && this.angleOfLeastInterference < 3 * m.PI / 2) {
								xoffset = -symbolWidth / 2 - numWidth - hWidth / 2 - massWidth / 2;
								moveCharge = false;
								hAngle = m.PI;
							}
						} else {
							if (this.angleOfLeastInterference <= m.PI / 4) {
								// default
							} else if (this.angleOfLeastInterference < 3 * m.PI / 4) {
								xoffset = 0;
								yoffset = -styles.atoms_font_size_2D * .9;
								if (this.charge !== 0) {
									yoffset -= styles.atoms_font_size_2D * .3;
								}
								moveCharge = false;
								hAngle = m.PI / 2;
							} else if (this.angleOfLeastInterference <= 5 * m.PI / 4) {
								xoffset = -symbolWidth / 2 - numWidth - hWidth / 2 - massWidth / 2;
								moveCharge = false;
								hAngle = m.PI;
							} else if (this.angleOfLeastInterference < 7 * m.PI / 4) {
								xoffset = 0;
								yoffset = styles.atoms_font_size_2D * .9;
								moveCharge = false;
								hAngle = 3 * m.PI / 2;
							}
						}
						ctx.font = font;
						ctx.fillText('H', this.x + xoffset, this.y + yoffset);
						ctx.font = subFont;
						ctx.fillText(numHs, this.x + xoffset + hWidth / 2 + numWidth / 2, this.y + yoffset + styles.atoms_font_size_2D * .3);
						this.textBounds.push({
							x: this.x + xoffset - hWidth / 2,
							y: this.y + yoffset - styles.atoms_font_size_2D / 2 + 1,
							w: hWidth,
							h: styles.atoms_font_size_2D - 2
						});
						this.textBounds.push({
							x: this.x + xoffset + hWidth / 2,
							y: this.y + yoffset + styles.atoms_font_size_2D * .3 - styles.atoms_font_size_2D / 2 + 1,
							w: numWidth,
							h: styles.atoms_font_size_2D * .8 - 2
						});
					} else {
						let xoffset = symbolWidth / 2 + hWidth / 2;
						let yoffset = 0;
						if (this.bondNumber === 1) {
							if (this.angleOfLeastInterference > m.PI / 2 && this.angleOfLeastInterference < 3 * m.PI / 2) {
								xoffset = -symbolWidth / 2 - hWidth / 2 - massWidth / 2;
								moveCharge = false;
								hAngle = m.PI;
							}
						} else {
							if (this.angleOfLeastInterference <= m.PI / 4) {
								// default
							} else if (this.angleOfLeastInterference < 3 * m.PI / 4) {
								xoffset = 0;
								yoffset = -styles.atoms_font_size_2D * .9;
								moveCharge = false;
								hAngle = m.PI / 2;
							} else if (this.angleOfLeastInterference <= 5 * m.PI / 4) {
								xoffset = -symbolWidth / 2 - hWidth / 2 - massWidth / 2;
								moveCharge = false;
								hAngle = m.PI;
							} else if (this.angleOfLeastInterference < 7 * m.PI / 4) {
								xoffset = 0;
								yoffset = styles.atoms_font_size_2D * .9;
								moveCharge = false;
								hAngle = 3 * m.PI / 2;
							}
						}
						ctx.fillText('H', this.x + xoffset, this.y + yoffset);
						this.textBounds.push({
							x: this.x + xoffset - hWidth / 2,
							y: this.y + yoffset - styles.atoms_font_size_2D / 2 + 1,
							w: hWidth,
							h: styles.atoms_font_size_2D - 2
						});
					}
					if (moveCharge) {
						chargeOffset += hWidth;
					}
					// adjust the angles metadata to account for hydrogen
					// placement
					/*
					 * this.angles.push(hAngle); let angleData =
					 * math.angleBetweenLargest(this.angles);
					 * this.angleOfLeastInterference = angleData.angle % (m.PI *
					 * 2); this.largestAngle = angleData.largest;
					 */
				}
				// charge
				if (this.charge !== 0) {
					let s = this.charge.toFixed(0);
					if (s === '1') {
						s = '+';
					} else if (s === '-1') {
						s = '\u2013';
					} else if (s.startsWith('-')) {
						s = s.substring(1) + '\u2013';
					} else {
						s += '+';
					}
					let chargeWidth = ctx.measureText(s).width;
					chargeOffset += chargeWidth / 2;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.font = extensions.getFontString(m.floor(styles.atoms_font_size_2D * .8), styles.atoms_font_families_2D, styles.atoms_font_bold_2D, styles.atoms_font_italic_2D);
					ctx.fillText(s, this.x + chargeOffset - 1, this.y - styles.atoms_font_size_2D / 2 + 1);
					this.textBounds.push({
						x: this.x + chargeOffset - chargeWidth / 2 - 1,
						y: this.y - (styles.atoms_font_size_2D * 1.8) / 2 + 5,
						w: chargeWidth,
						h: styles.atoms_font_size_2D / 2 - 1
					});
				}
			}
		}
		let attributes = [];
		for (let i = 0; i < this.numLonePair; i++) {
			attributes.push({
				t: 2
			});
		}
		for (let i = 0; i < this.numRadical; i++) {
			attributes.push({
				t: 1
			});
		}
		if(this.enhancedStereo.type!==structures.Atom.ESTEREO_ABSOLUTE){
			attributes.push(this.enhancedStereo);
		}
		if (attributes.length>0) {
			ctx.fillStyle = 'black';
			ctx.font = extensions.getFontString(styles.atoms_font_size_2D * .8, styles.atoms_font_families_2D, styles.atoms_font_bold_2D, styles.atoms_font_italic_2D);
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			let as = this.angles.slice(0);
			let ali = this.angleOfLeastInterference;
			let la = this.largestAngle;
			if (hAngle !== undefined) {
				// have to check for undefined here as this number can be 0
				as.push(hAngle);
				as.sort(function (a, b) {
					return a - b;
				});
				let angleData = math.angleBetweenLargest(as);
				ali = angleData.angle % (m.PI * 2);
				la = angleData.largest;
			}
			if (hAngle === undefined && m.abs(la - 2 * m.PI / as.length) < m.PI / 60) {
				let mid = m.ceil(attributes.length / as.length);
				for (let i = 0, ii = attributes.length; i < ii; i += mid, ali += la) {
					this.drawAttribute(ctx, styles, attributes.slice(i, m.min(attributes.length, i + mid)), ali, la, hAngle, labelVisible);
				}
			} else {
				this.drawAttribute(ctx, styles, attributes, ali, la, hAngle, labelVisible);
			}
		}
		// for debugging atom label dimensions
		//ctx.strokeStyle = 'red'; for(let i = 0, ii = this.textBounds.length;i<ii; i++){ let r = this.textBounds[i];ctx.beginPath();ctx.rect(r.x, r.y, r.w, r.h); ctx.stroke(); }

	};
	_.drawAttribute = function (ctx, styles, attributes, angle, largest, hAngle, labelVisible) {
		let segment = largest / (attributes.length + (this.bonds.length === 0 && hAngle === undefined ? 0 : 1));
		let angleStart = angle - largest / 2 + segment;
		for (let i = 0; i < attributes.length; i++) {
			let t = attributes[i];
			let angle = angleStart + i * segment;
			let distance = styles.atoms_lonePairDistance_2D;
			if(labelVisible && t.type !== undefined){
				// give text a bit more room if a label is showing
				distance+=4;
			}
			let p1x = this.x + Math.cos(angle) * distance;
			let p1y = this.y - Math.sin(angle) * distance;
			if (t.type !== undefined) {
				// enhanced stereo
				let display = t.type+t.group;
				ctx.fillText(display, p1x, p1y);
			}else if (t.t === 2) {
				let perp = angle + Math.PI / 2;
				let difx = Math.cos(perp) * styles.atoms_lonePairSpread_2D / 2;
				let dify = -Math.sin(perp) * styles.atoms_lonePairSpread_2D / 2;
				ctx.beginPath();
				ctx.arc(p1x + difx, p1y + dify, styles.atoms_lonePairDiameter_2D, 0, m.PI * 2, false);
				ctx.fill();
				ctx.beginPath();
				ctx.arc(p1x - difx, p1y - dify, styles.atoms_lonePairDiameter_2D, 0, m.PI * 2, false);
				ctx.fill();
			} else if (t.t === 1) {
				ctx.beginPath();
				ctx.arc(p1x, p1y, styles.atoms_lonePairDiameter_2D, 0, m.PI * 2, false);
				ctx.fill();
			}
		}
	};
	_.drawDecorations = function (ctx, styles) {
		if (this.isHover || this.isSelected) {
			ctx.strokeStyle = this.isHover ? styles.colorHover : styles.colorSelect;
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			let radius = this.isHover ? 7 : 15;
			ctx.arc(this.x, this.y, radius, 0, m.PI * 2, false);
			ctx.stroke();
		}
		if (this.isOverlap) {
			ctx.strokeStyle = styles.colorError;
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.arc(this.x, this.y, 7, 0, m.PI * 2, false);
			ctx.stroke();
		}
	};
	_.render = function (gl, styles, noColor) {
		if (this.styles) {
			styles = this.styles;
		}
		let transform = m4.translate(m4.identity(), [this.x, this.y, this.z]);
		let radius = styles.atoms_useVDWDiameters_3D ? ELEMENT[this.label].vdWRadius * styles.atoms_vdwMultiplier_3D : styles.atoms_sphereDiameter_3D / 2;
		if (radius === 0) {
			radius = 1;
		}
		m4.scale(transform, [radius, radius, radius]);

		// colors
		if (!noColor) {
			let color = styles.atoms_color;
			if (styles.atoms_useJMOLColors) {
				color = ELEMENT[this.label].jmolColor;
			} else if (styles.atoms_usePYMOLColors) {
				color = ELEMENT[this.label].pymolColor;
			}
			gl.material.setDiffuseColor(gl, color);
		}

		// render
		gl.shader.setMatrixUniforms(gl, transform);
		let buffer = this.renderAsStar ? gl.starBuffer : gl.sphereBuffer;
		gl.drawElements(gl.TRIANGLES, buffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	};
	_.renderHighlight = function (gl, styles) {
		if (this.isSelected || this.isHover) {
			if (this.styles) {
				styles = this.styles;
			}
			let transform = m4.translate(m4.identity(), [this.x, this.y, this.z]);
			let radius = styles.atoms_useVDWDiameters_3D ? ELEMENT[this.label].vdWRadius * styles.atoms_vdwMultiplier_3D : styles.atoms_sphereDiameter_3D / 2;
			if (radius === 0) {
				radius = 1;
			}
			radius *= 1.3;
			m4.scale(transform, [radius, radius, radius]);

			gl.shader.setMatrixUniforms(gl, transform);
			gl.material.setDiffuseColor(gl, this.isHover ? styles.colorHover : styles.colorSelect);
			let buffer = this.renderAsStar ? gl.starBuffer : gl.sphereBuffer;
			gl.drawElements(gl.TRIANGLES, buffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	};
	_.isLabelVisible = function (styles) {
		if (styles.atoms_displayAllCarbonLabels_2D) {
			// show all carbons
			return true;
		}
		if (this.label !== 'C') {
			// not a carbon
			return true;
		}
		if (this.altLabel || !ELEMENT[this.label]) {
			// there is an alternative or condensed label
			return true;
		}
		if (this.mass !== -1 || this.implicitH !== -1 || this.charge !== 0) {
			// an isotope or charge or implicit hydrogen override designation, so label must be shown
			return true;
		}
		if (styles.atoms_showAttributedCarbons_2D && (this.numRadical !== 0 || this.numLonePair !== 0)) {
			// there are attributes and we want to show the associated label
			return true;
		}
		if (this.isHidden && styles.atoms_showHiddenCarbons_2D) {
			// if it is hidden and we want to show them
			return true;
		}
		if (styles.atoms_displayTerminalCarbonLabels_2D && this.bondNumber === 1) {
			// if it is terminal and we want to show them
			return true;
		}
		return false;
	};
	_.getImplicitHydrogenCount = function () {
		if (!ELEMENT[this.label]) {
			return 0;
		}
		if (this.implicitH !== -1) {
			return this.implicitH;
		}
		if (!ELEMENT[this.label].addH || this.label === 'H') {
			return 0;
		}
		let valence = ELEMENT[this.label].valency;
		let dif = valence - this.coordinationNumber;
		if (this.numRadical > 0) {
			dif = m.max(0, dif - this.numRadical);
		}
		if (this.charge > 0) {
			let vdif = 4 - valence;
			if (this.charge <= vdif) {
				dif += this.charge;
			} else {
				dif = 4 - this.coordinationNumber - this.charge + vdif;
			}
		} else {
			dif += this.charge;
		}
		return dif < 0 ? 0 : m.floor(dif);
	};
	_.getBounds = function () {
		let bounds = new math.Bounds();
		bounds.expand(this.x, this.y);
		if (this.textBounds) {
			for (let i = 0, ii = this.textBounds.length; i < ii; i++) {
				let tb = this.textBounds[i];
				bounds.expand(tb.x, tb.y, tb.x + tb.w, tb.y + tb.h);
			}
		}
		return bounds;
	};
	_.getBounds3D = function () {
		let bounds = new math.Bounds();
		bounds.expand3D(this.x, this.y, this.z);
		return bounds;
	};
	/**
	 * Get Color by atom element.
	 * 
	 * @param {boolean}
	 *            useJMOLColors
	 * @param {boolean}
	 *            usePYMOLColors
	 * @param {string}
	 *            color The default color
	 * @param {number}
	 *            dim The render dimension
	 * @return {string} The atom element color
	 */
	_.getElementColor = function (useJMOLColors, usePYMOLColors, color) {
		if (!ELEMENT[this.label]) {
			return '#000';
		}
		if (useJMOLColors) {
			color = ELEMENT[this.label].jmolColor;
		} else if (usePYMOLColors) {
			color = ELEMENT[this.label].pymolColor;
		}
		return color;
	};

})(ChemDoodle.ELEMENT, ChemDoodle.extensions, ChemDoodle.math, ChemDoodle.structures, Math, ChemDoodle.lib.mat4);

(function(ELEMENT, extensions, structures, math, m, m4, v3, undefined) {
	'use strict';

	// this code is a workaround for a stroke caching bug in Safari	
	/*if(navigator.userAgent.indexOf("Safari") > -1 && navigator.userAgent.indexOf("Chrome") === -1){
		CanvasRenderingContext2D.prototype.oldStroke = CanvasRenderingContext2D.prototype.stroke;
		CanvasRenderingContext2D.prototype.stroke = function(){
			this.lineWidth+=m.random()*.01;
			this.oldStroke();
		}
	}*/
	
	structures.Bond = function(a1, a2, bondOrder) {
		this.a1 = a1;
		this.a2 = a2;
		// bondOrder can be 0, so need to check against undefined
		this.bondOrder = bondOrder !== undefined ? bondOrder : 1;
		this.pid = structures.PID++;
	};
	structures.Bond.STEREO_NONE = 'none';
	structures.Bond.STEREO_PROTRUDING = 'protruding';
	structures.Bond.STEREO_RECESSED = 'recessed';
	structures.Bond.STEREO_AMBIGUOUS = 'ambiguous';
	let _ = structures.Bond.prototype;
	_.stereo = structures.Bond.STEREO_NONE;
	_.isHover = false;
	_.ring = undefined;
	_.getCenter = function() {
		return new structures.Point((this.a1.x + this.a2.x) / 2, (this.a1.y + this.a2.y) / 2);
	};
	_.getLength = function() {
		return this.a1.distance(this.a2);
	};
	_.getLength3D = function() {
		return this.a1.distance3D(this.a2);
	};
	_.contains = function(a) {
		return a === this.a1 || a === this.a2;
	};
	_.getNeighbor = function(a) {
		if (a === this.a1) {
			return this.a2;
		} else if (a === this.a2) {
			return this.a1;
		}
		return undefined;
	};
	_.draw = function(ctx, styles) {
		if (this.a1.x === this.a2.x && this.a1.y === this.a2.y) {
			// return, as there is nothing to render, will only cause fill
			// overflows
			return;
		}
		if (this.styles) {
			styles = this.styles;
		}
		let x1 = this.a1.x;
		let x2 = this.a2.x;
		let y1 = this.a1.y;
		let y2 = this.a2.y;
		let dist = this.a1.distance(this.a2);
		let difX = x2 - x1;
		let difY = y2 - y1;
		if (this.a1.isLassoed && this.a2.isLassoed) {
			let grd = ctx.createLinearGradient(x1, y1, x2, y2);
			grd.addColorStop(0, 'rgba(212, 99, 0, 0)');
			grd.addColorStop(0.5, 'rgba(212, 99, 0, 0.8)');
			grd.addColorStop(1, 'rgba(212, 99, 0, 0)');
			let useDist = 2.5;
			let perpendicular = this.a1.angle(this.a2) + m.PI / 2;
			let mcosp = m.cos(perpendicular);
			let msinp = m.sin(perpendicular);
			let cx1 = x1 - mcosp * useDist;
			let cy1 = y1 + msinp * useDist;
			let cx2 = x1 + mcosp * useDist;
			let cy2 = y1 - msinp * useDist;
			let cx3 = x2 + mcosp * useDist;
			let cy3 = y2 - msinp * useDist;
			let cx4 = x2 - mcosp * useDist;
			let cy4 = y2 + msinp * useDist;
			ctx.fillStyle = grd;
			ctx.beginPath();
			ctx.moveTo(cx1, cy1);
			ctx.lineTo(cx2, cy2);
			ctx.lineTo(cx3, cy3);
			ctx.lineTo(cx4, cy4);
			ctx.closePath();
			ctx.fill();
		}
		if (styles.atoms_display && !styles.atoms_circles_2D && this.a1.isLabelVisible(styles) && this.a1.textBounds) {
			let distShrink = 0;
			for ( let i = 0, ii = this.a1.textBounds.length; i < ii; i++) {
				distShrink = Math.max(distShrink, math.calculateDistanceInterior(this.a1, this.a2, this.a1.textBounds[i]));
			}
			distShrink += styles.bonds_atomLabelBuffer_2D;
			let perc = distShrink / dist;
			x1 += difX * perc;
			y1 += difY * perc;
		}
		if (styles.atoms_display && !styles.atoms_circles_2D && this.a2.isLabelVisible(styles) && this.a2.textBounds) {
			let distShrink = 0;
			for ( let i = 0, ii = this.a2.textBounds.length; i < ii; i++) {
				distShrink = Math.max(distShrink, math.calculateDistanceInterior(this.a2, this.a1, this.a2.textBounds[i]));
			}
			distShrink += styles.bonds_atomLabelBuffer_2D;
			let perc = distShrink / dist;
			x2 -= difX * perc;
			y2 -= difY * perc;
		}
		if (styles.bonds_clearOverlaps_2D) {
			let xs = x1 + difX * .15;
			let ys = y1 + difY * .15;
			let xf = x2 - difX * .15;
			let yf = y2 - difY * .15;
			ctx.strokeStyle = styles.backgroundColor;
			ctx.lineWidth = styles.bonds_width_2D + styles.bonds_overlapClearWidth_2D * 2;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(xs, ys);
			ctx.lineTo(xf, yf);
			ctx.stroke();
		}
		ctx.strokeStyle = this.error?styles.colorError:styles.bonds_color;
		ctx.fillStyle = this.error?styles.colorError:styles.bonds_color;
		ctx.lineWidth = styles.bonds_width_2D;
		ctx.lineCap = styles.bonds_ends_2D;
		if (styles.bonds_splitColor) {
			let linearGradient = ctx.createLinearGradient(x1, y1, x2, y2);
			let styles1 = this.a1.styles?this.a1.styles:styles;
			let styles2 = this.a2.styles?this.a2.styles:styles;
			let color1 = this.a1.getElementColor(styles1.atoms_useJMOLColors, styles1.atoms_usePYMOLColors, styles1.atoms_color, 2);
			let color2 = this.a2.getElementColor(styles2.atoms_useJMOLColors, styles2.atoms_usePYMOLColors, styles2.atoms_color, 2);
			linearGradient.addColorStop(0, color1);
			if (!styles.bonds_colorGradient) {
				linearGradient.addColorStop(0.5, color1);
				linearGradient.addColorStop(0.51, color2);
			}
			linearGradient.addColorStop(1, color2);
			ctx.strokeStyle = linearGradient;
			ctx.fillStyle = linearGradient;
		}
		if (styles.bonds_lewisStyle_2D && this.bondOrder % 1 === 0) {
			this.drawLewisStyle(ctx, styles, x1, y1, x2, y2);
		} else {
			switch (this.query?1:this.bondOrder) {
			case 0:{
					if (this.stereo === structures.Bond.STEREO_PROTRUDING) {
						// arrowhead
						let thinSpread = styles.bonds_width_2D / 2;
						let useDist = styles.bonds_wedgeThickness_2D/2;
						let angle = this.a1.angle(this.a2);
						let perpendicular = angle + m.PI / 2;
						let retract = styles.shapes_arrowLength_2D * 2 / m.sqrt(3);
						let mcosa = m.cos(angle);
						let msina = m.sin(angle);
						let mcosp = m.cos(perpendicular);
						let msinp = m.sin(perpendicular);
						let rx = x2 - mcosa * retract * 0.8;
						let ry = y2 + msina * retract * 0.8;
						let cx3 = rx + mcosp * useDist;
						let cy3 = ry - msinp * useDist;
						let cx4 = rx - mcosp * useDist;
						let cy4 = ry + msinp * useDist;
						ctx.beginPath();
						ctx.moveTo(x2, y2);
						ctx.lineTo(cx3, cy3);
						ctx.lineTo(cx4, cy4);
						ctx.closePath();
						ctx.fill();
						ctx.stroke();
						// line
						ctx.beginPath();
						ctx.moveTo(x1, y1);
						ctx.lineTo(rx, ry);
						ctx.stroke();
					} else {
						let dx = x2 - x1;
						let dy = y2 - y1;
						let innerDist = m.sqrt(dx * dx + dy * dy);
						let num = m.floor(innerDist / styles.bonds_dotSize_2D);
						let remainder = (innerDist - (num - 1) * styles.bonds_dotSize_2D) / 2;
						if (num % 2 === 1) {
							remainder += styles.bonds_dotSize_2D / 4;
						} else {
							remainder -= styles.bonds_dotSize_2D / 4;
							num += 2;
						}
						num /= 2;
						let angle = this.a1.angle(this.a2);
						let xs = x1 + remainder * Math.cos(angle);
						let ys = y1 - remainder * Math.sin(angle);
						ctx.beginPath();
						for ( let i = 0; i < num; i++) {
							ctx.arc(xs, ys, styles.bonds_dotSize_2D / 2, 0, m.PI * 2, false);
							xs += 2 * styles.bonds_dotSize_2D * Math.cos(angle);
							ys -= 2 * styles.bonds_dotSize_2D * Math.sin(angle);
						}
						ctx.fill();
						break;
					}
				}
			case 0.5:{
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.setLineDash([styles.bonds_hashSpacing_2D, styles.bonds_hashSpacing_2D]);
					ctx.stroke();
					ctx.setLineDash([]);
					break;
				}
			case 1:{
					if (!this.query && (this.stereo === structures.Bond.STEREO_PROTRUDING || this.stereo === structures.Bond.STEREO_RECESSED)) {
						let thinSpread = styles.bonds_width_2D / 2;
						let useDist = styles.bonds_wedgeThickness_2D/2;
						let perpendicular = this.a1.angle(this.a2) + m.PI / 2;
						let mcosp = m.cos(perpendicular);
						let msinp = m.sin(perpendicular);
						let cx1 = x1 - mcosp * thinSpread;
						let cy1 = y1 + msinp * thinSpread;
						let cx2 = x1 + mcosp * thinSpread;
						let cy2 = y1 - msinp * thinSpread;
						let cx3 = x2 + mcosp * useDist;
						let cy3 = y2 - msinp * useDist;
						let cx4 = x2 - mcosp * useDist;
						let cy4 = y2 + msinp * useDist;
						ctx.save();
						ctx.beginPath();
						ctx.moveTo(cx1, cy1);
						ctx.lineTo(cx2, cy2);
						ctx.lineTo(cx3, cy3);
						ctx.lineTo(cx4, cy4);
						ctx.closePath();
						if (this.stereo === structures.Bond.STEREO_PROTRUDING) {
							ctx.fill();
						} else {
							ctx.clip();
							ctx.lineWidth = useDist * 2;
							ctx.lineCap = 'butt';
							ctx.beginPath();
							ctx.moveTo(x1, y1);
							// workaround to lengthen distance for Firefox as there is a bug, shouldn't affect rendering or performance
							let dx = x2 - x1;
							let dy = y2 - y1;
							ctx.lineTo(x2+5*dx, y2+5*dy);
							ctx.setLineDash([styles.bonds_hashWidth_2D, styles.bonds_hashSpacing_2D]);
							ctx.stroke();
						}
              			ctx.restore();
					} else if (!this.query && this.stereo === structures.Bond.STEREO_AMBIGUOUS) {
						// these coordinates are modified to space away from labels AFTER the original difX and difY variables are calculated
						let innerDifX = x2 - x1;
						let innerDifY = y2 - y1;
						ctx.beginPath();
						ctx.moveTo(x1, y1);
						let curves = m.floor(m.sqrt(innerDifX * innerDifX + innerDifY * innerDifY) / styles.bonds_wavyLength_2D);
						let x = x1;
						let y = y1;
						let perpendicular = this.a1.angle(this.a2) + m.PI / 2;
						let mcosp = m.cos(perpendicular);
						let msinp = m.sin(perpendicular);
	
						let curveX = innerDifX / curves;
						let curveY = innerDifY / curves;
						let cpx, cpy;
						for ( let i = 0; i < curves; i++) {
							x += curveX;
							y += curveY;
							let mult = i % 2 === 0?1:-1;
							cpx = styles.bonds_wavyLength_2D * mcosp * mult + x - curveX * 0.5;
							cpy = styles.bonds_wavyLength_2D * -msinp * mult + y - curveY * 0.5;
							ctx.quadraticCurveTo(cpx, cpy, x, y);
						}
						ctx.stroke();
						break;
					} else {
						ctx.beginPath();
						ctx.moveTo(x1, y1);
						ctx.lineTo(x2, y2);
						ctx.stroke();
						if(this.query){
							this.query.draw(ctx, styles, this.getCenter());
						}
					}
					break;
				}
			case 1.5:
			case 2:{
					let angle = this.a1.angle(this.a2);
					let perpendicular = angle + m.PI / 2;
					let mcosp = m.cos(perpendicular);
					let msinp = m.sin(perpendicular);
					let dist = this.a1.distance(this.a2);
					let useDist = styles.bonds_useAbsoluteSaturationWidths_2D?styles.bonds_saturationWidthAbs_2D/2:dist * styles.bonds_saturationWidth_2D / 2;
					if (this.stereo === structures.Bond.STEREO_AMBIGUOUS) {
						let cx1 = x1 - mcosp * useDist;
						let cy1 = y1 + msinp * useDist;
						let cx2 = x1 + mcosp * useDist;
						let cy2 = y1 - msinp * useDist;
						let cx3 = x2 + mcosp * useDist;
						let cy3 = y2 - msinp * useDist;
						let cx4 = x2 - mcosp * useDist;
						let cy4 = y2 + msinp * useDist;
						ctx.beginPath();
						ctx.moveTo(cx1, cy1);
						ctx.lineTo(cx3, cy3);
						ctx.moveTo(cx2, cy2);
						ctx.lineTo(cx4, cy4);
						ctx.stroke();
					} else if (!styles.bonds_symmetrical_2D && (this.ring || this.a1.label === 'C' && this.a2.label === 'C')) {
						ctx.beginPath();
						ctx.moveTo(x1, y1);
						ctx.lineTo(x2, y2);
						ctx.stroke();
						let clip = 0;
						useDist*=2;
						let clipAngle = styles.bonds_saturationAngle_2D;
						if (clipAngle < m.PI / 2) {
							clip = -(useDist / m.tan(clipAngle));
						}
						if (m.abs(clip) < dist / 2) {
							let xuse1 = x1 - m.cos(angle) * clip;
							let xuse2 = x2 + m.cos(angle) * clip;
							let yuse1 = y1 + m.sin(angle) * clip;
							let yuse2 = y2 - m.sin(angle) * clip;
							let cx1 = xuse1 - mcosp * useDist;
							let cy1 = yuse1 + msinp * useDist;
							let cx2 = xuse1 + mcosp * useDist;
							let cy2 = yuse1 - msinp * useDist;
							let cx3 = xuse2 - mcosp * useDist;
							let cy3 = yuse2 + msinp * useDist;
							let cx4 = xuse2 + mcosp * useDist;
							let cy4 = yuse2 - msinp * useDist;
							let flip = !this.ring || (this.ring.center.angle(this.a1) > this.ring.center.angle(this.a2) && !(this.ring.center.angle(this.a1) - this.ring.center.angle(this.a2) > m.PI) || (this.ring.center.angle(this.a1) - this.ring.center.angle(this.a2) < -m.PI));
							ctx.beginPath();
							if (flip) {
								ctx.moveTo(cx1, cy1);
								ctx.lineTo(cx3, cy3);
							} else {
								ctx.moveTo(cx2, cy2);
								ctx.lineTo(cx4, cy4);
							}
							if (this.bondOrder !== 2) {
								ctx.setLineDash([styles.bonds_hashSpacing_2D, styles.bonds_hashSpacing_2D]);
							}
							ctx.stroke();
							ctx.setLineDash([]);
						}
					} else {
						let cx1 = x1 - mcosp * useDist;
						let cy1 = y1 + msinp * useDist;
						let cx2 = x1 + mcosp * useDist;
						let cy2 = y1 - msinp * useDist;
						let cx3 = x2 + mcosp * useDist;
						let cy3 = y2 - msinp * useDist;
						let cx4 = x2 - mcosp * useDist;
						let cy4 = y2 + msinp * useDist;
						ctx.beginPath();
						ctx.moveTo(cx1, cy1);
						ctx.lineTo(cx4, cy4);
						ctx.stroke();
						ctx.beginPath();
						ctx.moveTo(cx2, cy2);
						ctx.lineTo(cx3, cy3);
						if (this.bondOrder !== 2) {
							ctx.setLineDash([styles.bonds_hashWidth_2D, styles.bonds_hashSpacing_2D]);
						}
						ctx.stroke();
						ctx.setLineDash([]);
					}
					break;
				}
			case 3:{
					let useDist = styles.bonds_useAbsoluteSaturationWidths_2D?styles.bonds_saturationWidthAbs_2D:this.a1.distance(this.a2) * styles.bonds_saturationWidth_2D;
					let perpendicular = this.a1.angle(this.a2) + m.PI / 2;
					let mcosp = m.cos(perpendicular);
					let msinp = m.sin(perpendicular);
					let cx1 = x1 - mcosp * useDist;
					let cy1 = y1 + msinp * useDist;
					let cx2 = x1 + mcosp * useDist;
					let cy2 = y1 - msinp * useDist;
					let cx3 = x2 + mcosp * useDist;
					let cy3 = y2 - msinp * useDist;
					let cx4 = x2 - mcosp * useDist;
					let cy4 = y2 + msinp * useDist;
					ctx.beginPath();
					ctx.moveTo(cx1, cy1);
					ctx.lineTo(cx4, cy4);
					ctx.moveTo(cx2, cy2);
					ctx.lineTo(cx3, cy3);
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
					break;
				}
			}
		}
	};
	_.drawDecorations = function(ctx, styles) {
		if (this.isHover || this.isSelected) {
			let pi2 = 2 * m.PI;
			let angle = (this.a1.angleForStupidCanvasArcs(this.a2) + m.PI / 2) % pi2;
			ctx.strokeStyle = this.isHover ? styles.colorHover : styles.colorSelect;
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			let angleTo = (angle + m.PI) % pi2;
			angleTo = angleTo % (m.PI * 2);
			ctx.arc(this.a1.x, this.a1.y, 7, angle, angleTo, false);
			ctx.stroke();
			ctx.beginPath();
			angle += m.PI;
			angleTo = (angle + m.PI) % pi2;
			ctx.arc(this.a2.x, this.a2.y, 7, angle, angleTo, false);
			ctx.stroke();
		}
	};
	_.drawLewisStyle = function(ctx, styles, x1, y1, x2, y2) {
		let angle = this.a1.angle(this.a2);
		let perp = angle + m.PI/2;
		let difx = x2 - x1;
		let dify = y2 - y1;
		let increment = m.sqrt(difx * difx + dify * dify) / (this.bondOrder + 1);
		let xi = increment * m.cos(angle);
		let yi = -increment * m.sin(angle);
		let x = x1 + xi;
		let y = y1 + yi;
		for ( let i = 0; i < this.bondOrder; i++) {
			let sep = styles.atoms_lonePairSpread_2D / 2;
			let cx1 = x - m.cos(perp) * sep;
			let cy1 = y + m.sin(perp) * sep;
			let cx2 = x + m.cos(perp) * sep;
			let cy2 = y - m.sin(perp) * sep;
			ctx.beginPath();
			ctx.arc(cx1 - styles.atoms_lonePairDiameter_2D / 2, cy1 - styles.atoms_lonePairDiameter_2D / 2, styles.atoms_lonePairDiameter_2D, 0, m.PI * 2, false);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(cx2 - styles.atoms_lonePairDiameter_2D / 2, cy2 - styles.atoms_lonePairDiameter_2D / 2, styles.atoms_lonePairDiameter_2D, 0, m.PI * 2, false);
			ctx.fill();
			x += xi;
			y += yi;
		}
	};
	/**
	 * 
	 * @param {WegGLRenderingContext}
	 *            gl
	 * @param {structures.Styles}
	 *            styles
	 * @param {boolean}
	 *            asSegments Using cylinder/solid line or segmented pills/dashed
	 *            line
	 * @return {void}
	 */
	_.render = function(gl, styles, asSegments) {
		if (this.styles) {
			styles = this.styles;
		}
		// this is the elongation vector for the cylinder
		let height = this.a1.distance3D(this.a2);
		if (height === 0) {
			// if there is no height, then no point in rendering this bond,
			// just return
			return;
		}

		// scale factor for cylinder/pill radius.
		// when scale pill, the cap will affected too.
		let radiusScale = styles.bonds_cylinderDiameter_3D / 2;

		// atom1 color and atom2 color
		let a1Color = styles.bonds_color;
		let a2Color;

		// transform to the atom as well as the opposite atom (for Jmol and
		// PyMOL
		// color splits)
		let transform = m4.translate(m4.identity(), [ this.a1.x, this.a1.y, this.a1.z ]);
		let transformOpposite;

		// vector from atom1 to atom2
		let a2b = [ this.a2.x - this.a1.x, this.a2.y - this.a1.y, this.a2.z - this.a1.z ];

		// calculate the rotation
		let y = [ 0, 1, 0 ];
		let ang = 0;
		let axis;
		if (this.a1.x === this.a2.x && this.a1.z === this.a2.z) {
			axis = [ 0, 0, 1 ];
			if (this.a2.y < this.a1.y) {
				ang = m.PI;
			}
		} else {
			ang = extensions.vec3AngleFrom(y, a2b);
			axis = v3.cross(y, a2b, []);
		}

		// the styles will split color are
		// - Line
		// - Stick
		// - Wireframe
		if (styles.bonds_splitColor) {
			let styles1 = this.a1.styles?this.a1.styles:styles;
			let styles2 = this.a2.styles?this.a2.styles:styles;
			a1Color = this.a1.getElementColor(styles1.atoms_useJMOLColors, styles1.atoms_usePYMOLColors, styles1.atoms_color);
			a2Color = this.a2.getElementColor(styles2.atoms_useJMOLColors, styles2.atoms_usePYMOLColors, styles2.atoms_color);

			// the transformOpposite will use for split color.
			// just make it splited if the color different.
			if (a1Color != a2Color) {
				transformOpposite = m4.translate(m4.identity(), [ this.a2.x, this.a2.y, this.a2.z ]);
			}
		}

		// calculate the translations for unsaturated bonds.
		// represenattio use saturatedCross are
		// - Line
		// - Wireframe
		// - Ball and Stick
		// just Stick will set bonds_showBondOrders_3D to false
		let others = [ 0 ];
		let saturatedCross;

		if (asSegments) { // block for draw bond as segmented line/pill

			if (styles.bonds_showBondOrders_3D && this.bondOrder > 1) {

				// The "0.5" part set here,
				// the other part (1) will render as cylinder
				others = [/*-styles.bonds_cylinderDiameter_3D, */styles.bonds_cylinderDiameter_3D ];

				let z = [ 0, 0, 1 ];
				let inverse = m4.inverse(gl.rotationMatrix, []);
				m4.multiplyVec3(inverse, z);
				saturatedCross = v3.cross(a2b, z, []);
				v3.normalize(saturatedCross);
			}

			let segmentScale = 1;

			let spaceBetweenPill = styles.bonds_pillSpacing_3D;

			let pillHeight = styles.bonds_pillHeight_3D;

			if (this.bondOrder == 0) {

				if (styles.bonds_renderAsLines_3D) {
					pillHeight = spaceBetweenPill;
				} else {
					pillHeight = styles.bonds_pillDiameter_3D;

					// Detect Ball and Stick representation
					if (pillHeight < styles.bonds_cylinderDiameter_3D) {
						pillHeight /= 2;
					}

					segmentScale = pillHeight / 2;
					height /= segmentScale;
					spaceBetweenPill /= segmentScale / 2;
				}

			}

			// total space need for one pill, iclude the space.
			let totalSpaceForPill = pillHeight + spaceBetweenPill;

			// segmented pills for one bond.
			let totalPillsPerBond = height / totalSpaceForPill;

			// segmented one unit pill for one bond
			let pillsPerBond = m.floor(totalPillsPerBond);

			let extraSegmentedSpace = height - totalSpaceForPill * pillsPerBond;

			let paddingSpace = (spaceBetweenPill + styles.bonds_pillDiameter_3D + extraSegmentedSpace) / 2;

			// pillSegmentsLength will change if both atom1 and atom2 color used
			// for rendering
			let pillSegmentsLength = pillsPerBond;

			if (transformOpposite) {
				// floor will effected for odd pills, because one pill at the
				// center
				// will replace with splited pills
				pillSegmentsLength = m.floor(pillsPerBond / 2);
			}

			// render bonds
			for ( let i = 0, ii = others.length; i < ii; i++) {
				let transformUse = m4.set(transform, []);

				if (others[i] !== 0) {
					m4.translate(transformUse, v3.scale(saturatedCross, others[i], []));
				}
				if (ang !== 0) {
					m4.rotate(transformUse, ang, axis);
				}

				if (segmentScale != 1) {
					m4.scale(transformUse, [ segmentScale, segmentScale, segmentScale ]);
				}

				// colors
				if (a1Color)
					gl.material.setDiffuseColor(gl, a1Color);

				m4.translate(transformUse, [ 0, paddingSpace, 0 ]);

				for ( let j = 0; j < pillSegmentsLength; j++) {

					if (styles.bonds_renderAsLines_3D) {
						if (this.bondOrder == 0) {
							gl.shader.setMatrixUniforms(gl, transformUse);
							gl.drawArrays(gl.POINTS, 0, 1);
						} else {
							m4.scale(transformUse, [ 1, pillHeight, 1 ]);

							gl.shader.setMatrixUniforms(gl, transformUse);
							gl.drawArrays(gl.LINES, 0, gl.lineBuffer.vertexPositionBuffer.numItems);

							m4.scale(transformUse, [ 1, 1 / pillHeight, 1 ]);
						}
					} else {
						gl.shader.setMatrixUniforms(gl, transformUse);
						if (this.bondOrder == 0) {
							gl.drawElements(gl.TRIANGLES, gl.sphereBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
						} else {
							gl.drawElements(gl.TRIANGLES, gl.pillBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
						}
					}

					m4.translate(transformUse, [ 0, totalSpaceForPill, 0 ]);
				}

				// if rendering segmented pill use atom1 and atom2 color
				if (transformOpposite) {
					// parameter for calculate splited pills
					let scaleY, halfOneMinScaleY;

					if (styles.bonds_renderAsLines_3D) {
						scaleY = pillHeight;
						// if(this.bondOrder != 0) {
						// scaleY -= spaceBetweenPill;
						// }
						scaleY /= 2;
						halfOneMinScaleY = 0;
					} else {
						scaleY = 2 / 3;
						halfOneMinScaleY = (1 - scaleY) / 2;
					}

					// if count of pills per bound is odd,
					// then draw the splited pills of atom1
					if (pillsPerBond % 2 != 0) {

						m4.scale(transformUse, [ 1, scaleY, 1 ]);

						gl.shader.setMatrixUniforms(gl, transformUse);

						if (styles.bonds_renderAsLines_3D) {

							if (this.bondOrder == 0) {
								gl.drawArrays(gl.POINTS, 0, 1);
							} else {
								gl.drawArrays(gl.LINES, 0, gl.lineBuffer.vertexPositionBuffer.numItems);
							}

						} else {

							if (this.bondOrder == 0) {
								gl.drawElements(gl.TRIANGLES, gl.sphereBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
							} else {
								gl.drawElements(gl.TRIANGLES, gl.pillBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
							}

						}

						m4.translate(transformUse, [ 0, totalSpaceForPill * (1 + halfOneMinScaleY), 0 ]);

						m4.scale(transformUse, [ 1, 1 / scaleY, 1 ]);
					}

					// prepare to render the atom2

					m4.set(transformOpposite, transformUse);
					if (others[i] !== 0) {
						m4.translate(transformUse, v3.scale(saturatedCross, others[i], []));
					}
					// don't check for 0 here as that means it should be rotated
					// by PI, but PI will be negated
					m4.rotate(transformUse, ang + m.PI, axis);

					if (segmentScale != 1) {
						m4.scale(transformUse, [ segmentScale, segmentScale, segmentScale ]);
					}

					// colors
					if (a2Color){
						gl.material.setDiffuseColor(gl, a2Color);
					}

					m4.translate(transformUse, [ 0, paddingSpace, 0 ]);

					// draw the remain pills which use the atom2 color
					for ( let j = 0; j < pillSegmentsLength; j++) {

						if (styles.bonds_renderAsLines_3D) {
							if (this.bondOrder == 0) {
								gl.shader.setMatrixUniforms(gl, transformUse);
								gl.drawArrays(gl.POINTS, 0, 1);
							} else {
								m4.scale(transformUse, [ 1, pillHeight, 1 ]);

								gl.shader.setMatrixUniforms(gl, transformUse);
								gl.drawArrays(gl.LINES, 0, gl.lineBuffer.vertexPositionBuffer.numItems);

								m4.scale(transformUse, [ 1, 1 / pillHeight, 1 ]);
							}
						} else {
							gl.shader.setMatrixUniforms(gl, transformUse);
							if (this.bondOrder == 0) {
								gl.drawElements(gl.TRIANGLES, gl.sphereBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
							} else {
								gl.drawElements(gl.TRIANGLES, gl.pillBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
							}
						}

						m4.translate(transformUse, [ 0, totalSpaceForPill, 0 ]);
					}

					// draw the splited center pills of atom2
					if (pillsPerBond % 2 != 0) {

						m4.scale(transformUse, [ 1, scaleY, 1 ]);

						gl.shader.setMatrixUniforms(gl, transformUse);

						if (styles.bonds_renderAsLines_3D) {

							if (this.bondOrder == 0) {
								gl.drawArrays(gl.POINTS, 0, 1);
							} else {
								gl.drawArrays(gl.LINES, 0, gl.lineBuffer.vertexPositionBuffer.numItems);
							}

						} else {

							if (this.bondOrder == 0) {
								gl.drawElements(gl.TRIANGLES, gl.sphereBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
							} else {
								gl.drawElements(gl.TRIANGLES, gl.pillBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
							}

						}

						m4.translate(transformUse, [ 0, totalSpaceForPill * (1 + halfOneMinScaleY), 0 ]);

						m4.scale(transformUse, [ 1, 1 / scaleY, 1 ]);
					}
				}
			}
		} else {
			// calculate the translations for unsaturated bonds.
			// represenation that use saturatedCross are
			// - Line
			// - Wireframe
			// - Ball and Stick
			// just Stick will set bonds_showBondOrders_3D to false
			if (styles.bonds_showBondOrders_3D) {

				switch (this.bondOrder) {
				// the 0 and 0.5 bond order will draw as segmented pill.
				// so we not set that here.
				// case 0:
				// case 0.5: break;

				case 1.5:
					// The "1" part set here,
					// the other part (0.5) will render as segmented pill
					others = [ -styles.bonds_cylinderDiameter_3D /*
																 * ,
																 * styles.bonds_cylinderDiameter_3D
																 */];
					break;
				case 2:
					others = [ -styles.bonds_cylinderDiameter_3D, styles.bonds_cylinderDiameter_3D ];
					break;
				case 3:
					others = [ -1.2 * styles.bonds_cylinderDiameter_3D, 0, 1.2 * styles.bonds_cylinderDiameter_3D ];
					break;
				}

				// saturatedCross just need for need for bondorder greather than
				// 1
				if (this.bondOrder > 1) {
					let z = [ 0, 0, 1 ];
					let inverse = m4.inverse(gl.rotationMatrix, []);
					m4.multiplyVec3(inverse, z);
					saturatedCross = v3.cross(a2b, z, []);
					v3.normalize(saturatedCross);
				}
			}
			// for Stick representation, we just change the cylinder radius
			else {

				switch (this.bondOrder) {
				case 0:
					radiusScale *= 0.25;
					break;
				case 0.5:
				case 1.5:
					radiusScale *= 0.5;
					break;
				}
			}

			// if transformOpposite is set, the it mean the color must be
			// splited.
			// so the heigh of cylinder will be half.
			// one half for atom1 color the other for atom2 color
			if (transformOpposite) {
				height /= 2;
			}

			// Radius of cylinder already defined when initialize cylinder mesh,
			// so at this rate, the scale just needed for Y to strech
			// cylinder to bond length (height) and X and Z for radius.
			let scaleVector = [ radiusScale, height, radiusScale ];

			// render bonds
			for ( let i = 0, ii = others.length; i < ii; i++) {
				let transformUse = m4.set(transform, []);
				if (others[i] !== 0) {
					m4.translate(transformUse, v3.scale(saturatedCross, others[i], []));
				}
				if (ang !== 0) {
					m4.rotate(transformUse, ang, axis);
				}
				m4.scale(transformUse, scaleVector);

				// colors
				if (a1Color)
					gl.material.setDiffuseColor(gl, a1Color);

				// render
				gl.shader.setMatrixUniforms(gl, transformUse);
				if (styles.bonds_renderAsLines_3D) {
					gl.drawArrays(gl.LINES, 0, gl.lineBuffer.vertexPositionBuffer.numItems);
				} else {
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinderBuffer.vertexPositionBuffer.numItems);
				}

				// if transformOpposite is set, then a2Color also shoudl be
				// seted as well.
				if (transformOpposite) {
					m4.set(transformOpposite, transformUse);
					if (others[i] !== 0) {
						m4.translate(transformUse, v3.scale(saturatedCross, others[i], []));
					}
					// don't check for 0 here as that means it should be rotated
					// by PI, but PI will be negated
					m4.rotate(transformUse, ang + m.PI, axis);
					m4.scale(transformUse, scaleVector);

					// colors
					if (a2Color)
						gl.material.setDiffuseColor(gl, a2Color);

					// render
					gl.shader.setMatrixUniforms(gl, transformUse);
					if (styles.bonds_renderAsLines_3D) {
						gl.drawArrays(gl.LINES, 0, gl.lineBuffer.vertexPositionBuffer.numItems);
					} else {
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinderBuffer.vertexPositionBuffer.numItems);
					}
				}
			}
		}
	};
	_.renderHighlight = function(gl, styles) {
		if (this.isSelected || this.isHover) {
			if (this.styles) {
				styles = this.styles;
			}
			if (this.styles) {
				styles = this.styles;
			}
			// this is the elongation vector for the cylinder
			let height = this.a1.distance3D(this.a2);
			if (height === 0) {
				// if there is no height, then no point in rendering this bond,
				// just return
				return;
			}

			// scale factor for cylinder/pill radius.
			// when scale pill, the cap will affected too.
			let radiusScale = styles.bonds_cylinderDiameter_3D / 1.2;
			let transform = m4.translate(m4.identity(), [ this.a1.x, this.a1.y, this.a1.z ]);

			// vector from atom1 to atom2
			let a2b = [ this.a2.x - this.a1.x, this.a2.y - this.a1.y, this.a2.z - this.a1.z ];

			// calculate the rotation
			let y = [ 0, 1, 0 ];
			let ang = 0;
			let axis;
			if (this.a1.x === this.a2.x && this.a1.z === this.a2.z) {
				axis = [ 0, 0, 1 ];
				if (this.a2.y < this.a1.y) {
					ang = m.PI;
				}
			} else {
				ang = extensions.vec3AngleFrom(y, a2b);
				axis = v3.cross(y, a2b, []);
			}
			let scaleVector = [ radiusScale, height, radiusScale ];
			
			if (ang !== 0) {
				m4.rotate(transform, ang, axis);
			}
			m4.scale(transform, scaleVector);
			gl.shader.setMatrixUniforms(gl, transform);
			gl.material.setDiffuseColor(gl, this.isHover ? styles.colorHover : styles.colorSelect);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinderBuffer.vertexPositionBuffer.numItems);
		}
	};
	/**
	 * 
	 * @param {WegGLRenderingContext}
	 *            gl
	 * @param {structures.Styles}
	 *            styles
	 * @return {void}
	 */
	_.renderPicker = function(gl, styles) {

		// gl.cylinderBuffer.bindBuffers(gl);
		// gl.material.setDiffuseColor(
		// this.bondOrder == 0 ? '#FF0000' : // merah
		// this.bondOrder == 0.5 ? '#FFFF00' : // kuning
		// this.bondOrder == 1 ? '#FF00FF' : // ungu
		// this.bondOrder == 1.5 ? '#00FF00' : // hijau
		// this.bondOrder == 2 ? '#00FFFF' : // cyan
		// this.bondOrder == 3 ? '#0000FF' : // biru
		// '#FFFFFF');
		// gl.material.setAlpha(1);

		if (this.styles) {
			styles = this.styles;
		}
		// this is the elongation vector for the cylinder
		let height = this.a1.distance3D(this.a2);
		if (height === 0) {
			// if there is no height, then no point in rendering this bond,
			// just return
			return;
		}

		// scale factor for cylinder/pill radius.
		// when scale pill, the cap will affected too.
		let radiusScale = styles.bonds_cylinderDiameter_3D / 2;

		// transform to the atom as well as the opposite atom (for Jmol and
		// PyMOL
		// color splits)
		let transform = m4.translate(m4.identity(), [ this.a1.x, this.a1.y, this.a1.z ]);

		// vector from atom1 to atom2
		let a2b = [ this.a2.x - this.a1.x, this.a2.y - this.a1.y, this.a2.z - this.a1.z ];

		// calculate the rotation
		let y = [ 0, 1, 0 ];
		let ang = 0;
		let axis;
		if (this.a1.x === this.a2.x && this.a1.z === this.a2.z) {
			axis = [ 0, 0, 1 ];
			if (this.a2.y < this.a1.y) {
				ang = m.PI;
			}
		} else {
			ang = extensions.vec3AngleFrom(y, a2b);
			axis = v3.cross(y, a2b, []);
		}

		// calculate the translations for unsaturated bonds.
		// represenattio use saturatedCross are
		// - Line
		// - WIreframe
		// - Ball and Stick
		// just Stick will set bonds_showBondOrders_3D to false
		let others = [ 0 ];
		let saturatedCross;

		if (styles.bonds_showBondOrders_3D) {

			if (styles.bonds_renderAsLines_3D) {

				switch (this.bondOrder) {

				case 1.5:
				case 2:
					others = [ -styles.bonds_cylinderDiameter_3D, styles.bonds_cylinderDiameter_3D ];
					break;
				case 3:
					others = [ -1.2 * styles.bonds_cylinderDiameter_3D, 0, 1.2 * styles.bonds_cylinderDiameter_3D ];
					break;
				}

				// saturatedCross just need for need for bondorder greather than
				// 1
				if (this.bondOrder > 1) {
					let z = [ 0, 0, 1 ];
					let inverse = m4.inverse(gl.rotationMatrix, []);
					m4.multiplyVec3(inverse, z);
					saturatedCross = v3.cross(a2b, z, []);
					v3.normalize(saturatedCross);
				}

			} else {

				switch (this.bondOrder) {
				case 1.5:
				case 2:
					radiusScale *= 3;
					break;
				case 3:
					radiusScale *= 3.4;
					break;
				}

			}

		} else {
			// this is for Stick repersentation because Stick not have
			// bonds_showBondOrders_3D

			switch (this.bondOrder) {

			case 0:
				radiusScale *= 0.25;
				break;
			case 0.5:
			case 1.5:
				radiusScale *= 0.5;
				break;
			}

		}

		// Radius of cylinder already defined when initialize cylinder mesh,
		// so at this rate, the scale just needed for Y to strech
		// cylinder to bond length (height) and X and Z for radius.
		let scaleVector = [ radiusScale, height, radiusScale ];

		// render bonds
		for ( let i = 0, ii = others.length; i < ii; i++) {
			let transformUse = m4.set(transform, []);
			if (others[i] !== 0) {
				m4.translate(transformUse, v3.scale(saturatedCross, others[i], []));
			}
			if (ang !== 0) {
				m4.rotate(transformUse, ang, axis);
			}
			m4.scale(transformUse, scaleVector);

			// render
			gl.shader.setMatrixUniforms(gl, transformUse);
			if (styles.bonds_renderAsLines_3D) {
				gl.drawArrays(gl.LINES, 0, gl.lineBuffer.vertexPositionBuffer.numItems);
			} else {
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinderBuffer.vertexPositionBuffer.numItems);
			}

		}
	};

})(ChemDoodle.ELEMENT, ChemDoodle.extensions, ChemDoodle.structures, ChemDoodle.math, Math, ChemDoodle.lib.mat4, ChemDoodle.lib.vec3);

(function(structures, m, undefined) {
	'use strict';
	structures.Ring = function() {
		this.atoms = [];
		this.bonds = [];
	};
	let _ = structures.Ring.prototype;
	_.center = undefined;
	_.setupBonds = function() {
		for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
			this.bonds[i].ring = this;
		}
		this.center = this.getCenter();
	};
	_.getCenter = function() {
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
			minX = m.min(this.atoms[i].x, minX);
			minY = m.min(this.atoms[i].y, minY);
			maxX = m.max(this.atoms[i].x, maxX);
			maxY = m.max(this.atoms[i].y, maxY);
		}
		return new structures.Point((maxX + minX) / 2, (maxY + minY) / 2);
	};

})(ChemDoodle.structures, Math);

(function(c, math, structures, RESIDUE, m, undefined) {
	'use strict';
	structures.Molecule = function() {
		this.atoms = [];
		this.bonds = [];
		this.rings = [];
	};
	let _ = structures.Molecule.prototype;
	// this can be an extensive algorithm for large molecules, you may want
	// to turn this off
	_.findRings = true;
	_.draw = function(ctx, styles) {
		if (this.styles) {
			styles = this.styles;
		}
		// draw
		// need this weird render of atoms before and after, just in case
		// circles are rendered, as those should be on top
		if (styles.atoms_display && !styles.atoms_circles_2D) {
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				this.atoms[i].draw(ctx, styles);
			}
		}
		if (styles.bonds_display) {
			for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
				this.bonds[i].draw(ctx, styles);
			}
		}
		if (styles.atoms_display) {
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				let a = this.atoms[i];
				if(styles.atoms_circles_2D){
					a.draw(ctx, styles);
				}
				if(a.query){
					a.query.draw(ctx, styles, a);
				}
			}
		}
	};
	_.render = function(gl, styles) {
		// uncomment this to render the picking frame
		// return this.renderPickFrame(gl, styles, []);
		if (this.styles) {
			styles = this.styles;
		}
		// check explicitly if it is undefined here, since hetatm is a
		// boolean that can be true or false, as long as it is set, it is
		// macro
		let isMacro = this.atoms.length > 0 && this.atoms[0].hetatm !== undefined;
		if (isMacro) {
			if (styles.macro_displayBonds) {
				if (this.bonds.length > 0) {
					if (styles.bonds_renderAsLines_3D && !this.residueSpecs || this.residueSpecs && this.residueSpecs.bonds_renderAsLines_3D) {
						gl.lineWidth(this.residueSpecs ? this.residueSpecs.bonds_width_2D : styles.bonds_width_2D);
						gl.lineBuffer.bindBuffers(gl);
					} else {
						gl.cylinderBuffer.bindBuffers(gl);
					}
					// colors
					gl.material.setTempColors(gl, styles.bonds_materialAmbientColor_3D, undefined, styles.bonds_materialSpecularColor_3D, styles.bonds_materialShininess_3D);
				}
				for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
					let b = this.bonds[i];
					// closestDistance may be 0, so check if undefined
					if (!b.a1.hetatm && (styles.macro_atomToLigandDistance === -1 || (b.a1.closestDistance !== undefined && styles.macro_atomToLigandDistance >= b.a1.closestDistance && styles.macro_atomToLigandDistance >= b.a2.closestDistance))) {
						b.render(gl, this.residueSpecs ? this.residueSpecs : styles);
					}
				}
			}
			if (styles.macro_displayAtoms) {
				if (this.atoms.length > 0) {
					gl.sphereBuffer.bindBuffers(gl);
					// colors
					gl.material.setTempColors(gl, styles.atoms_materialAmbientColor_3D, undefined, styles.atoms_materialSpecularColor_3D, styles.atoms_materialShininess_3D);
				}
				for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
					let a = this.atoms[i];
					// closestDistance may be 0, so check if undefined
					if (!a.hetatm && (styles.macro_atomToLigandDistance === -1 || (a.closestDistance !== undefined && styles.macro_atomToLigandDistance >= a.closestDistance))) {
						a.render(gl, this.residueSpecs ? this.residueSpecs : styles);
					}
				}
			}
		}
		if (styles.bonds_display) {
			// Array for Half Bonds. It is needed because Half Bonds use the
			// pill buffer.
			let asPills = [];
			// Array for 0 bond order.
			let asSpheres = [];
			if (this.bonds.length > 0) {
				if (styles.bonds_renderAsLines_3D) {
					gl.lineWidth(styles.bonds_width_2D);
					gl.lineBuffer.bindBuffers(gl);
				} else {
					gl.cylinderBuffer.bindBuffers(gl);
				}
				// colors
				gl.material.setTempColors(gl, styles.bonds_materialAmbientColor_3D, undefined, styles.bonds_materialSpecularColor_3D, styles.bonds_materialShininess_3D);
			}
			for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
				let b = this.bonds[i];
				if (!isMacro || b.a1.hetatm) {
					// Check if render as segmented pill will used.
					if (styles.bonds_showBondOrders_3D) {
						if (b.bondOrder == 0) {
							// 0 bond order
							asSpheres.push(b);
						} else if (b.bondOrder == 0.5) {
							// 0.5 bond order
							asPills.push(b);
						} else {
							if (b.bondOrder == 1.5) {
								// For 1.5 bond order, the "1" part will render
								// as cylinder, and the "0.5" part will render
								// as segmented pills
								asPills.push(b);
							}
							b.render(gl, styles);
						}
					} else {
						// this will render the Stick representation
						b.render(gl, styles);
					}

				}
			}
			// Render the Half Bond
			if (asPills.length > 0) {
				// if bonds_renderAsLines_3D is true, then lineBuffer will
				// binded.
				// so in here we just need to check if we need to change
				// the binding buffer to pillBuffer or not.
				if (!styles.bonds_renderAsLines_3D) {
					gl.pillBuffer.bindBuffers(gl);
				}
				for ( let i = 0, ii = asPills.length; i < ii; i++) {
					asPills[i].render(gl, styles, true);
				}
			}
			// Render zero bond order
			if (asSpheres.length > 0) {
				// if bonds_renderAsLines_3D is true, then lineBuffer will
				// binded.
				// so in here we just need to check if we need to change
				// the binding buffer to pillBuffer or not.
				if (!styles.bonds_renderAsLines_3D) {
					gl.sphereBuffer.bindBuffers(gl);
				}
				for ( let i = 0, ii = asSpheres.length; i < ii; i++) {
					asSpheres[i].render(gl, styles, true);
				}
			}
		}
		if (styles.atoms_display) {
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				let a = this.atoms[i];
				a.bondNumber = 0;
				a.renderAsStar = false;
			}
			for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
				let b = this.bonds[i];
				b.a1.bondNumber++;
				b.a2.bondNumber++;
			}
			if (this.atoms.length > 0) {
				gl.sphereBuffer.bindBuffers(gl);
				// colors
				gl.material.setTempColors(gl, styles.atoms_materialAmbientColor_3D, undefined, styles.atoms_materialSpecularColor_3D, styles.atoms_materialShininess_3D);
			}
			let asStars = [];
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				let a = this.atoms[i];
				if (!isMacro || (a.hetatm && (styles.macro_showWater || !a.isWater))) {
					if (styles.atoms_nonBondedAsStars_3D && a.bondNumber === 0) {
						a.renderAsStar = true;
						asStars.push(a);
					} else {
						a.render(gl, styles);
					}
				}
			}
			if (asStars.length > 0) {
				gl.starBuffer.bindBuffers(gl);
				for ( let i = 0, ii = asStars.length; i < ii; i++) {
					asStars[i].render(gl, styles);
				}
			}
		}
		if (this.chains) {
			// set up the model view matrix, since it won't be modified
			// for macromolecules
			gl.shader.setMatrixUniforms(gl);
			// render chains
			if (styles.proteins_displayRibbon) {
				// proteins
				// colors
				gl.material.setTempColors(gl, styles.proteins_materialAmbientColor_3D, undefined, styles.proteins_materialSpecularColor_3D, styles.proteins_materialShininess_3D);
				let uses = styles.proteins_ribbonCartoonize ? this.cartoons : this.ribbons;
				for ( let j = 0, jj = uses.length; j < jj; j++) {
					let use = uses[j];
					if (styles.proteins_residueColor !== 'none') {
						use.front.bindBuffers(gl);
						let rainbow = (styles.proteins_residueColor === 'rainbow');
						for ( let i = 0, ii = use.front.segments.length; i < ii; i++) {
							if (rainbow) {
								gl.material.setDiffuseColor(gl, math.rainbowAt(i, ii, styles.macro_rainbowColors));
							}
							use.front.segments[i].render(gl, styles);
						}
						use.back.bindBuffers(gl);
						for ( let i = 0, ii = use.back.segments.length; i < ii; i++) {
							if (rainbow) {
								gl.material.setDiffuseColor(gl, math.rainbowAt(i, ii, styles.macro_rainbowColors));
							}
							use.back.segments[i].render(gl, styles);
						}
					} else {
						use.front.render(gl, styles);
						use.back.render(gl, styles);
					}
				}
			}

			if(styles.proteins_displayPipePlank) {
				for ( let j = 0, jj = this.pipePlanks.length; j < jj; j++) {
					this.pipePlanks[j].render(gl, styles);
				}
			}

			if (styles.proteins_displayBackbone) {
				if (!this.alphaCarbonTrace) {
					// cache the alpha carbon trace
					this.alphaCarbonTrace = {
						nodes : [],
						edges : []
					};
					for ( let j = 0, jj = this.chains.length; j < jj; j++) {
						let rs = this.chains[j];
						let isNucleotide = rs.length > 2 && RESIDUE[rs[2].name] && RESIDUE[rs[2].name].aminoColor === '#BEA06E';
						if (!isNucleotide && rs.length > 0) {
							for ( let i = 0, ii = rs.length - 2; i < ii; i++) {
								let n = rs[i].cp1;
								n.chainColor = rs.chainColor;
								this.alphaCarbonTrace.nodes.push(n);
								let b = new structures.Bond(rs[i].cp1, rs[i + 1].cp1);
								b.residueName = rs[i].name;
								b.chainColor = rs.chainColor;
								this.alphaCarbonTrace.edges.push(b);
								if (i === rs.length - 3) {
									n = rs[i + 1].cp1;
									n.chainColor = rs.chainColor;
									this.alphaCarbonTrace.nodes.push(n);
								}
							}
						}
					}
				}
				if (this.alphaCarbonTrace.nodes.length > 0) {
					let traceSpecs = new structures.Styles();
					traceSpecs.atoms_display = true;
					traceSpecs.bonds_display = true;
					traceSpecs.atoms_sphereDiameter_3D = styles.proteins_backboneThickness;
					traceSpecs.bonds_cylinderDiameter_3D = styles.proteins_backboneThickness;
					traceSpecs.bonds_splitColor = false;
					traceSpecs.atoms_color = styles.proteins_backboneColor;
					traceSpecs.bonds_color = styles.proteins_backboneColor;
					traceSpecs.atoms_useVDWDiameters_3D = false;
					// colors
					gl.material.setTempColors(gl, styles.proteins_materialAmbientColor_3D, undefined, styles.proteins_materialSpecularColor_3D, styles.proteins_materialShininess_3D);
					gl.material.setDiffuseColor(gl, styles.proteins_backboneColor);
					for ( let i = 0, ii = this.alphaCarbonTrace.nodes.length; i < ii; i++) {
						let n = this.alphaCarbonTrace.nodes[i];
						if (styles.macro_colorByChain) {
							traceSpecs.atoms_color = n.chainColor;
						}
						gl.sphereBuffer.bindBuffers(gl);
						n.render(gl, traceSpecs);
					}
					for ( let i = 0, ii = this.alphaCarbonTrace.edges.length; i < ii; i++) {
						let e = this.alphaCarbonTrace.edges[i];
						let color;
						let r = RESIDUE[e.residueName] ? RESIDUE[e.residueName] : RESIDUE['*'];
						if (styles.macro_colorByChain) {
							color = e.chainColor;
						} else if (styles.proteins_residueColor === 'shapely') {
							color = r.shapelyColor;
						} else if (styles.proteins_residueColor === 'amino') {
							color = r.aminoColor;
						} else if (styles.proteins_residueColor === 'polarity') {
							if (r.polar) {
								color = '#C10000';
							} else {
								color = '#FFFFFF';
							}
						} else if (styles.proteins_residueColor === 'acidity') {
							if(r.acidity === 1){
								color = '#0000FF';
							}else if(r.acidity === -1){
								color = '#FF0000';
							}else if (r.polar) {
								color = '#FFFFFF';
							} else {
								color = '#773300';
							}
						} else if (styles.proteins_residueColor === 'rainbow') {
							color = math.rainbowAt(i, ii, styles.macro_rainbowColors);
						}
						if (color) {
							traceSpecs.bonds_color = color;
						}
						gl.cylinderBuffer.bindBuffers(gl);
						e.render(gl, traceSpecs);
					}
				}
			}
			if (styles.nucleics_display) {
				// nucleic acids
				// colors
				gl.material.setTempColors(gl, styles.nucleics_materialAmbientColor_3D, undefined, styles.nucleics_materialSpecularColor_3D, styles.nucleics_materialShininess_3D);
				for ( let j = 0, jj = this.tubes.length; j < jj; j++) {
					gl.shader.setMatrixUniforms(gl);
					let use = this.tubes[j];
					use.render(gl, styles);
				}
			}
		}
		if (styles.atoms_display) {
			let highlight = false;
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				let a = this.atoms[i];
				if(a.isHover || a.isSelected){
					highlight = true;
					break;
				}
			}
			if(!highlight){
				for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
					let b = this.bonds[i];
					if(b.isHover || b.isSelected){
						highlight = true;
						break;
					}
				}
			}
			if(highlight){
				gl.sphereBuffer.bindBuffers(gl);
				// colors
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
				gl.material.setTempColors(gl, styles.atoms_materialAmbientColor_3D, undefined, '#000000', 0);
				gl.enable(gl.BLEND);
				gl.depthMask(false);
				gl.material.setAlpha(gl, .4);
				gl.sphereBuffer.bindBuffers(gl);
				for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
					let a = this.atoms[i];
					if(a.isHover || a.isSelected){
						a.renderHighlight(gl, styles);
					}
				}
				gl.cylinderBuffer.bindBuffers(gl);
				for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
					let b = this.bonds[i];
					if(b.isHover || b.isSelected){
						b.renderHighlight(gl, styles);
					}
				}
				gl.depthMask(true);
				gl.disable(gl.BLEND);
				gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);			
			}
		}
	};
	_.renderPickFrame = function(gl, styles, objects, includeAtoms, includeBonds) {
		if (this.styles) {
			styles = this.styles;
		}
		let isMacro = this.atoms.length > 0 && this.atoms[0].hetatm !== undefined;
		if (includeBonds && styles.bonds_display) {
			if (this.bonds.length > 0) {
				if (styles.bonds_renderAsLines_3D) {
					gl.lineWidth(styles.bonds_width_2D);
					gl.lineBuffer.bindBuffers(gl);
				} else {
					gl.cylinderBuffer.bindBuffers(gl);
				}
			}
			for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
				let b = this.bonds[i];
				if (!isMacro || b.a1.hetatm) {
					gl.material.setDiffuseColor(gl, math.idx2color(objects.length));
					b.renderPicker(gl, styles);
					objects.push(b);
				}
			}
		}
		if (includeAtoms && styles.atoms_display) {
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				let a = this.atoms[i];
				a.bondNumber = 0;
				a.renderAsStar = false;
			}
			for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
				let b = this.bonds[i];
				b.a1.bondNumber++;
				b.a2.bondNumber++;
			}
			if (this.atoms.length > 0) {
				gl.sphereBuffer.bindBuffers(gl);
			}
			let asStars = [];
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				let a = this.atoms[i];
				if (!isMacro || (a.hetatm && (styles.macro_showWater || !a.isWater))) {
					if (styles.atoms_nonBondedAsStars_3D && a.bondNumber === 0) {
						a.renderAsStar = true;
						asStars.push(a);
					} else {
						gl.material.setDiffuseColor(gl, math.idx2color(objects.length));
						a.render(gl, styles, true);
						objects.push(a);
					}
				}
			}
			if (asStars.length > 0) {
				gl.starBuffer.bindBuffers(gl);
				for ( let i = 0, ii = asStars.length; i < ii; i++) {
					let a = asStars[i];
					gl.material.setDiffuseColor(gl, math.idx2color(objects.length));
					a.render(gl, styles, true);
					objects.push(a);
				}
			}
		}
	};
	_.getCenter3D = function() {
		if (this.atoms.length === 1) {
			return new structures.Atom('C', this.atoms[0].x, this.atoms[0].y, this.atoms[0].z);
		}
		let minX = Infinity, minY = Infinity, minZ = Infinity;
		let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
		if (this.chains) {
			// residues
			for ( let i = 0, ii = this.chains.length; i < ii; i++) {
				let chain = this.chains[i];
				for ( let j = 0, jj = chain.length; j < jj; j++) {
					let residue = chain[j];
					minX = m.min(residue.cp1.x, residue.cp2.x, minX);
					minY = m.min(residue.cp1.y, residue.cp2.y, minY);
					minZ = m.min(residue.cp1.z, residue.cp2.z, minZ);
					maxX = m.max(residue.cp1.x, residue.cp2.x, maxX);
					maxY = m.max(residue.cp1.y, residue.cp2.y, maxY);
					maxZ = m.max(residue.cp1.z, residue.cp2.z, maxZ);
				}
			}
		}
		for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
			minX = m.min(this.atoms[i].x, minX);
			minY = m.min(this.atoms[i].y, minY);
			minZ = m.min(this.atoms[i].z, minZ);
			maxX = m.max(this.atoms[i].x, maxX);
			maxY = m.max(this.atoms[i].y, maxY);
			maxZ = m.max(this.atoms[i].z, maxZ);
		}
		return new structures.Atom('C', (maxX + minX) / 2, (maxY + minY) / 2, (maxZ + minZ) / 2);
	};
	_.getCenter = function() {
		if (this.atoms.length === 1) {
			return new structures.Point(this.atoms[0].x, this.atoms[0].y);
		}
		let minX = Infinity, minY = Infinity;
		let maxX = -Infinity, maxY = -Infinity;
		for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
			minX = m.min(this.atoms[i].x, minX);
			minY = m.min(this.atoms[i].y, minY);
			maxX = m.max(this.atoms[i].x, maxX);
			maxY = m.max(this.atoms[i].y, maxY);
		}
		return new structures.Point((maxX + minX) / 2, (maxY + minY) / 2);
	};
	_.getDimension = function() {
		if (this.atoms.length === 1) {
			return new structures.Point(0, 0);
		}
		let minX = Infinity, minY = Infinity;
		let maxX = -Infinity, maxY = -Infinity;
		if (this.chains) {
			for ( let i = 0, ii = this.chains.length; i < ii; i++) {
				let chain = this.chains[i];
				for ( let j = 0, jj = chain.length; j < jj; j++) {
					let residue = chain[j];
					minX = m.min(residue.cp1.x, residue.cp2.x, minX);
					minY = m.min(residue.cp1.y, residue.cp2.y, minY);
					maxX = m.max(residue.cp1.x, residue.cp2.x, maxX);
					maxY = m.max(residue.cp1.y, residue.cp2.y, maxY);
				}
			}
			minX -= 30;
			minY -= 30;
			maxX += 30;
			maxY += 30;
		}
		for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
			minX = m.min(this.atoms[i].x, minX);
			minY = m.min(this.atoms[i].y, minY);
			maxX = m.max(this.atoms[i].x, maxX);
			maxY = m.max(this.atoms[i].y, maxY);
		}
		return new structures.Point(maxX - minX, maxY - minY);
	};
	_.check = function(force) {
		// using force improves efficiency, so changes will not be checked
		// until a render occurs
		// you can force a check by sending true to this function after
		// calling check with a false
		if (force && this.doChecks) {
			// only check if the number of bonds has changed
			if (this.findRings) {
				if (this.bonds.length - this.atoms.length !== this.fjNumCache) {
					// find rings
					this.rings = new c.informatics.SSSRFinder(this).rings;
					for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
						this.bonds[i].ring = undefined;
					}
					for ( let i = 0, ii = this.rings.length; i < ii; i++) {
						this.rings[i].setupBonds();
					}
				} else {
					// update rings if any
					for ( let i = 0, ii = this.rings.length; i < ii; i++) {
						let r = this.rings[i];
						r.center = r.getCenter();
					}
				}
			}
			// find lones
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				this.atoms[i].isLone = false;
				if (this.atoms[i].label === 'C') {
					let counter = 0;
					for ( let j = 0, jj = this.bonds.length; j < jj; j++) {
						if (this.bonds[j].a1 === this.atoms[i] || this.bonds[j].a2 === this.atoms[i]) {
							counter++;
						}
					}
					if (counter === 0) {
						this.atoms[i].isLone = true;
					}
				}
			}
			// sort
			let sort = false;
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				if (this.atoms[i].z !== 0) {
					sort = true;
				}
			}
			if (sort) {
				this.sortAtomsByZ();
				this.sortBondsByZ();
			}
			// setup metadata
			this.setupMetaData();
			this.atomNumCache = this.atoms.length;
			this.bondNumCache = this.bonds.length;
			// fj number cache doesnt care if there are separate molecules,
			// as the change will signal a need to check for rings; the
			// accuracy doesn't matter
			this.fjNumCache = this.bonds.length - this.atoms.length;
		}
		this.doChecks = !force;
	};
	_.getAngles = function(a) {
		let angles = [];
		for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
			if (this.bonds[i].contains(a)) {
				angles.push(a.angle(this.bonds[i].getNeighbor(a)));
			}
		}
		angles.sort(function(a, b) {
			return a - b;
		});
		return angles;
	};
	_.getCoordinationNumber = function(bs) {
		let coordinationNumber = 0;
		for ( let i = 0, ii = bs.length; i < ii; i++) {
			coordinationNumber += bs[i].bondOrder;
		}
		return coordinationNumber;
	};
	_.getBonds = function(a) {
		let bonds = [];
		for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
			if (this.bonds[i].contains(a)) {
				bonds.push(this.bonds[i]);
			}
		}
		return bonds;
	};
	_.sortAtomsByZ = function() {
		for ( let i = 1, ii = this.atoms.length; i < ii; i++) {
			let index = i;
			while (index > 0 && this.atoms[index].z < this.atoms[index - 1].z) {
				let hold = this.atoms[index];
				this.atoms[index] = this.atoms[index - 1];
				this.atoms[index - 1] = hold;
				index--;
			}
		}
	};
	_.sortBondsByZ = function() {
		for ( let i = 1, ii = this.bonds.length; i < ii; i++) {
			let index = i;
			while (index > 0 && (this.bonds[index].a1.z + this.bonds[index].a2.z) < (this.bonds[index - 1].a1.z + this.bonds[index - 1].a2.z)) {
				let hold = this.bonds[index];
				this.bonds[index] = this.bonds[index - 1];
				this.bonds[index - 1] = hold;
				index--;
			}
		}
	};
	_.setupMetaData = function() {
		let center = this.getCenter();
		for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
			let a = this.atoms[i];
			a.bonds = this.getBonds(a);
			a.angles = this.getAngles(a);
			a.isHidden = a.bonds.length === 2 && m.abs(m.abs(a.angles[1] - a.angles[0]) - m.PI) < m.PI / 30 && a.bonds[0].bondOrder === a.bonds[1].bondOrder;
			let angleData = math.angleBetweenLargest(a.angles);
			a.angleOfLeastInterference = angleData.angle % (m.PI * 2);
			a.largestAngle = angleData.largest;
			a.coordinationNumber = this.getCoordinationNumber(a.bonds);
			a.bondNumber = a.bonds.length;
			a.molCenter = center;
		}
		for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
			let b = this.bonds[i];
			b.molCenter = center;
		}
	};
	_.scaleToAverageBondLength = function(length) {
		let avBondLength = this.getAverageBondLength();
		if (avBondLength !== 0) {
			let scale = length / avBondLength;
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				this.atoms[i].x *= scale;
				this.atoms[i].y *= scale;
			}
		}
	};
	_.getAverageBondLength = function() {
		if (this.bonds.length === 0) {
			return 0;
		}
		let tot = 0;
		for ( let i = 0, ii = this.bonds.length; i < ii; i++) {
			tot += this.bonds[i].getLength();
		}
		tot /= this.bonds.length;
		return tot;
	};
	_.getBounds = function() {
		let bounds = new math.Bounds();
		for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
			bounds.expand(this.atoms[i].getBounds());
		}
		if (this.chains) {
			for ( let i = 0, ii = this.chains.length; i < ii; i++) {
				let chain = this.chains[i];
				for ( let j = 0, jj = chain.length; j < jj; j++) {
					let residue = chain[j];
					bounds.expand(residue.cp1.x, residue.cp1.y);
					bounds.expand(residue.cp2.x, residue.cp2.y);
				}
			}
			bounds.minX -= 30;
			bounds.minY -= 30;
			bounds.maxX += 30;
			bounds.maxY += 30;
		}
		return bounds;
	};
	_.getBounds3D = function() {
		let bounds = new math.Bounds();
		for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
			bounds.expand(this.atoms[i].getBounds3D());
		}
		if (this.chains) {
			for ( let i = 0, ii = this.chains.length; i < ii; i++) {
				let chain = this.chains[i];
				for ( let j = 0, jj = chain.length; j < jj; j++) {
					let residue = chain[j];
					bounds.expand3D(residue.cp1.x, residue.cp1.y, residue.cp1.z);
					bounds.expand3D(residue.cp2.x, residue.cp2.y, residue.cp2.z);
				}
			}
		}
		return bounds;
	};
	_.getAtomGroup = function(a) {
		let ring = false;
		for(let i = 0, ii = this.atoms.length; i<ii; i++){
			this.atoms[i].visited = false;
		}
		for(let i = 0, ii = this.bonds.length; i<ii; i++){
			let b = this.bonds[i];
			if(!ring && b.contains(a) && b.ring!==undefined){
				ring = true;
			}
		}
		if(!ring){
			return undefined;
		}
		let set = [a];
		a.visited = true;
		let q = new structures.Queue();
		q.enqueue(a);
		while (!q.isEmpty()) {
			let atom = q.dequeue();
			for(let i = 0, ii = this.bonds.length; i<ii; i++){
				let b = this.bonds[i];
				if(b.contains(atom) && ring===(b.ring!==undefined)){
					let n = b.getNeighbor(atom);
					if(!n.visited){
						n.visited = true;
						set.push(n);
						q.enqueue(n);
					}
				}
			}
		}
		return set;
	};
	_.getBondGroup = function(b) {
		let ring = b.ring!==undefined;
		let contained = false;
		for(let i = 0, ii = this.bonds.length; i<ii; i++){
			let bi = this.bonds[i];
			if(bi===b){
				contained = true;
			}
			bi.visited = false;
		}
		if(!contained){
			// this bond isn't part of the molecule
			return undefined;
		}
		let set = [b];
		b.visited = true;
		let q = new structures.Queue();
		q.enqueue(b);
		while (!q.isEmpty()) {
			let bond = q.dequeue();
			for(let i = 0, ii = this.bonds.length; i<ii; i++){
				let n = this.bonds[i];
				if(!n.visited && (n.a1===bond.a1||n.a2===bond.a1||n.a1===bond.a2||n.a2===bond.a2) && (n.ring!==undefined)===ring){
					n.visited = true;
					set.push(n);
					q.enqueue(n);
				}
			}
		}
		return set;
	};

})(ChemDoodle, ChemDoodle.math, ChemDoodle.structures, ChemDoodle.RESIDUE, Math);
(function(structures, undefined) {
	'use strict';

	structures.Reaction = function() {
	};
	let _ = structures.Reaction.prototype;
	_.resolve = function(arrow, molecules) {
		if (!arrow || !molecules) {
			return;
		}
		let returning = {
			reactants:[],
			products:[]
		};
		let ps = arrow.getPoints();
		if (!ps) {
			returning.reactants.push(...molecules);
			return returning;
		}
		for ( let i = 0, ii = molecules.length; i < ii; i++) {
			let m = molecules[i];
			let center = m.getCenter();
			if (center.x < ps[1].x) {
				returning.reactants.push(m);
			} else {
				returning.products.push(m);
			}
		}
		return returning;
	};

})(ChemDoodle.structures);

(function(structures, m, m4, v3, undefined) {
	'use strict';
	let SB;
	let lastVerticalResolution = -1;

	function setupMatrices(verticalResolution) {
		let n2 = verticalResolution * verticalResolution;
		let n3 = verticalResolution * verticalResolution * verticalResolution;
		let S = [ 6 / n3, 0, 0, 0, 6 / n3, 2 / n2, 0, 0, 1 / n3, 1 / n2, 1 / verticalResolution, 0, 0, 0, 0, 1 ];
		let Bm = [ -1 / 6, 1 / 2, -1 / 2, 1 / 6, 1 / 2, -1, 1 / 2, 0, -1 / 2, 0, 1 / 2, 0, 1 / 6, 2 / 3, 1 / 6, 0 ];
		SB = m4.multiply(Bm, S, []);
		lastVerticalResolution = verticalResolution;
	}

	structures.Residue = function(resSeq) {
		// number of vertical slashes per segment
		this.resSeq = resSeq;
	};
	let _ = structures.Residue.prototype;
	_.setup = function(nextAlpha, horizontalResolution) {
		this.horizontalResolution = horizontalResolution;
		// define plane
		let A = [ nextAlpha.x - this.cp1.x, nextAlpha.y - this.cp1.y, nextAlpha.z - this.cp1.z ];
		let B = [ this.cp2.x - this.cp1.x, this.cp2.y - this.cp1.y, this.cp2.z - this.cp1.z ];
		let C = v3.cross(A, B, []);
		this.D = v3.cross(C, A, []);
		v3.normalize(C);
		v3.normalize(this.D);
		// generate guide coordinates
		// guides for the narrow parts of the ribbons
		this.guidePointsSmall = [];
		// guides for the wide parts of the ribbons
		this.guidePointsLarge = [];
		// guides for the ribbon part of helix as cylinder model
		let P = [ (nextAlpha.x + this.cp1.x) / 2, (nextAlpha.y + this.cp1.y) / 2, (nextAlpha.z + this.cp1.z) / 2 ];
		if (this.helix) {
			// expand helices
			v3.scale(C, 1.5);
			v3.add(P, C);
		}
		this.guidePointsSmall[0] = new structures.Atom('', P[0] - this.D[0] / 2, P[1] - this.D[1] / 2, P[2] - this.D[2] / 2);
		for ( let i = 1; i < horizontalResolution; i++) {
			this.guidePointsSmall[i] = new structures.Atom('', this.guidePointsSmall[0].x + this.D[0] * i / horizontalResolution, this.guidePointsSmall[0].y + this.D[1] * i / horizontalResolution, this.guidePointsSmall[0].z + this.D[2] * i / horizontalResolution);
		}
		v3.scale(this.D, 4);
		this.guidePointsLarge[0] = new structures.Atom('', P[0] - this.D[0] / 2, P[1] - this.D[1] / 2, P[2] - this.D[2] / 2);
		for ( let i = 1; i < horizontalResolution; i++) {
			this.guidePointsLarge[i] = new structures.Atom('', this.guidePointsLarge[0].x + this.D[0] * i / horizontalResolution, this.guidePointsLarge[0].y + this.D[1] * i / horizontalResolution, this.guidePointsLarge[0].z + this.D[2] * i / horizontalResolution);
		}
	};
	_.getGuidePointSet = function(type) {
		if (type === 0) {
			return this.helix || this.sheet ? this.guidePointsLarge : this.guidePointsSmall;
		} else if (type === 1) {
			return this.guidePointsSmall;
		} else if (type === 2) {
			return this.guidePointsLarge;
		}
	};
	_.computeLineSegments = function(b2, b1, a1, doCartoon, verticalResolution) {
		this.setVerticalResolution(verticalResolution);
		this.split = a1.helix !== this.helix || a1.sheet !== this.sheet;
		this.lineSegments = this.innerCompute(0, b2, b1, a1, false, verticalResolution);
		if (doCartoon) {
			this.lineSegmentsCartoon = this.innerCompute(this.helix || this.sheet ? 2 : 1, b2, b1, a1, true, verticalResolution);
		}
	};
	_.innerCompute = function(set, b2, b1, a1, useArrows, verticalResolution) {
		let segments = [];
		let use = this.getGuidePointSet(set);
		let useb2 = b2.getGuidePointSet(set);
		let useb1 = b1.getGuidePointSet(set);
		let usea1 = a1.getGuidePointSet(set);
		for ( let l = 0, ll = use.length; l < ll; l++) {
			let G = [ useb2[l].x, useb2[l].y, useb2[l].z, 1, useb1[l].x, useb1[l].y, useb1[l].z, 1, use[l].x, use[l].y, use[l].z, 1, usea1[l].x, usea1[l].y, usea1[l].z, 1 ];
			let M = m4.multiply(G, SB, []);
			let strand = [];
			for ( let k = 0; k < verticalResolution; k++) {
				for ( let i = 3; i > 0; i--) {
					for ( let j = 0; j < 4; j++) {
						M[i * 4 + j] += M[(i - 1) * 4 + j];
					}
				}
				strand[k] = new structures.Atom('', M[12] / M[15], M[13] / M[15], M[14] / M[15]);
			}
			segments[l] = strand;
		}
		if (useArrows && this.arrow) {
			for ( let i = 0, ii = verticalResolution; i < ii; i++) {
				let mult = 1.5 - 1.3 * i / verticalResolution;
				let mid = m.floor(this.horizontalResolution / 2);
				let center = segments[mid];
				for ( let j = 0, jj = segments.length; j < jj; j++) {
					if (j !== mid) {
						let o = center[i];
						let f = segments[j][i];
						let vec = [ f.x - o.x, f.y - o.y, f.z - o.z ];
						v3.scale(vec, mult);
						f.x = o.x + vec[0];
						f.y = o.y + vec[1];
						f.z = o.z + vec[2];
					}
				}
			}
		}
		return segments;
	};
	_.setVerticalResolution = function(verticalResolution) {
		if (verticalResolution !== lastVerticalResolution) {
			setupMatrices(verticalResolution);
		}
	};

})(ChemDoodle.structures, Math, ChemDoodle.lib.mat4, ChemDoodle.lib.vec3);

(function(extensions, structures, math, m, undefined) {
	'use strict';
	structures.Spectrum = function() {
		this.data = [];
		this.metadata = [];
		this.dataDisplay = [];
		this.memory = {
			offsetTop : 0,
			offsetLeft : 0,
			offsetBottom : 0,
			flipXAxis : false,
			scale : 1,
			width : 0,
			height : 0
		};
	};
	let _ = structures.Spectrum.prototype;
	_.title = undefined;
	_.xUnit = undefined;
	_.yUnit = undefined;
	_.continuous = true;
	_.integrationSensitivity = 0.01;
	_.draw = function(ctx, styles, width, height) {
		if (this.styles) {
			styles = this.styles;
		}
		let offsetTop = 5;
		let offsetLeft = 0;
		let offsetBottom = 0;
		// draw decorations
		ctx.fillStyle = styles.text_color;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'alphabetic';
		ctx.font = extensions.getFontString(styles.text_font_size, styles.text_font_families);
		if (this.xUnit) {
			offsetBottom += styles.text_font_size;
			ctx.fillText(this.xUnit, width / 2, height - 2);
		}
		if (this.yUnit && styles.plots_showYAxis) {
			offsetLeft += styles.text_font_size;
			ctx.save();
			ctx.translate(styles.text_font_size, height / 2);
			ctx.rotate(-m.PI / 2);
			ctx.fillText(this.yUnit, 0, 0);
			ctx.restore();
		}
		if (this.title) {
			offsetTop += styles.text_font_size;
			ctx.fillText(this.title, width / 2, styles.text_font_size);
		}
		// draw ticks
		ctx.lineCap = 'square';
		offsetBottom += 5 + styles.text_font_size;
		if (styles.plots_showYAxis) {
			offsetLeft += 5 + ctx.measureText('1000').width;
		}
		if (styles.plots_showGrid) {
			ctx.strokeStyle = styles.plots_gridColor;
			ctx.lineWidth = styles.plots_gridLineWidth;
			ctx.strokeRect(offsetLeft, offsetTop, width - offsetLeft, height - offsetBottom - offsetTop);
		}
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		let span = this.maxX - this.minX;
		let t = span / 100;
		let major = .001;
		while (major < t || span / major > 25) {
			major *= 10;
		}
		let counter = 0;
		let overlapX = styles.plots_flipXAxis ? width : 0;
		for ( let i = m.round(this.minX / major) * major; i <= this.maxX; i += major / 2) {
			let x = this.getTransformedX(i, styles, width, offsetLeft);
			if (x > offsetLeft) {
				ctx.strokeStyle = 'black';
				ctx.lineWidth = 1;
				if (counter % 2 === 0) {
					ctx.beginPath();
					ctx.moveTo(x, height - offsetBottom);
					ctx.lineTo(x, height - offsetBottom + 2);
					ctx.stroke();
					let s = i.toFixed(5);
					while (s.charAt(s.length - 1) === '0') {
						s = s.substring(0, s.length - 1);
					}
					if (s.charAt(s.length - 1) === '.') {
						s = s.substring(0, s.length - 1);
					}
					// do this to avoid label overlap
					let numWidth = ctx.measureText(s).width;
					if (styles.plots_flipXAxis) {
						numWidth *= -1;
					}
					let ls = x - numWidth / 2;
					if (styles.plots_flipXAxis ? ls < overlapX : ls > overlapX) {
						ctx.fillText(s, x, height - offsetBottom + 2);
						overlapX = x + numWidth / 2;
					}
					if (styles.plots_showGrid) {
						ctx.strokeStyle = styles.plots_gridColor;
						ctx.lineWidth = styles.plots_gridLineWidth;
						ctx.beginPath();
						ctx.moveTo(x, height - offsetBottom);
						ctx.lineTo(x, offsetTop);
						ctx.stroke();
					}
				} else {
					ctx.beginPath();
					ctx.moveTo(x, height - offsetBottom);
					ctx.lineTo(x, height - offsetBottom + 2);
					ctx.stroke();
				}
			}
			counter++;
		}
		if (styles.plots_showYAxis || styles.plots_showGrid) {
			let spany = 1 / styles.scale;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			for ( let i = 0; i <= 10; i++) {
				let yval = spany / 10 * i;
				let y = offsetTop + (height - offsetBottom - offsetTop) * (1 - yval * styles.scale);
				if (styles.plots_showGrid) {
					ctx.strokeStyle = styles.plots_gridColor;
					ctx.lineWidth = styles.plots_gridLineWidth;
					ctx.beginPath();
					ctx.moveTo(offsetLeft, y);
					ctx.lineTo(width, y);
					ctx.stroke();
				}
				if (styles.plots_showYAxis) {
					ctx.strokeStyle = 'black';
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.moveTo(offsetLeft, y);
					ctx.lineTo(offsetLeft - 3, y);
					ctx.stroke();
					let val = yval * 100;
					let cutoff = m.max(0, 3 - m.floor(val).toString().length);
					let s = val.toFixed(cutoff);
					if (cutoff > 0) {
						while (s.charAt(s.length - 1) === '0') {
							s = s.substring(0, s.length - 1);
						}
					}
					if (s.charAt(s.length - 1) === '.') {
						s = s.substring(0, s.length - 1);
					}
					ctx.fillText(s, offsetLeft - 3, y);
				}
			}
		}
		// draw axes
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 1;
		ctx.beginPath();
		// draw x axis
		ctx.moveTo(width, height - offsetBottom);
		ctx.lineTo(offsetLeft, height - offsetBottom);
		// draw y axis
		if (styles.plots_showYAxis) {
			ctx.lineTo(offsetLeft, offsetTop);
		}
		ctx.stroke();
		// draw metadata
		if (this.dataDisplay.length > 0) {
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			let mcount = 0;
			for ( let i = 0, ii = this.dataDisplay.length; i < ii; i++) {
				if (this.dataDisplay[i].value) {
					ctx.fillText([ this.dataDisplay[i].display, ': ', this.dataDisplay[i].value ].join(''), offsetLeft + 10, offsetTop + 10 + mcount * (styles.text_font_size + 5));
					mcount++;
				} else if (this.dataDisplay[i].tag) {
					for ( let j = 0, jj = this.metadata.length; j < jj; j++) {
						if (this.metadata[j].startsWith(this.dataDisplay[i].tag)) {
							let draw = this.metadata[j];
							if (this.dataDisplay[i].display) {
								let index = this.metadata[j].indexOf('=');
								draw = [ this.dataDisplay[i].display, ': ', index > -1 ? this.metadata[j].substring(index + 2) : this.metadata[j] ].join('');
							}
							ctx.fillText(draw, offsetLeft + 10, offsetTop + 10 + mcount * (styles.text_font_size + 5));
							mcount++;
							break;
						}
					}
				}
			}
		}
		this.drawPlot(ctx, styles, width, height, offsetTop, offsetLeft, offsetBottom);
		this.memory.offsetTop = offsetTop;
		this.memory.offsetLeft = offsetLeft;
		this.memory.offsetBottom = offsetBottom;
		this.memory.flipXAxis = styles.plots_flipXAxis;
		this.memory.scale = styles.scale;
		this.memory.width = width;
		this.memory.height = height;
	};
	_.drawPlot = function(ctx, styles, width, height, offsetTop, offsetLeft, offsetBottom) {
		if (this.styles) {
			styles = this.styles;
		}
		ctx.strokeStyle = styles.plots_color;
		ctx.lineWidth = styles.plots_width;
		let integration = [];
		// clip the spectrum display bounds here to not draw over the axes
		// we do this because we want to continue drawing segments to their natural ends to be accurate, but don't want to see them past the display area
		ctx.save();
		ctx.rect(offsetLeft, offsetTop, width-offsetLeft, height-offsetBottom-offsetTop);
		ctx.clip();
		ctx.beginPath();
		if (this.continuous) {
			let started = false;
			let counter = 0;
			let stop = false;
			for ( let i = 0, ii = this.data.length; i < ii; i++) {
				let x = this.getTransformedX(this.data[i].x, styles, width, offsetLeft);
				let xnext;
				if (i < ii && !started && this.data[i+1]) {
					// see if you should render this first segment
					xnext = this.getTransformedX(this.data[i + 1].x, styles, width, offsetLeft);
				}
				// check xnext against undefined as it can be 0/1
				if (x >= offsetLeft && x < width || xnext !== undefined && xnext >= offsetLeft && xnext < width) {
					let y = this.getTransformedY(this.data[i].y, styles, height, offsetBottom, offsetTop);
					if (styles.plots_showIntegration && m.abs(this.data[i].y) > this.integrationSensitivity) {
						integration.push(new structures.Point(this.data[i].x, this.data[i].y));
					}
					if (!started) {
						ctx.moveTo(x, y);
						started = true;
					}
					ctx.lineTo(x, y);
					counter++;
					if (counter % 1000 === 0) {
						// segment the path to avoid crashing safari on mac os x
						ctx.stroke();
						ctx.beginPath();
						ctx.moveTo(x, y);
					}
					if (stop) {
						break;
					}
				} else if (started) {
					// render one more segment
					stop = true;
				}
			}
		} else {
			for ( let i = 0, ii = this.data.length; i < ii; i++) {
				let x = this.getTransformedX(this.data[i].x, styles, width, offsetLeft);
				if (x >= offsetLeft && x < width) {
					ctx.moveTo(x, height - offsetBottom);
					ctx.lineTo(x, this.getTransformedY(this.data[i].y, styles, height, offsetBottom, offsetTop));
				}
			}
		}
		ctx.stroke();
		if (styles.plots_showIntegration && integration.length > 1) {
			ctx.strokeStyle = styles.plots_integrationColor;
			ctx.lineWidth = styles.plots_integrationLineWidth;
			ctx.beginPath();
			let ascending = integration[1].x > integration[0].x;
			let max;
			if (this.flipXAxis && !ascending || !this.flipXAxis && ascending) {
				for ( let i = integration.length - 2; i >= 0; i--) {
					integration[i].y = integration[i].y + integration[i + 1].y;
				}
				max = integration[0].y;
			} else {
				for ( let i = 1, ii = integration.length; i < ii; i++) {
					integration[i].y = integration[i].y + integration[i - 1].y;
				}
				max = integration[integration.length - 1].y;
			}
			for ( let i = 0, ii = integration.length; i < ii; i++) {
				let x = this.getTransformedX(integration[i].x, styles, width, offsetLeft);
				let y = this.getTransformedY(integration[i].y / styles.scale / max, styles, height, offsetBottom, offsetTop);
				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
			ctx.stroke();
		}
		ctx.restore();
	};
	_.getTransformedY = function(y, styles, height, offsetBottom, offsetTop) {
		return offsetTop + (height - offsetBottom - offsetTop) * (1 - y * styles.scale);
	};
	_.getInverseTransformedY = function(y) {
		// can only be called after a render when memory is set, this
		// function doesn't make sense without a render first anyway
		return (1 - (y - this.memory.offsetTop) / (this.memory.height - this.memory.offsetBottom - this.memory.offsetTop)) / this.memory.scale * 100;
	};
	_.getTransformedX = function(x, styles, width, offsetLeft) {
		let returning = offsetLeft + (x - this.minX) / (this.maxX - this.minX) * (width - offsetLeft);
		if (styles.plots_flipXAxis) {
			returning = width + offsetLeft - returning;
		}
		return returning;
	};
	_.getInverseTransformedX = function(x) {
		// can only be called after a render when memory is set, this
		// function doesn't make sense without a render first anyway
		if (this.memory.flipXAxis) {
			x = this.memory.width + this.memory.offsetLeft - x;
		}
		return (x - this.memory.offsetLeft) * (this.maxX - this.minX) / (this.memory.width - this.memory.offsetLeft) + this.minX;
	};
	_.setup = function() {
		let xmin = Number.MAX_VALUE;
		let xmax = Number.MIN_VALUE;
		let ymax = Number.MIN_VALUE;
		for ( let i = 0, ii = this.data.length; i < ii; i++) {
			xmin = m.min(xmin, this.data[i].x);
			xmax = m.max(xmax, this.data[i].x);
			ymax = m.max(ymax, this.data[i].y);
		}
		if (this.continuous) {
			this.minX = xmin;
			this.maxX = xmax;
		} else {
			this.minX = xmin - 1;
			this.maxX = xmax + 1;
		}
		for ( let i = 0, ii = this.data.length; i < ii; i++) {
			this.data[i].y /= ymax;
		}
	};
	_.zoom = function(pixel1, pixel2, width, rescaleY) {
		let p1 = this.getInverseTransformedX(pixel1);
		let p2 = this.getInverseTransformedX(pixel2);
		this.minX = m.min(p1, p2);
		this.maxX = m.max(p1, p2);
		if (rescaleY) {
			let ymax = Number.MIN_VALUE;
			for ( let i = 0, ii = this.data.length; i < ii; i++) {
				if (math.isBetween(this.data[i].x, this.minX, this.maxX)) {
					ymax = m.max(ymax, this.data[i].y);
				}
			}
			return 1 / ymax;
		}
	};
	_.translate = function(dif, width) {
		let dist = dif / (width - this.memory.offsetLeft) * (this.maxX - this.minX) * (this.memory.flipXAxis ? 1 : -1);
		this.minX += dist;
		this.maxX += dist;
	};
	_.alertMetadata = function() {
		alert(this.metadata.join('\n'));
	};
	_.getInternalCoordinates = function(x, y) {
		return new ChemDoodle.structures.Point(this.getInverseTransformedX(x), this.getInverseTransformedY(y));
	};
	_.getClosestPlotInternalCoordinates = function(x) {
		let xtl = this.getInverseTransformedX(x - 1);
		let xtr = this.getInverseTransformedX(x + 1);
		if (xtl > xtr) {
			let temp = xtl;
			xtl = xtr;
			xtr = temp;
		}
		let highest = -1;
		let max = -Infinity;
		let inRange = false;
		for ( let i = 0, ii = this.data.length; i < ii; i++) {
			let p = this.data[i];
			if (math.isBetween(p.x, xtl, xtr)) {
				if (p.y > max) {
					inRange = true;
					max = p.y;
					highest = i;
				}
			} else if (inRange) {
				break;
			}
		}
		if (highest === -1) {
			return undefined;
		}
		let p = this.data[highest];
		return new ChemDoodle.structures.Point(p.x, p.y * 100);
	};
	_.getClosestPeakInternalCoordinates = function(x) {
		let xt = this.getInverseTransformedX(x);
		let closest = 0;
		let dif = Infinity;
		for ( let i = 0, ii = this.data.length; i < ii; i++) {
			let sub = m.abs(this.data[i].x - xt);
			if (sub <= dif) {
				dif = sub;
				closest = i;
			} else {
				break;
			}
		}
		let highestLeft = closest, highestRight = closest;
		let maxLeft = this.data[closest].y, maxRight = this.data[closest].y;
		for ( let i = closest + 1, ii = this.data.length; i < ii; i++) {
			if (this.data[i].y + .05 > maxRight) {
				maxRight = this.data[i].y;
				highestRight = i;
			} else {
				break;
			}
		}
		for ( let i = closest - 1; i >= 0; i--) {
			if (this.data[i].y + .05 > maxLeft) {
				maxLeft = this.data[i].y;
				highestLeft = i;
			} else {
				break;
			}
		}
		let p = this.data[highestLeft - closest > highestRight - closest ? highestRight : highestLeft];
		return new ChemDoodle.structures.Point(p.x, p.y * 100);
	};

})(ChemDoodle.extensions, ChemDoodle.structures, ChemDoodle.math, Math);

(function(math, d2, m, undefined) {
	'use strict';
	d2._Shape = function() {
	};
	let _ = d2._Shape.prototype;
	_.drawDecorations = function(ctx, styles) {
		if (this.isHover) {
			let ps = this.getPoints();
			for ( let i = 0, ii = ps.length; i < ii; i++) {
				let p = ps[i];
				this.drawAnchor(ctx, styles, p, p === this.hoverPoint);
			}
		}
	};
	_.getBounds = function() {
		let bounds = new math.Bounds();
		let ps = this.getPoints();
		for ( let i = 0, ii = ps.length; i < ii; i++) {
			let p = ps[i];
			bounds.expand(p.x, p.y);
		}
		return bounds;
	};
	_.drawAnchor = function(ctx, styles, p, hovered) {
		ctx.save();
		ctx.translate(p.x, p.y);
		ctx.rotate(m.PI / 4);
		ctx.scale(1 / styles.scale, 1 / styles.scale);
		let boxRadius = 4;
		let innerRadius = boxRadius / 2;

		ctx.beginPath();
		ctx.moveTo(-boxRadius, -boxRadius);
		ctx.lineTo(boxRadius, -boxRadius);
		ctx.lineTo(boxRadius, boxRadius);
		ctx.lineTo(-boxRadius, boxRadius);
		ctx.closePath();
		if (hovered) {
			ctx.fillStyle = styles.colorHover;
		} else {
			ctx.fillStyle = 'white';
		}
		ctx.fill();

		ctx.beginPath();
		ctx.moveTo(-boxRadius, -innerRadius);
		ctx.lineTo(-boxRadius, -boxRadius);
		ctx.lineTo(-innerRadius, -boxRadius);
		ctx.moveTo(innerRadius, -boxRadius);
		ctx.lineTo(boxRadius, -boxRadius);
		ctx.lineTo(boxRadius, -innerRadius);
		ctx.moveTo(boxRadius, innerRadius);
		ctx.lineTo(boxRadius, boxRadius);
		ctx.lineTo(innerRadius, boxRadius);
		ctx.moveTo(-innerRadius, boxRadius);
		ctx.lineTo(-boxRadius, boxRadius);
		ctx.lineTo(-boxRadius, innerRadius);
		ctx.moveTo(-boxRadius, -innerRadius);

		ctx.strokeStyle = 'rgba(0,0,0,.2)';
		ctx.lineWidth = 5;
		ctx.stroke();
		ctx.strokeStyle = 'blue';
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.restore();
	};

})(ChemDoodle.math, ChemDoodle.structures.d2, Math);

(function(extensions, math, structures, d2, m, undefined) {
	'use strict';
	
	d2.AtomMapping = function(o1, o2) {
		// these need to be named 'o', not 'a' or the generic erase function won't work for them
		this.o1 = o1;
		this.o2 = o2;
		this.label = '0';
		this.error = false;
	};
	let _ = d2.AtomMapping.prototype = new d2._Shape();
	_.drawDecorations = function(ctx, styles) {
		if (this.isHover || this.isSelected) {
			ctx.strokeStyle = this.isHover ? styles.colorHover : styles.colorSelect;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(this.o1.x, this.o1.y);
			ctx.lineTo(this.o2.x, this.o2.y);
			ctx.setLineDash([2]);
			ctx.stroke();
			ctx.setLineDash([]);
		}
	};
	_.draw = function(ctx, styles) {
		if (this.o1 && this.o2) {
			let sep = 14;
			this.x1 = this.o1.x+sep*m.cos(this.o1.angleOfLeastInterference);
			this.y1 = this.o1.y-sep*m.sin(this.o1.angleOfLeastInterference);
			this.x2 = this.o2.x+sep*m.cos(this.o2.angleOfLeastInterference);
			this.y2 = this.o2.y-sep*m.sin(this.o2.angleOfLeastInterference);
			ctx.font = extensions.getFontString(styles.text_font_size, styles.text_font_families, styles.text_font_bold, styles.text_font_italic);
			let label = this.label;
			let w = ctx.measureText(label).width;
			if (this.isLassoed) {
				ctx.fillStyle = styles.colorHover;
				ctx.fillRect(this.x1-w/2-3, this.y1-styles.text_font_size/2-3, w+6, styles.text_font_size+6);
				ctx.fillRect(this.x2-w/2-3, this.y2-styles.text_font_size/2-3, w+6, styles.text_font_size+6);
			}
			let color = this.error?styles.colorError:styles.shapes_color;
			if (this.isHover || this.isSelected) {
				color = this.isHover ? styles.colorHover : styles.colorSelect;
			}
			ctx.fillStyle = color;
			ctx.fillRect(this.x1-w/2-1, this.y1-styles.text_font_size/2-1, w+2, styles.text_font_size+2);
			ctx.fillRect(this.x2-w/2-1, this.y2-styles.text_font_size/2-1, w+2, styles.text_font_size+2);
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = styles.backgroundColor;
			ctx.fillText(label, this.x1, this.y1);
			ctx.fillText(label, this.x2, this.y2);
		}
	};
	_.getPoints = function() {
		return [new structures.Point(this.x1, this.y1), new structures.Point(this.x2, this.y2)];
	};
	_.isOver = function(p, barrier) {
		if(this.x1){
			return p.distance({x:this.x1, y:this.y1})<barrier || p.distance({x:this.x2, y:this.y2})<barrier;
		}
		return false;
	};

})(ChemDoodle.extensions, ChemDoodle.math, ChemDoodle.structures, ChemDoodle.structures.d2, Math);

(function(extensions, math, structures, d2, m, undefined) {
	'use strict';
	d2.Bracket = function(p1, p2) {
		this.p1 = p1 ? p1 : new structures.Point();
		this.p2 = p2 ? p2 : new structures.Point();
	};
	let _ = d2.Bracket.prototype = new d2._Shape();
	_.charge = 0;
	_.mult = 0;
	_.repeat = 0;
	_.draw = function(ctx, styles) {
		let minX = m.min(this.p1.x, this.p2.x);
		let maxX = m.max(this.p1.x, this.p2.x);
		let minY = m.min(this.p1.y, this.p2.y);
		let maxY = m.max(this.p1.y, this.p2.y);
		let h = maxY - minY;
		let lip = h / 10;
		ctx.beginPath();
		ctx.moveTo(minX + lip, minY);
		ctx.lineTo(minX, minY);
		ctx.lineTo(minX, maxY);
		ctx.lineTo(minX + lip, maxY);
		ctx.moveTo(maxX - lip, maxY);
		ctx.lineTo(maxX, maxY);
		ctx.lineTo(maxX, minY);
		ctx.lineTo(maxX - lip, minY);
		if (this.isLassoed) {
			let grd = ctx.createLinearGradient(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
			grd.addColorStop(0, 'rgba(212, 99, 0, 0)');
			grd.addColorStop(0.5, 'rgba(212, 99, 0, 0.8)');
			grd.addColorStop(1, 'rgba(212, 99, 0, 0)');
			ctx.lineWidth = styles.shapes_lineWidth + 5;
			ctx.strokeStyle = grd;
			ctx.lineJoin = 'miter';
			ctx.lineCap = 'square';
			ctx.stroke();
		}
		ctx.strokeStyle = styles.shapes_color;
		ctx.lineWidth = styles.shapes_lineWidth;
		ctx.lineJoin = 'miter';
		ctx.lineCap = 'butt';
		ctx.stroke();
		if (this.charge !== 0) {
			ctx.fillStyle = styles.text_color;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'alphabetic';
			ctx.font = extensions.getFontString(styles.text_font_size, styles.text_font_families);
			let s = this.charge.toFixed(0);
			if (s === '1') {
				s = '+';
			} else if (s === '-1') {
				s = '\u2013';
			} else if (s.startsWith('-')) {
				s = s.substring(1) + '\u2013';
			} else {
				s += '+';
			}
			ctx.fillText(s, maxX + 5, minY + 5);
		}
		if (this.mult !== 0) {
			ctx.fillStyle = styles.text_color;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.font = extensions.getFontString(styles.text_font_size, styles.text_font_families);
			ctx.fillText(this.mult.toFixed(0), minX - 5, minY + h / 2);
		}
		if (this.repeat !== 0) {
			ctx.fillStyle = styles.text_color;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.font = extensions.getFontString(styles.text_font_size, styles.text_font_families);
			let s = this.repeat.toFixed(0);
			ctx.fillText(s, maxX + 5, maxY - 5);
		}
	};
	_.getPoints = function() {
		return [ this.p1, this.p2 ];
	};
	_.isOver = function(p, barrier) {
		return math.isBetween(p.x, this.p1.x, this.p2.x) && math.isBetween(p.y, this.p1.y, this.p2.y);
	};

})(ChemDoodle.extensions, ChemDoodle.math, ChemDoodle.structures, ChemDoodle.structures.d2, Math);

(function(extensions, math, jsb, structures, d2, m, undefined) {
	'use strict';

	d2.RepeatUnit = function(b1, b2) {
		this.b1 = b1;
		this.b2 = b2;
		this.n1 = 1;
		this.n2 = 4;
		this.contents = [];
		this.ps = [];
	};
	let _ = d2.RepeatUnit.prototype = new d2._Shape();
	_.drawDecorations = function(ctx, styles) {
		if (this.isHover) {
			for(let i = 0, ii = this.contents.length; i<ii; i++){
				let a = this.contents[i];
				let grd = ctx.createRadialGradient(a.x - 1, a.y - 1, 0, a.x, a.y, 7);
				grd.addColorStop(0, 'rgba(212, 99, 0, 0)');
				grd.addColorStop(0.7, 'rgba(212, 99, 0, 0.8)');
				ctx.fillStyle = grd;
				ctx.beginPath();
				ctx.arc(a.x, a.y, 5, 0, m.PI * 2, false);
				ctx.fill();
			}
		}
	};
	let drawEnd = function(ctx, styles, b, b2, contents) {
		let ps = [];
		let stretch = 10;
		let arm = 4;
		let a = contents.length>0?(contents.indexOf(b.a1)===-1?b.a2:b.a1):(b.a1.distance(b2.getCenter())<b.a2.distance(b2.getCenter())?b.a1:b.a2);
		let angle = a.angle(b.getNeighbor(a));
		let perp = angle+m.PI/2;
		let length = b.getLength()/(contents.length>1?4:2);
		let psx = a.x+length*m.cos(angle);
		let psy = a.y-length*m.sin(angle);
		let scos = stretch*m.cos(perp);
		let ssin = stretch*m.sin(perp);
		let p1x = psx+scos;
		let p1y = psy-ssin;
		let p2x = psx-scos;
		let p2y = psy+ssin;
		let acos = -arm*m.cos(angle);
		let asin = -arm*m.sin(angle);
		let p1ax = p1x+acos;
		let p1ay = p1y-asin;
		let p2ax = p2x+acos;
		let p2ay = p2y-asin;
		ctx.beginPath();
		ctx.moveTo(p1ax, p1ay);
		ctx.lineTo(p1x, p1y);
		ctx.lineTo(p2x, p2y);
		ctx.lineTo(p2ax, p2ay);
		ctx.stroke();
		ps.push(new structures.Point(p1x, p1y));
		ps.push(new structures.Point(p2x, p2y));
		return ps;
	};
	_.draw = function(ctx, styles) {
		if (this.b1 && this.b2) {
			let color = this.error?styles.colorError:styles.shapes_color;
			if (this.isHover || this.isSelected) {
				color = this.isHover ? styles.colorHover : styles.colorSelect;
			}
			ctx.strokeStyle = color;
			ctx.fillStyle = ctx.strokeStyle;
			ctx.lineWidth = styles.shapes_lineWidth;
			ctx.lineJoin = 'miter';
			ctx.lineCap = 'butt';
			let ps1 = drawEnd(ctx, styles, this.b1, this.b2, this.contents);
			let ps2 = drawEnd(ctx, styles, this.b2, this.b1, this.contents);
			this.ps = ps1.concat(ps2);
			if(this.b1.getCenter().x>this.b2.getCenter().x){
				if(this.ps[0].x>this.ps[1].x+5){
					this.textPos = this.ps[0];
				}else{
					this.textPos = this.ps[1];
				}
			}else{
				if(this.ps[2].x>this.ps[3].x+5){
					this.textPos = this.ps[2];
				}else{
					this.textPos = this.ps[3];
				}
			}
			if(!this.error && this.contents.length>0){
				ctx.font = extensions.getFontString(styles.text_font_size, styles.text_font_families, styles.text_font_bold, styles.text_font_italic);
				ctx.fillStyle = this.isHover?styles.colorHover:styles.text_color;
				ctx.textAlign = 'left';
				ctx.textBaseline = 'bottom';
				ctx.fillText(this.n1+'-'+this.n2, this.textPos.x+2, this.textPos.y+2);
			}
		}
	};
	_.getPoints = function() {
		return this.ps;
	};
	_.isOver = function(p, barrier) {
		return false;
	};
	_.setContents = function(sketcher){
		this.contents = [];
		let m1 = sketcher.getMoleculeByAtom(this.b1.a1);
		let m2 = sketcher.getMoleculeByAtom(this.b2.a1);
		// make sure both b1 and b2 are part of the same molecule
		if(m1 && m1===m2){
			// if either b1 or b2 is in a ring, then stop, as this is a violation
			// unless b1 and b2 are part of the same ring and are part of no other rings
			let c1 = 0;
			let c2 = 0;
			for(let i = 0, ii = m1.rings.length; i<ii; i++){
				let r = m1.rings[i];
				for(let j = 0, jj = r.bonds.length; j<jj; j++){
					let rb = r.bonds[j];
					if(rb===this.b1){
						c1++;
					}else if(rb===this.b2){
						c2++;
					}
				}
			}
			let sameSingleRing = c1===1 && c2===1 && this.b1.ring===this.b2.ring;
			this.contents.flippable = sameSingleRing;
			if(this.b1.ring===undefined && this.b2.ring===undefined || sameSingleRing){
				for(let i = 0, ii = m1.atoms.length; i<ii; i++){
					let reached1 = false; 
					let reached2 = false;
					let reachedInner = false;
					for (let j = 0, jj = m1.bonds.length; j<jj; j++) {
						m1.bonds[j].visited = false;
					}
					let q = new structures.Queue();
					let a = m1.atoms[i];
					q.enqueue(a);
					while (!q.isEmpty() && !(reached1 && reached2)) {
						let check = q.dequeue();
						if(sameSingleRing && (!this.flip && check===this.b1.a1 || this.flip && check===this.b1.a2)){
							reachedInner = true;
						}
						for (let j = 0, jj = m1.bonds.length; j<jj; j++) {
							let b = m1.bonds[j];
							if(b.a1===check || b.a2===check){
								if (b === this.b1) {
									reached1 = true;
								} else if (b === this.b2) {
									reached2 = true;
								} else if (!b.visited) {
									b.visited = true;
									q.enqueue(b.getNeighbor(check));
								}
							}
						}
					}
					if(reached1 && reached2 && (!sameSingleRing || reachedInner)){
						this.contents.push(a);
					}
				}
			}
		}
	};

})(ChemDoodle.extensions, ChemDoodle.math, ChemDoodle.lib.jsBezier, ChemDoodle.structures, ChemDoodle.structures.d2, Math);

(function(extensions, math, structures, d2, m, undefined) {
	'use strict';
	d2.Line = function(p1, p2) {
		this.p1 = p1 ? p1 : new structures.Point();
		this.p2 = p2 ? p2 : new structures.Point();
		this.reactants = [];
		this.products = [];
	};
	d2.Line.ARROW_SYNTHETIC = 'synthetic';
	d2.Line.ARROW_RETROSYNTHETIC = 'retrosynthetic';
	d2.Line.ARROW_RESONANCE = 'resonance';
	d2.Line.ARROW_EQUILIBRIUM = 'equilibrium';
	let _ = d2.Line.prototype = new d2._Shape();
	_.arrowType = undefined;
	_.topText = undefined;
	_.bottomText = undefined;
	_.draw = function(ctx, styles) {
		if (this.isLassoed) {
			let grd = ctx.createLinearGradient(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
			grd.addColorStop(0, 'rgba(212, 99, 0, 0)');
			grd.addColorStop(0.5, 'rgba(212, 99, 0, 0.8)');
			grd.addColorStop(1, 'rgba(212, 99, 0, 0)');
			let useDist = 2.5;
			let perpendicular = this.p1.angle(this.p2) + m.PI / 2;
			let mcosp = m.cos(perpendicular);
			let msinp = m.sin(perpendicular);
			let cx1 = this.p1.x - mcosp * useDist;
			let cy1 = this.p1.y + msinp * useDist;
			let cx2 = this.p1.x + mcosp * useDist;
			let cy2 = this.p1.y - msinp * useDist;
			let cx3 = this.p2.x + mcosp * useDist;
			let cy3 = this.p2.y - msinp * useDist;
			let cx4 = this.p2.x - mcosp * useDist;
			let cy4 = this.p2.y + msinp * useDist;
			ctx.fillStyle = grd;
			ctx.beginPath();
			ctx.moveTo(cx1, cy1);
			ctx.lineTo(cx2, cy2);
			ctx.lineTo(cx3, cy3);
			ctx.lineTo(cx4, cy4);
			ctx.closePath();
			ctx.fill();
		}
		ctx.strokeStyle = styles.shapes_color;
		ctx.fillStyle = styles.shapes_color;
		ctx.lineWidth = styles.shapes_lineWidth;
		ctx.lineJoin = 'miter';
		ctx.lineCap = 'butt';
		if (this.p1.x !== this.p2.x || this.p1.y !== this.p2.y) {
			// only render if the points are different, otherwise this will
			// cause fill overflows
			if (this.arrowType === d2.Line.ARROW_RETROSYNTHETIC) {
				let r2 = m.sqrt(2) * 2;
				let useDist = styles.shapes_arrowLength_2D / r2;
				let angle = this.p1.angle(this.p2);
				let perpendicular = angle + m.PI / 2;
				let retract = styles.shapes_arrowLength_2D / r2;
				let mcosa = m.cos(angle);
				let msina = m.sin(angle);
				let mcosp = m.cos(perpendicular);
				let msinp = m.sin(perpendicular);
				let cx1 = this.p1.x - mcosp * useDist;
				let cy1 = this.p1.y + msinp * useDist;
				let cx2 = this.p1.x + mcosp * useDist;
				let cy2 = this.p1.y - msinp * useDist;
				let cx3 = this.p2.x + mcosp * useDist - mcosa * retract;
				let cy3 = this.p2.y - msinp * useDist + msina * retract;
				let cx4 = this.p2.x - mcosp * useDist - mcosa * retract;
				let cy4 = this.p2.y + msinp * useDist + msina * retract;
				let ax1 = this.p2.x + mcosp * useDist * 2 - mcosa * retract * 2;
				let ay1 = this.p2.y - msinp * useDist * 2 + msina * retract * 2;
				let ax2 = this.p2.x - mcosp * useDist * 2 - mcosa * retract * 2;
				let ay2 = this.p2.y + msinp * useDist * 2 + msina * retract * 2;
				ctx.beginPath();
				ctx.moveTo(cx2, cy2);
				ctx.lineTo(cx3, cy3);
				ctx.moveTo(ax1, ay1);
				ctx.lineTo(this.p2.x, this.p2.y);
				ctx.lineTo(ax2, ay2);
				ctx.moveTo(cx4, cy4);
				ctx.lineTo(cx1, cy1);
				ctx.stroke();
			} else if (this.arrowType === d2.Line.ARROW_EQUILIBRIUM) {
				let r2 = m.sqrt(2) * 2;
				let useDist = styles.shapes_arrowLength_2D / r2 / 2;
				let angle = this.p1.angle(this.p2);
				let perpendicular = angle + m.PI / 2;
				let retract = styles.shapes_arrowLength_2D * 2 / m.sqrt(3);
				let mcosa = m.cos(angle);
				let msina = m.sin(angle);
				let mcosp = m.cos(perpendicular);
				let msinp = m.sin(perpendicular);
				let cx1 = this.p1.x - mcosp * useDist;
				let cy1 = this.p1.y + msinp * useDist;
				let cx2 = this.p1.x + mcosp * useDist;
				let cy2 = this.p1.y - msinp * useDist;
				let cx3 = this.p2.x + mcosp * useDist;
				let cy3 = this.p2.y - msinp * useDist;
				let cx4 = this.p2.x - mcosp * useDist;
				let cy4 = this.p2.y + msinp * useDist;
				ctx.beginPath();
				ctx.moveTo(cx2, cy2);
				ctx.lineTo(cx3, cy3);
				ctx.moveTo(cx4, cy4);
				ctx.lineTo(cx1, cy1);
				ctx.stroke();
				// right arrow
				let rx1 = cx3 - mcosa * retract * .8;
				let ry1 = cy3 + msina * retract * .8;
				let ax1 = cx3 + mcosp * styles.shapes_arrowLength_2D / 3 - mcosa * retract;
				let ay1 = cy3 - msinp * styles.shapes_arrowLength_2D / 3 + msina * retract;
				ctx.beginPath();
				ctx.moveTo(cx3, cy3);
				ctx.lineTo(ax1, ay1);
				ctx.lineTo(rx1, ry1);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
				// left arrow
				rx1 = cx1 + mcosa * retract * .8;
				ry1 = cy1 - msina * retract * .8;
				ax1 = cx1 - mcosp * styles.shapes_arrowLength_2D / 3 + mcosa * retract;
				ay1 = cy1 + msinp * styles.shapes_arrowLength_2D / 3 - msina * retract;
				ctx.beginPath();
				ctx.moveTo(cx1, cy1);
				ctx.lineTo(ax1, ay1);
				ctx.lineTo(rx1, ry1);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			} else if (this.arrowType === d2.Line.ARROW_SYNTHETIC) {
				let angle = this.p1.angle(this.p2);
				let perpendicular = angle + m.PI / 2;
				let retract = styles.shapes_arrowLength_2D * 2 / m.sqrt(3);
				let mcosa = m.cos(angle);
				let msina = m.sin(angle);
				let mcosp = m.cos(perpendicular);
				let msinp = m.sin(perpendicular);
				ctx.beginPath();
				ctx.moveTo(this.p1.x, this.p1.y);
				ctx.lineTo(this.p2.x - mcosa * retract / 2, this.p2.y + msina * retract / 2);
				ctx.stroke();
				let rx1 = this.p2.x - mcosa * retract * .8;
				let ry1 = this.p2.y + msina * retract * .8;
				let ax1 = this.p2.x + mcosp * styles.shapes_arrowLength_2D / 3 - mcosa * retract;
				let ay1 = this.p2.y - msinp * styles.shapes_arrowLength_2D / 3 + msina * retract;
				let ax2 = this.p2.x - mcosp * styles.shapes_arrowLength_2D / 3 - mcosa * retract;
				let ay2 = this.p2.y + msinp * styles.shapes_arrowLength_2D / 3 + msina * retract;
				ctx.beginPath();
				ctx.moveTo(this.p2.x, this.p2.y);
				ctx.lineTo(ax2, ay2);
				ctx.lineTo(rx1, ry1);
				ctx.lineTo(ax1, ay1);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			} else if (this.arrowType === d2.Line.ARROW_RESONANCE) {
				let angle = this.p1.angle(this.p2);
				let perpendicular = angle + m.PI / 2;
				let retract = styles.shapes_arrowLength_2D * 2 / m.sqrt(3);
				let mcosa = m.cos(angle);
				let msina = m.sin(angle);
				let mcosp = m.cos(perpendicular);
				let msinp = m.sin(perpendicular);
				ctx.beginPath();
				ctx.moveTo(this.p1.x + mcosa * retract / 2, this.p1.y - msina * retract / 2);
				ctx.lineTo(this.p2.x - mcosa * retract / 2, this.p2.y + msina * retract / 2);
				ctx.stroke();
				// right arrow
				let rx1 = this.p2.x - mcosa * retract * .8;
				let ry1 = this.p2.y + msina * retract * .8;
				let ax1 = this.p2.x + mcosp * styles.shapes_arrowLength_2D / 3 - mcosa * retract;
				let ay1 = this.p2.y - msinp * styles.shapes_arrowLength_2D / 3 + msina * retract;
				let ax2 = this.p2.x - mcosp * styles.shapes_arrowLength_2D / 3 - mcosa * retract;
				let ay2 = this.p2.y + msinp * styles.shapes_arrowLength_2D / 3 + msina * retract;
				ctx.beginPath();
				ctx.moveTo(this.p2.x, this.p2.y);
				ctx.lineTo(ax2, ay2);
				ctx.lineTo(rx1, ry1);
				ctx.lineTo(ax1, ay1);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
				// left arrow
				rx1 = this.p1.x + mcosa * retract * .8;
				ry1 = this.p1.y - msina * retract * .8;
				ax1 = this.p1.x - mcosp * styles.shapes_arrowLength_2D / 3 + mcosa * retract;
				ay1 = this.p1.y + msinp * styles.shapes_arrowLength_2D / 3 - msina * retract;
				ax2 = this.p1.x + mcosp * styles.shapes_arrowLength_2D / 3 + mcosa * retract;
				ay2 = this.p1.y - msinp * styles.shapes_arrowLength_2D / 3 - msina * retract;
				ctx.beginPath();
				ctx.moveTo(this.p1.x, this.p1.y);
				ctx.lineTo(ax2, ay2);
				ctx.lineTo(rx1, ry1);
				ctx.lineTo(ax1, ay1);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			} else {
				ctx.beginPath();
				ctx.moveTo(this.p1.x, this.p1.y);
				ctx.lineTo(this.p2.x, this.p2.y);
				ctx.stroke();
			}
			if(this.topText || this.bottomText){
				ctx.font = extensions.getFontString(styles.text_font_size, styles.text_font_families, styles.text_font_bold, styles.text_font_italic);
				ctx.fillStyle = styles.text_color;
			}
			if(this.topText){
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
				ctx.fillText(this.topText, (this.p1.x+this.p2.x)/2, this.p1.y-5);
			}
			if(this.bottomText){
				ctx.textAlign = 'center';
				ctx.textBaseline = 'top';
				ctx.fillText(this.bottomText, (this.p1.x+this.p2.x)/2, this.p1.y+5);
			}
		}
	};
	_.getPoints = function() {
		return [ this.p1, this.p2 ];
	};
	_.isOver = function(p, barrier) {
		let dist = math.distanceFromPointToLineInclusive(p, this.p1, this.p2);
		return dist !== -1 && dist < barrier;
	};

})(ChemDoodle.extensions, ChemDoodle.math, ChemDoodle.structures, ChemDoodle.structures.d2, Math);

(function(math, jsb, structures, d2, m, undefined) {
	'use strict';
	let getPossibleAngles = function(o) {
		let as = [];
		if (o instanceof structures.Atom) {
			if (o.bondNumber === 0) {
				as.push(m.PI);
			} else if (o.angles) {
				if (o.angles.length === 1) {
					as.push(o.angles[0] + m.PI);
				} else {
					for ( let i = 1, ii = o.angles.length; i < ii; i++) {
						as.push(o.angles[i - 1] + (o.angles[i] - o.angles[i - 1]) / 2);
					}
					let firstIncreased = o.angles[0] + m.PI * 2;
					let last = o.angles[o.angles.length - 1];
					as.push(last + (firstIncreased - last) / 2);
				}
				if (o.largestAngle > m.PI) {
					// always use angle of least interfearence if it is greater
					// than 120
					as = [ o.angleOfLeastInterference ];
				}
				if (o.bonds) {
					// point up towards a carbonyl
					for ( let i = 0, ii = o.bonds.length; i < ii; i++) {
						let b = o.bonds[i];
						if (b.bondOrder === 2) {
							let n = b.getNeighbor(o);
							if (n.label === 'O') {
								as = [ n.angle(o) ];
								break;
							}
						}
					}
				}
			}
		} else {
			let angle = o.a1.angle(o.a2);
			as.push(angle + m.PI / 2);
			as.push(angle + 3 * m.PI / 2);
		}
		for ( let i = 0, ii = as.length; i < ii; i++) {
			while (as[i] > m.PI * 2) {
				as[i] -= m.PI * 2;
			}
			while (as[i] < 0) {
				as[i] += m.PI * 2;
			}
		}
		return as;
	};
	let getPullBack = function(o, styles) {
		let pullback = 3;
		if (o instanceof structures.Atom) {
			if (o.isLabelVisible(styles)) {
				pullback = 8;
			}
			if (o.charge !== 0 || o.numRadical !== 0 || o.numLonePair !== 0) {
				pullback = 13;
			}
		} else if (o instanceof structures.Point) {
			// this is the midpoint of a bond forming pusher
			pullback = 0;
		} else {
			if (o.bondOrder > 1) {
				pullback = 5;
			}
		}
		return pullback;
	};
	let drawPusher = function(ctx, styles, o1, o2, p1, c1, c2, p2, numElectron, caches) {
		let angle1 = c1.angle(p1);
		let angle2 = c2.angle(p2);
		let mcosa = m.cos(angle1);
		let msina = m.sin(angle1);
		// pull back from start
		let pullBack = getPullBack(o1, styles);
		p1.x -= mcosa * pullBack;
		p1.y += msina * pullBack;
		// arrow
		let perpendicular = angle2 + m.PI / 2;
		let retract = styles.shapes_arrowLength_2D * 2 / m.sqrt(3);
		mcosa = m.cos(angle2);
		msina = m.sin(angle2);
		let mcosp = m.cos(perpendicular);
		let msinp = m.sin(perpendicular);
		p2.x -= mcosa * 5;
		p2.y += msina * 5;
		let nap = new structures.Point(p2.x, p2.y);
		// pull back from end
		pullBack = getPullBack(o2, styles) / 3;
		nap.x -= mcosa * pullBack;
		nap.y += msina * pullBack;
		p2.x -= mcosa * (retract * 0.8 + pullBack);
		p2.y += msina * (retract * 0.8 + pullBack);
		let rx1 = nap.x - mcosa * retract * 0.8;
		let ry1 = nap.y + msina * retract * 0.8;
		let a1 = new structures.Point(nap.x + mcosp * styles.shapes_arrowLength_2D / 3 - mcosa * retract, nap.y - msinp * styles.shapes_arrowLength_2D / 3 + msina * retract);
		let a2 = new structures.Point(nap.x - mcosp * styles.shapes_arrowLength_2D / 3 - mcosa * retract, nap.y + msinp * styles.shapes_arrowLength_2D / 3 + msina * retract);
		let include1 = true, include2 = true;
		if (numElectron === 1) {
			if (a1.distance(c1) > a2.distance(c1)) {
				include2 = false;
			} else {
				include1 = false;
			}
		}
		ctx.beginPath();
		ctx.moveTo(nap.x, nap.y);
		if (include2) {
			ctx.lineTo(a2.x, a2.y);
		}
		ctx.lineTo(rx1, ry1);
		if (include1) {
			ctx.lineTo(a1.x, a1.y);
		}
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		// bezier
		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
		ctx.stroke();
		caches.push([ p1, c1, c2, p2 ]);
	};

	d2.Pusher = function(o1, o2, numElectron) {
		this.o1 = o1;
		this.o2 = o2;
		this.numElectron = numElectron ? numElectron : 1;
	};
	let _ = d2.Pusher.prototype = new d2._Shape();
	_.drawDecorations = function(ctx, styles) {
		if (this.isHover) {
			let p1 = this.o1 instanceof structures.Atom ? new structures.Point(this.o1.x, this.o1.y) : this.o1.getCenter();
			let p2 = this.o2 instanceof structures.Atom ? new structures.Point(this.o2.x, this.o2.y) : this.o2.getCenter();
			let ps = [ p1, p2 ];
			for ( let i = 0, ii = ps.length; i < ii; i++) {
				let p = ps[i];
				this.drawAnchor(ctx, styles, p, p === this.hoverPoint);
			}
		}
	};
	_.draw = function(ctx, styles) {
		if (this.o1 && this.o2) {
			ctx.strokeStyle = styles.shapes_color;
			ctx.fillStyle = styles.shapes_color;
			ctx.lineWidth = styles.shapes_lineWidth;
			ctx.lineJoin = 'miter';
			ctx.lineCap = 'butt';
			let p1 = this.o1 instanceof structures.Atom ? new structures.Point(this.o1.x, this.o1.y) : this.o1.getCenter();
			let p2 = this.o2 instanceof structures.Atom ? new structures.Point(this.o2.x, this.o2.y) : this.o2.getCenter();
			let controlDist = 35;
			let as1 = getPossibleAngles(this.o1);
			let as2 = getPossibleAngles(this.o2);
			let c1, c2;
			let minDif = Infinity;
			for ( let i = 0, ii = as1.length; i < ii; i++) {
				for ( let j = 0, jj = as2.length; j < jj; j++) {
					let c1c = new structures.Point(p1.x + controlDist * m.cos(as1[i]), p1.y - controlDist * m.sin(as1[i]));
					let c2c = new structures.Point(p2.x + controlDist * m.cos(as2[j]), p2.y - controlDist * m.sin(as2[j]));
					let dif = c1c.distance(c2c);
					if (dif < minDif) {
						minDif = dif;
						c1 = c1c;
						c2 = c2c;
					}
				}
			}
			this.caches = [];
			if (this.numElectron === -1) {
				let dist = p1.distance(p2)/2;
				let angle = p1.angle(p2);
				let perp = angle+m.PI/2;
				let mcosa = m.cos(angle);
				let msina = m.sin(angle);
				let m1 = new structures.Point(p1.x+(dist-1)*mcosa, p1.y-(dist-1)*msina);
				let cm1 = new structures.Point(m1.x+m.cos(perp+m.PI/6)*controlDist, m1.y - m.sin(perp+m.PI/6)*controlDist);
				let m2 = new structures.Point(p1.x+(dist+1)*mcosa, p1.y-(dist+1)*msina);
				let cm2 = new structures.Point(m2.x+m.cos(perp-m.PI/6)*controlDist, m2.y - m.sin(perp-m.PI/6)*controlDist);
				drawPusher(ctx, styles, this.o1, m1, p1, c1, cm1, m1, 1, this.caches);
				drawPusher(ctx, styles, this.o2, m2, p2, c2, cm2, m2, 1, this.caches);
			} else {
				if (math.intersectLines(p1.x, p1.y, c1.x, c1.y, p2.x, p2.y, c2.x, c2.y)) {
					let tmp = c1;
					c1 = c2;
					c2 = tmp;
				}
				// try to clean up problems, like loops
				let angle1 = c1.angle(p1);
				let angle2 = c2.angle(p2);
				let angleDif = (m.max(angle1, angle2) - m.min(angle1, angle2));
				if (m.abs(angleDif - m.PI) < .001 && this.o1.molCenter === this.o2.molCenter) {
					// in the case where the control tangents are parallel
					angle1 += m.PI / 2;
					angle2 -= m.PI / 2;
					c1.x = p1.x + controlDist * m.cos(angle1 + m.PI);
					c1.y = p1.y - controlDist * m.sin(angle1 + m.PI);
					c2.x = p2.x + controlDist * m.cos(angle2 + m.PI);
					c2.y = p2.y - controlDist * m.sin(angle2 + m.PI);
				}
				drawPusher(ctx, styles, this.o1, this.o2, p1, c1, c2, p2, this.numElectron, this.caches);
			}
		}
	};
	_.getPoints = function() {
		return [];
	};
	_.isOver = function(p, barrier) {
		for ( let i = 0, ii = this.caches.length; i < ii; i++) {
			let r = jsb.distanceFromCurve(p, this.caches[i]);
			if (r.distance < barrier) {
				return true;
			}
		}
		return false;
	};

})(ChemDoodle.math, ChemDoodle.lib.jsBezier, ChemDoodle.structures, ChemDoodle.structures.d2, Math);

(function(math, structures, d2, m, undefined) {
	'use strict';
	
	let BOND = new structures.Bond();
	
	d2.VAP = function(x, y) {
		this.asterisk = new structures.Atom('O', x, y);
		this.substituent;
		this.bondType = 1;
		this.attachments = [];
	};
	let _ = d2.VAP.prototype = new d2._Shape();
	_.drawDecorations = function(ctx, styles) {
		if (this.isHover || this.isSelected) {
			ctx.strokeStyle = this.isHover ? styles.colorHover : styles.colorSelect;
			ctx.lineWidth = 1.2;
			let radius = 7;
			if(this.hoverBond){
				let pi2 = 2 * m.PI;
				let angle = (this.asterisk.angleForStupidCanvasArcs(this.hoverBond) + m.PI / 2) % pi2;
				ctx.strokeStyle = this.isHover ? styles.colorHover : styles.colorSelect;
				ctx.beginPath();
				let angleTo = (angle + m.PI) % pi2;
				angleTo = angleTo % (m.PI * 2);
				ctx.arc(this.asterisk.x, this.asterisk.y, radius, angle, angleTo, false);
				ctx.stroke();
				ctx.beginPath();
				angle += m.PI;
				angleTo = (angle + m.PI) % pi2;
				ctx.arc(this.hoverBond.x, this.hoverBond.y, radius, angle, angleTo, false);
				ctx.stroke();
			}else{
				ctx.beginPath();
				ctx.arc(this.asterisk.x, this.asterisk.y, radius, 0, m.PI * 2, false);
				ctx.stroke();
			}
		}
	};
	_.draw = function(ctx, styles) {
		// asterisk
		ctx.strokeStyle = this.error?styles.colorError:styles.shapes_color;
		ctx.lineWidth = 1;
		let length = 4;
		let sqrt3 = m.sqrt(3)/2;
		ctx.beginPath();
		ctx.moveTo(this.asterisk.x, this.asterisk.y-length);
		ctx.lineTo(this.asterisk.x, this.asterisk.y+length);
		ctx.moveTo(this.asterisk.x-sqrt3*length, this.asterisk.y-length/2);
		ctx.lineTo(this.asterisk.x+sqrt3*length, this.asterisk.y+length/2);
		ctx.moveTo(this.asterisk.x-sqrt3*length, this.asterisk.y+length/2);
		ctx.lineTo(this.asterisk.x+sqrt3*length, this.asterisk.y-length/2);
		ctx.stroke();
		this.asterisk.textBounds = [];
		this.asterisk.textBounds.push({
			x : this.asterisk.x - length,
			y : this.asterisk.y - length,
			w : length*2,
			h : length*2
		});
		let bcsave = styles.bonds_color;
		if(this.error){
			styles.bonds_color = styles.colorError;
		}
		BOND.a1 = this.asterisk;
		// substituent bond
		if(this.substituent){
			BOND.a2 = this.substituent;
			BOND.bondOrder = this.bondType;
			BOND.draw(ctx, styles);
		}
		// attachment bonds
		BOND.bondOrder = 0;
		if(!this.error){
			styles.bonds_color = styles.shapes_color;
		}
		for(let i = 0, ii = this.attachments.length; i<ii; i++){
			BOND.a2 = this.attachments[i];
			BOND.draw(ctx, styles);
		}
		styles.bonds_color = bcsave;
	};
	_.getPoints = function() {
		return [this.asterisk];
	};
	_.isOver = function(p, barrier) {
		return false;
	};

})(ChemDoodle.math, ChemDoodle.structures, ChemDoodle.structures.d2, Math);

(function(d3, m, undefined) {
	'use strict';
	d3._Mesh = function() {
	};
	let _ = d3._Mesh.prototype;
	_.storeData = function(positionData, normalData, indexData) {
		this.positionData = positionData;
		this.normalData = normalData;
		this.indexData = indexData;
	};
	_.setupBuffers = function(gl) {
		this.vertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positionData), gl.STATIC_DRAW);
		this.vertexPositionBuffer.itemSize = 3;
		this.vertexPositionBuffer.numItems = this.positionData.length / 3;

		this.vertexNormalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalData), gl.STATIC_DRAW);
		this.vertexNormalBuffer.itemSize = 3;
		this.vertexNormalBuffer.numItems = this.normalData.length / 3;

		if (this.indexData) {
			this.vertexIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexData), gl.STATIC_DRAW);
			this.vertexIndexBuffer.itemSize = 1;
			this.vertexIndexBuffer.numItems = this.indexData.length;
		}

		if (this.partitions) {
			for ( let i = 0, ii = this.partitions.length; i < ii; i++) {
				let p = this.partitions[i];
				let buffers = this.generateBuffers(gl, p.positionData, p.normalData, p.indexData);
				p.vertexPositionBuffer = buffers[0];
				p.vertexNormalBuffer = buffers[1];
				p.vertexIndexBuffer = buffers[2];
			}
		}
	};
	_.generateBuffers = function(gl, positionData, normalData, indexData) {
		let vertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), gl.STATIC_DRAW);
		vertexPositionBuffer.itemSize = 3;
		vertexPositionBuffer.numItems = positionData.length / 3;

		let vertexNormalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
		vertexNormalBuffer.itemSize = 3;
		vertexNormalBuffer.numItems = normalData.length / 3;

		let vertexIndexBuffer;
		if (indexData) {
			vertexIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
			vertexIndexBuffer.itemSize = 1;
			vertexIndexBuffer.numItems = indexData.length;
		}

		return [ vertexPositionBuffer, vertexNormalBuffer, vertexIndexBuffer ];
	};
	_.bindBuffers = function(gl) {
		if (!this.vertexPositionBuffer) {
			this.setupBuffers(gl);
		}
		// positions
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		gl.vertexAttribPointer(gl.shader.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		// normals
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
		gl.vertexAttribPointer(gl.shader.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		if (this.vertexIndexBuffer) {
			// indexes
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		}
	};

})(ChemDoodle.structures.d3, Math);

(function(d3, undefined) {
	'use strict';
	d3._Measurement = function() {
	};
	let _ = d3._Measurement.prototype = new d3._Mesh();
	_.render = function(gl, styles) {
		gl.shader.setMatrixUniforms(gl);
		// setting the vertex position buffer to undefined resets the buffers, so this shape can be dynamically updated with the molecule
		if(styles.measurement_update_3D){
			this.vertexPositionBuffer = undefined;
			this.text = undefined;
		}
		if(!this.vertexPositionBuffer){
			this.calculateData(styles);
		}
		this.bindBuffers(gl);
		// colors
		gl.material.setDiffuseColor(gl, styles.shapes_color);
		gl.lineWidth(styles.shapes_lineWidth);
		// render
		gl.drawElements(gl.LINES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	};
	_.renderText = function(gl, styles) {
		gl.shader.setMatrixUniforms(gl);
		// render the text
		if(!this.text){
			this.text = this.getText(styles);
		}
		
		let vertexData = {
			position : [],
			texCoord : [],
			translation : []
		};

		gl.textImage.pushVertexData(this.text.value, this.text.pos, 1, vertexData);
		gl.textMesh.storeData(gl, vertexData.position, vertexData.texCoord, vertexData.translation);
		
		gl.textImage.useTexture(gl);
		gl.textMesh.render(gl);
	};

})(ChemDoodle.structures.d3);

(function(ELEMENT, extensions, d3, math, m, m4, v3, undefined) {
	'use strict';
	d3.Angle = function(a1, a2, a3) {
		this.a1 = a1;
		this.a2 = a2;
		this.a3 = a3;
	};
	let _ = d3.Angle.prototype = new d3._Measurement();
	_.calculateData = function(styles) {
		let positionData = [];
		let normalData = [];
		let indexData = [];
		let dist1 = this.a2.distance3D(this.a1);
		let dist2 = this.a2.distance3D(this.a3);
		this.distUse = m.min(dist1, dist2) / 2;
		// data for the angle
		this.vec1 = v3.normalize([ this.a1.x - this.a2.x, this.a1.y - this.a2.y, this.a1.z - this.a2.z ]);
		this.vec2 = v3.normalize([ this.a3.x - this.a2.x, this.a3.y - this.a2.y, this.a3.z - this.a2.z ]);
		this.angle = extensions.vec3AngleFrom(this.vec1, this.vec2);

		let axis = v3.normalize(v3.cross(this.vec1, this.vec2, []));
		let vec3 = v3.normalize(v3.cross(axis, this.vec1, []));

		let bands = styles.measurement_angleBands_3D;
		for ( let i = 0; i <= bands; ++i) {
			let theta = this.angle * i / bands;
			let vecCos = v3.scale(this.vec1, m.cos(theta), []);
			let vecSin = v3.scale(vec3, m.sin(theta), []);
			let norm = v3.scale(v3.normalize(v3.add(vecCos, vecSin, [])), this.distUse);

			positionData.push(this.a2.x + norm[0], this.a2.y + norm[1], this.a2.z + norm[2]);
			normalData.push(0, 0, 0);
			if (i < bands) {
				indexData.push(i, i + 1);
			}
		}

		this.storeData(positionData, normalData, indexData);
	};
	_.getText = function(styles) {
		let vecCenter = v3.scale(v3.normalize(v3.add(this.vec1, this.vec2, [])), this.distUse + 0.3);
		return {
			pos : [ this.a2.x + vecCenter[0], this.a2.y + vecCenter[1], this.a2.z + vecCenter[2] ],
			value : [ math.angleBounds(this.angle, true).toFixed(2), ' \u00b0' ].join('')
		};
	};

})(ChemDoodle.ELEMENT, ChemDoodle.extensions, ChemDoodle.structures.d3, ChemDoodle.math, Math, ChemDoodle.lib.mat4, ChemDoodle.lib.vec3);

(function(d3, m, undefined) {
	'use strict';
	d3.Arrow = function(radius, longitudeBands) {
		let positionData = [];
		let normalData = [];

		for ( let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
			let theta = longNumber * 2 * m.PI / longitudeBands;
			let sinTheta = m.sin(theta);
			let cosTheta = m.cos(theta);

			let x = cosTheta;
			let y = sinTheta;

			normalData.push(
			// base cylinder
			0, 0, -1, 0, 0, -1,
			// cylinder
			x, y, 0, x, y, 0,
			// base cone
			0, 0, -1, 0, 0, -1,
			// cone
			x, y, 1, x, y, 1);

			positionData.push(
			// base cylinder
			0, 0, 0, radius * x, radius * y, 0,
			// cylinder
			radius * x, radius * y, 0, radius * x, radius * y, 2,
			// base cone
			radius * x, radius * y, 2, radius * x * 2, radius * y * 2, 2,
			// cone
			radius * x * 2, radius * y * 2, 2, 0, 0, 3);
		}

		let indexData = [];
		for ( let i = 0; i < longitudeBands; i++) {
			let offset = i * 8;
			for ( let j = 0, jj = 7; j < jj; j++) {
				let first = j + offset;
				let second = first + 1;
				let third = first + jj + 2;
				let forth = third - 1;
				indexData.push(first, third, second, third, first, forth);
			}
		}

		this.storeData(positionData, normalData, indexData);
	};
	d3.Arrow.prototype = new d3._Mesh();

})(ChemDoodle.structures.d3, Math);

(function(d3, m, undefined) {
	// this mesh seems to be inverted, used to make the PipePlank model, there the matrix is inverted to correct this...
	'use strict';
	d3.Box = function(width, height, depth) {
		width /= 2;
		depth /= 2;

		let positionData = [];
		let normalData = [];

		// top
		positionData.push(width, height, -depth);
		positionData.push(width, height, -depth);
		positionData.push(-width, height, -depth);
		positionData.push(width, height, depth);
		positionData.push(-width, height, depth);
		positionData.push(-width, height, depth);
		for(let i = 6; i--; normalData.push(0 , 1, 0));

		// front
		positionData.push(-width, height, depth);
		positionData.push(-width, height, depth);
		positionData.push(-width, 0, depth);
		positionData.push(width, height, depth);
		positionData.push(width, 0, depth);
		positionData.push(width, 0, depth);
		for(let i = 6; i--; normalData.push(0 , 0, 1));

		// right
		positionData.push(width, height, depth);
		positionData.push(width, height, depth);
		positionData.push(width, 0, depth);
		positionData.push(width, height, -depth);
		positionData.push(width, 0, -depth);
		positionData.push(width, 0, -depth);
		for(let i = 6; i--; normalData.push(1 , 0, 0));

		// back
		positionData.push(width, height, -depth);
		positionData.push(width, height, -depth);
		positionData.push(width, 0, -depth);
		positionData.push(-width, height, -depth);
		positionData.push(-width, 0, -depth);
		positionData.push(-width, 0, -depth);
		for(let i = 6; i--; normalData.push(0 , 0, -1));

		// left
		positionData.push(-width, height, -depth);
		positionData.push(-width, height, -depth);
		positionData.push(-width, 0, -depth);
		positionData.push(-width, height, depth);
		positionData.push(-width, 0, depth);
		positionData.push(-width, 0, depth);
		for(let i = 6; i--; normalData.push(-1 , 0, 0));

		// bottom
		positionData.push(-width, 0, depth);
		positionData.push(-width, 0, depth);
		positionData.push(-width, 0, -depth);
		positionData.push(width, 0, depth);
		positionData.push(width, 0, -depth);
		positionData.push(width, 0, -depth);
		for(let i = 6; i--; normalData.push(0 , -1, 0));

		this.storeData(positionData, normalData);
	};
	d3.Box.prototype = new d3._Mesh();

})(ChemDoodle.structures.d3, Math);

(function(math, d3, v3, m4, m, undefined) {
	'use strict';
	d3.Camera = function() {
		this.fieldOfView = 45;
		this.aspect = 1;
		this.near = 0.1;
		this.far = 10000;
		this.zoom = 1;
		this.viewMatrix = m4.identity([]);
		this.projectionMatrix = m4.identity([]);
	};
	let _ = d3.Camera.prototype;
	_.perspectiveProjectionMatrix = function() {
        let top = m.tan(this.fieldOfView / 360 * m.PI) * this.near * this.zoom;
        let right = this.aspect * top;
        return m4.frustum(-right, right, -top, top, this.near, this.far, this.projectionMatrix);
	};
	_.orthogonalProjectionMatrix = function() {
        let top = m.tan(this.fieldOfView / 360 * m.PI) * ((this.far - this.near) / 2 + this.near) * this.zoom;
        let right = this.aspect * top;
        return m4.ortho(-right, right, -top, top, this.near, this.far, this.projectionMatrix);
	};
	_.updateProjectionMatrix = function(isPerspective) {
		return isPerspective ? this.perspectiveProjectionMatrix() : this.orthogonalProjectionMatrix();
	};
	_.focalLength = function() {
		return (this.far - this.near) / 2 + this.near;
	};
    _.zoomOut = function() {
        this.zoom = m.min(this.zoom * 1.25, 200);
    };
    _.zoomIn = function() {
        this.zoom = m.max(this.zoom / 1.25, 1 / 400);
    };

})(ChemDoodle.math, ChemDoodle.structures.d3, ChemDoodle.lib.vec3, ChemDoodle.lib.mat4, window.Math);

(function(d3, m, m4, undefined) {
	'use strict';
	d3.LineArrow = function() {
		let d = 2.8;
		let w = 0.1;

		this.storeData([
				0, 0, -3, w, 0, -d,
				0, 0, -3, -w, 0, -d,

				0, 0, -3, 0, 0, 3,

				0, 0, 3, w, 0, d,
				0, 0, 3, -w, 0, d
			],
			[
				0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0
			]);
	};
	d3.LineArrow.prototype = new d3._Mesh();
	
	d3.Compass = function(gl, styles) {

		// setup text X Y Z
		this.textImage = new d3.TextImage();
		this.textImage.init(gl);
		this.textImage.updateFont(gl, styles.text_font_size, styles.text_font_families, styles.text_font_bold, styles.text_font_italic, styles.text_font_stroke_3D);

		this.textMesh = new d3.TextMesh();
		this.textMesh.init(gl);

		let screenRatioHeight = styles.compass_size_3D / gl.canvas.clientHeight;

		let height = 3 / screenRatioHeight;
		let tanTheta = m.tan(styles.projectionPerspectiveVerticalFieldOfView_3D / 360 * m.PI);
		let depth = height / tanTheta;
		let near = m.max(depth - height, 0.1);
		let far = depth + height;

		let aspec = gl.canvas.clientWidth / gl.canvas.clientHeight;

		let fnProjection, z;

		if (styles.projectionPerspective_3D) {
			z = near;
			fnProjection = m4.frustum;
		} else {
			z = depth;
			fnProjection = m4.ortho;
		}

		let nearRatio = z / gl.canvas.clientHeight * 2 * tanTheta;
		let top = tanTheta * z;
		let bottom = -top;
		let left = aspec * bottom;
		let right = aspec * top;

		if(styles.compass_type_3D === 0) {
			let deltaX = -(gl.canvas.clientWidth - styles.compass_size_3D) / 2 + this.textImage.charHeight;
			let deltaY = -(gl.canvas.clientHeight - styles.compass_size_3D) / 2 + this.textImage.charHeight;

			let x = deltaX * nearRatio;
			let y = deltaY * nearRatio;

			left -= x;
			right -= x;
			bottom -= y;
			top -= y;
		}

		this.projectionMatrix = fnProjection(left, right, bottom, top, near, far);
		this.translationMatrix = m4.translate(m4.identity([]), [ 0, 0, -depth ]);

		// vertex data for X Y Z text label
		let vertexData = {
			position : [],
			texCoord : [],
			translation : []
		};

		// it need to auto calculated somehow
		let textPos = 3.5;

		this.textImage.pushVertexData('X', [ textPos, 0, 0 ], 0, vertexData);
		this.textImage.pushVertexData('Y', [ 0, textPos, 0 ], 0, vertexData);
		this.textImage.pushVertexData('Z', [ 0, 0, textPos ], 0, vertexData);

		this.textMesh.storeData(gl, vertexData.position, vertexData.texCoord, vertexData.translation);
	};

	let _ = d3.Compass.prototype;
	_.renderArrow = function(gl, type, color, mvMatrix) {
		gl.material.setDiffuseColor(gl, color);
		gl.shader.setModelViewMatrix(gl, mvMatrix);
		if(type === 1) {
			gl.drawArrays(gl.LINES, 0, gl.lineArrowBuffer.vertexPositionBuffer.numItems);
		} else {
			gl.drawElements(gl.TRIANGLES, gl.arrowBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	};
	_.render = function(gl, styles) {
		gl.shader.setProjectionMatrix(gl, this.projectionMatrix);
		styles.compass_type_3D === 1 ? gl.lineArrowBuffer.bindBuffers(gl) : gl.arrowBuffer.bindBuffers(gl);

		gl.material.setTempColors(gl, styles.bonds_materialAmbientColor_3D, undefined, styles.bonds_materialSpecularColor_3D, styles.bonds_materialShininess_3D);

		let modelMatrix = m4.multiply(this.translationMatrix, gl.rotationMatrix, []);
		let angle = m.PI / 2;

		// x - axis
		this.renderArrow(gl, styles.compass_type_3D, styles.compass_axisXColor_3D, m4.rotateY(modelMatrix, angle, []));

		// y - axis
		this.renderArrow(gl, styles.compass_type_3D, styles.compass_axisYColor_3D, m4.rotateX(modelMatrix, -angle, []));

		// z - axis
		this.renderArrow(gl, styles.compass_type_3D, styles.compass_axisZColor_3D, modelMatrix);
	};
	_.renderAxis = function(gl) {
		gl.shader.setProjectionMatrix(gl, this.projectionMatrix);
		let mvMatrix = m4.multiply(this.translationMatrix, gl.rotationMatrix, []);
		gl.shader.setModelViewMatrix(gl, mvMatrix);

		this.textImage.useTexture(gl);
		this.textMesh.render(gl);
	};

})(ChemDoodle.structures.d3, Math, ChemDoodle.lib.mat4);

(function(d3, m, undefined) {
	'use strict';
	d3.Cylinder = function(radius, height, bands, closed) {
		let positionData = [];
		let normalData = [];

		if (closed) {
			for (let i = 0; i <= bands; i++) {
				let theta = i % bands * 2 * m.PI / bands;
				let cosTheta = m.cos(theta);
				let sinTheta = m.sin(theta);

				normalData.push(0, -1, 0);
				positionData.push(0, 0, 0);
				normalData.push(0, -1, 0);
				positionData.push(radius * cosTheta, 0, radius * sinTheta);

			}

			for (let i = 0; i <= bands; i++) {
				let theta = i % bands * 2 * m.PI / bands;
				let cosTheta = m.cos(theta);
				let sinTheta = m.sin(theta);

				normalData.push(cosTheta, 0, sinTheta);
				positionData.push(radius * cosTheta, 0, radius * sinTheta);

				normalData.push(cosTheta, 0, sinTheta);
				positionData.push(radius * cosTheta, height, radius * sinTheta);
			}

			for (let i = 0; i <= bands; i++) {
				let theta = i % bands * 2 * m.PI / bands;
				let cosTheta = m.cos(theta);
				let sinTheta = m.sin(theta);

				normalData.push(0, 1, 0);
				positionData.push(radius * cosTheta, height, radius * sinTheta);

				normalData.push(0, 1, 0);
				positionData.push(0, height, 0);
			}
		} else {
			for (let i = 0; i < bands; i++) {
				let theta = i * 2 * m.PI / bands;
				let cosTheta = m.cos(theta);
				let sinTheta = m.sin(theta);
				normalData.push(cosTheta, 0, sinTheta);
				positionData.push(radius * cosTheta, 0, radius * sinTheta);
				normalData.push(cosTheta, 0, sinTheta);
				positionData.push(radius * cosTheta, height, radius * sinTheta);
			}
			normalData.push(1, 0, 0);
			positionData.push(radius, 0, 0);
			normalData.push(1, 0, 0);
			positionData.push(radius, height, 0);
		}

		this.storeData(positionData, normalData);
	};
	d3.Cylinder.prototype = new d3._Mesh();

})(ChemDoodle.structures.d3, Math);

(function(ELEMENT, d3, m, v3, undefined) {
	'use strict';
	d3.Distance = function(a1, a2, node, offset) {
		this.a1 = a1;
		this.a2 = a2;
		this.node = node;
		this.offset = offset ? offset : 0;
	};
	let _ = d3.Distance.prototype = new d3._Measurement();
	_.calculateData = function(styles) {
		let positionData = [ this.a1.x, this.a1.y, this.a1.z, this.a2.x, this.a2.y, this.a2.z ];
		if (this.node) {
			let r1 = styles.atoms_useVDWDiameters_3D ? ELEMENT[this.a1.label].vdWRadius * styles.atoms_vdwMultiplier_3D : styles.atoms_sphereDiameter_3D / 2;
			let r2 = styles.atoms_useVDWDiameters_3D ? ELEMENT[this.a2.label].vdWRadius * styles.atoms_vdwMultiplier_3D : styles.atoms_sphereDiameter_3D / 2;
			this.move = this.offset + m.max(r1, r2);
			this.displacement = [ (this.a1.x + this.a2.x) / 2 - this.node.x, (this.a1.y + this.a2.y) / 2 - this.node.y, (this.a1.z + this.a2.z) / 2 - this.node.z ];
			v3.normalize(this.displacement);
			let change = v3.scale(this.displacement, this.move, []);
			positionData[0] += change[0];
			positionData[1] += change[1];
			positionData[2] += change[2];
			positionData[3] += change[0];
			positionData[4] += change[1];
			positionData[5] += change[2];
		}
		let normalData = [ 0, 0, 0, 0, 0, 0 ];
		let indexData = [ 0, 1 ];
		this.storeData(positionData, normalData, indexData);
	};
	_.getText = function(styles) {
		let dist = this.a1.distance3D(this.a2);
		let center = [ (this.a1.x + this.a2.x) / 2, (this.a1.y + this.a2.y) / 2, (this.a1.z + this.a2.z) / 2 ];
		if (this.node) {
			let change = v3.scale(this.displacement, this.move+.1, []);
			center[0] += change[0];
			center[1] += change[1];
			center[2] += change[2];
		}
		return {
			pos : center,
			value : [ dist.toFixed(2), ' \u212b' ].join('')
		};
	};

})(ChemDoodle.ELEMENT, ChemDoodle.structures.d3, Math, ChemDoodle.lib.vec3);

(function(math, d3, v3, undefined) {
	'use strict';

	d3.Fog = function(color, fogStart, fogEnd, density) {
		this.fogScene(color, fogStart, fogEnd, density);
	};
	let _ = d3.Fog.prototype;
	_.fogScene = function(color, fogStart, fogEnd, density) {
		this.colorRGB = math.getRGB(color, 1);
		this.fogStart = fogStart;
		this.fogEnd = fogEnd;
		this.density = density;
	};
	
})(ChemDoodle.math, ChemDoodle.structures.d3, ChemDoodle.lib.vec3);

(function(ELEMENT, d3, undefined) {

	d3.Label = function(textImage) {
	};
	let _ = d3.Label.prototype;
	_.updateVerticesBuffer = function(gl, molecules, styles) {
		for ( let i = 0, ii = molecules.length; i < ii; i++) {
			let molecule = molecules[i];
			let moleculeLabel = molecule.labelMesh;
			let atoms = molecule.atoms;
			let vertexData = {
				position : [],
				texCoord : [],
				translation : []
			};

			let isMacro = atoms.length > 0 && atoms[0].hetatm != undefined;

			for ( let j = 0, jj = atoms.length; j < jj; j++) {
				let atom = atoms[j];
				
				let atomLabel = atom.label;
				let zDepth = 0.05;

				// Sphere or Ball and Stick
				if (styles.atoms_useVDWDiameters_3D) {
					let add = ELEMENT[atomLabel].vdWRadius * styles.atoms_vdwMultiplier_3D;
					if (add === 0) {
						add = 1;
					}
					zDepth += add;
				}
				// if Stick or Wireframe
				else if (styles.atoms_sphereDiameter_3D) {
					zDepth += styles.atoms_sphereDiameter_3D / 2 * 1.5;
				}

				if (isMacro) {
					if (!atom.hetatm) {
						if (!styles.macro_displayAtoms) {
							continue;
						}
					} else if (atom.isWater) {
						if (!styles.macro_showWaters) {
							continue;
						}
					}
				}
				
				gl.textImage.pushVertexData(atom.altLabel ? atom.altLabel : atom.label, [ atom.x, atom.y, atom.z ], zDepth, vertexData);

			}

			let chains = molecule.chains;

			if (chains && (styles.proteins_displayRibbon || styles.proteins_displayBackbone)) {

				for ( let j = 0, jj = chains.length; j < jj; j++) {
					let chain = chains[j];

					for ( let k = 0, kk = chain.length; k < kk; k++) {
						let residue = chain[k];

						if (residue.name) {
							let atom = residue.cp1;
							gl.textImage.pushVertexData(residue.name, [ atom.x, atom.y, atom.z ], 2, vertexData);
						}
					}
				}

			}

			moleculeLabel.storeData(gl, vertexData.position, vertexData.texCoord, vertexData.translation, vertexData.zDepth);
		}
	};
	_.render = function(gl, styles, molecules) {
		// use projection for shader text.
		gl.shader.setMatrixUniforms(gl);

		gl.textImage.useTexture(gl);
		for ( let i = 0, ii = molecules.length; i < ii; i++) {
			if (molecules[i].labelMesh) {
				molecules[i].labelMesh.render(gl);
			}
		}
	};

})(ChemDoodle.ELEMENT, ChemDoodle.structures.d3);

(function(d3, m, undefined) {
	'use strict';
	d3.Sphere = function(radius, latitudeBands, longitudeBands) {
		let positionData = [];
		let normalData = [];
		for ( let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
			let theta = latNumber * m.PI / latitudeBands;
			let sinTheta = m.sin(theta);
			let cosTheta = m.cos(theta);

			for ( let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
				let phi = longNumber * 2 * m.PI / longitudeBands;
				let sinPhi = m.sin(phi);
				let cosPhi = m.cos(phi);

				let x = cosPhi * sinTheta;
				let y = cosTheta;
				let z = sinPhi * sinTheta;

				normalData.push(x, y, z);
				positionData.push(radius * x, radius * y, radius * z);
			}
		}

		let indexData = [];
		longitudeBands += 1;
		for ( let latNumber = 0; latNumber < latitudeBands; latNumber++) {
			for ( let longNumber = 0; longNumber < longitudeBands; longNumber++) {
				let first = (latNumber * longitudeBands) + (longNumber % longitudeBands);
				let second = first + longitudeBands;
				indexData.push(first, first + 1, second);
				if (longNumber < longitudeBands - 1) {
					indexData.push(second, first + 1, second + 1);
				}
			}
		}

		this.storeData(positionData, normalData, indexData);
	};
	d3.Sphere.prototype = new d3._Mesh();

})(ChemDoodle.structures.d3, Math);

(function(RESIDUE, d3, m, v3, undefined) {
	'use strict';
	let loadPartition = function(gl, p) {
		// positions
		gl.bindBuffer(gl.ARRAY_BUFFER, p.vertexPositionBuffer);
		gl.vertexAttribPointer(gl.shader.vertexPositionAttribute, p.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		// normals
		gl.bindBuffer(gl.ARRAY_BUFFER, p.vertexNormalBuffer);
		gl.vertexAttribPointer(gl.shader.vertexNormalAttribute, p.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		// indexes
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.vertexIndexBuffer);
	};

	function SubRibbon(entire, name, indexes, pi) {
		this.entire = entire;
		this.name = name;
		this.indexes = indexes;
		this.pi = pi;
	}
	let _2 = SubRibbon.prototype;
	// NOTE: To use rainbow coloring for chains, it needs coloring each residue with total residue count
	// and current index residue in chain parameters.
	_2.getColor = function(styles) {
		if (styles.macro_colorByChain) {
			return this.entire.chainColor;
		} else if (this.name) {
			return this.getResidueColor(RESIDUE[this.name] ? this.name : '*', styles);
		} else if (this.helix) {
			return this.entire.front ? styles.proteins_ribbonCartoonHelixPrimaryColor : styles.proteins_ribbonCartoonHelixSecondaryColor;
		} else if (this.sheet) {
			return styles.proteins_ribbonCartoonSheetColor;
		} else {
			return this.entire.front ? styles.proteins_primaryColor : styles.proteins_secondaryColor;
		}
	};
	_2.getResidueColor = function(name, styles) {
		let r = RESIDUE[name];
		if (styles.proteins_residueColor === 'shapely') {
			return r.shapelyColor;
		} else if (styles.proteins_residueColor === 'amino') {
			return r.aminoColor;
		} else if (styles.proteins_residueColor === 'polarity') {
			if (r.polar) {
				return '#C10000';
			} else {
				return '#FFFFFF';
			}
		} else if (styles.proteins_residueColor === 'acidity') {
			if(r.acidity === 1){
				return '#0000FF';
			}else if(r.acidity === -1){
				return '#FF0000';
			}else if (r.polar) {
				return '#FFFFFF';
			} else {
				return '#773300';
			}
		}
		return '#FFFFFF';
	};
	_2.render = function(gl, styles, noColor) {
		if (this.entire.partitions && this.pi !== this.entire.partitions.lastRender) {
			loadPartition(gl, this.entire.partitions[this.pi]);
			this.entire.partitions.lastRender = this.pi;
		}
		if (!this.vertexIndexBuffer) {
			this.vertexIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexes), gl.STATIC_DRAW);
			this.vertexIndexBuffer.itemSize = 1;
			this.vertexIndexBuffer.numItems = this.indexes.length;
		}
		// indexes
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		// colors
		if (!noColor && styles.proteins_residueColor !== 'rainbow') {
			gl.material.setDiffuseColor(gl, this.getColor(styles));
		}
		// render
		gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	};

	d3.Ribbon = function(chain, offset, cartoon) {
		// ribbon meshes build front to back, not side to side, so keep this in
		// mind
		let lineSegmentNum = chain[0].lineSegments.length;
		let lineSegmentLength = chain[0].lineSegments[0].length;
		this.partitions = [];
		this.partitions.lastRender = 0;
		let currentPartition;
		this.front = offset > 0;
		// calculate vertex and normal points
		for ( let i = 0, ii = chain.length; i < ii; i++) {
			if (!currentPartition || currentPartition.positionData.length > 65000) {
				if (this.partitions.length > 0) {
					i--;
				}
				currentPartition = {
					count : 0,
					positionData : [],
					normalData : []
				};
				this.partitions.push(currentPartition);
			}
			let residue = chain[i];
			currentPartition.count++;
			for ( let j = 0; j < lineSegmentNum; j++) {
				let lineSegment = cartoon ? residue.lineSegmentsCartoon[j] : residue.lineSegments[j];
				let doSide1 = j === 0;
				let doSide2 = false;
				for ( let k = 0; k < lineSegmentLength; k++) {
					let a = lineSegment[k];
					// normals
					let abovei = i;
					let abovek = k + 1;
					if (i === chain.length - 1 && k === lineSegmentLength - 1) {
						abovek--;
					} else if (k === lineSegmentLength - 1) {
						abovei++;
						abovek = 0;
					}
					let above = cartoon ? chain[abovei].lineSegmentsCartoon[j][abovek] : chain[abovei].lineSegments[j][abovek];
					let negate = false;
					let nextj = j + 1;
					if (j === lineSegmentNum - 1) {
						nextj -= 2;
						negate = true;
					}
					let side = cartoon ? residue.lineSegmentsCartoon[nextj][k] : residue.lineSegments[nextj][k];
					let toAbove = [ above.x - a.x, above.y - a.y, above.z - a.z ];
					let toSide = [ side.x - a.x, side.y - a.y, side.z - a.z ];
					let normal = v3.cross(toAbove, toSide, []);
					// positions
					if (k === 0) {
						// tip
						v3.normalize(toAbove);
						v3.scale(toAbove, -1);
						currentPartition.normalData.push(toAbove[0], toAbove[1], toAbove[2]);
						currentPartition.positionData.push(a.x, a.y, a.z);
					}
					if (doSide1 || doSide2) {
						// sides
						v3.normalize(toSide);
						v3.scale(toSide, -1);
						currentPartition.normalData.push(toSide[0], toSide[1], toSide[2]);
						currentPartition.positionData.push(a.x, a.y, a.z);
						if (doSide1 && k === lineSegmentLength - 1) {
							doSide1 = false;
							k = -1;
						}
					} else {
						// center strips
						v3.normalize(normal);
						if (negate && !this.front || !negate && this.front) {
							v3.scale(normal, -1);
						}
						currentPartition.normalData.push(normal[0], normal[1], normal[2]);
						v3.scale(normal, m.abs(offset));
						currentPartition.positionData.push(a.x + normal[0], a.y + normal[1], a.z + normal[2]);
						if (j === lineSegmentNum - 1 && k === lineSegmentLength - 1) {
							doSide2 = true;
							k = -1;
						}
					}
					if (k === -1 || k === lineSegmentLength - 1) {
						// end
						v3.normalize(toAbove);
						currentPartition.normalData.push(toAbove[0], toAbove[1], toAbove[2]);
						currentPartition.positionData.push(a.x, a.y, a.z);
					}
				}
			}
		}
		
		// build mesh connectivity
		// add 2 to lineSegmentNum and lineSegmentLength to account for sides
		// and ends
		lineSegmentNum += 2;
		lineSegmentLength += 2;
		this.segments = [];
		this.partitionSegments = [];
		for ( let n = 0, nn = this.partitions.length; n < nn; n++) {
			let currentPartition = this.partitions[n];
			let partitionSegmentIndexData = [];
			let c = undefined;
			for ( let i = 0, ii = currentPartition.count - 1; i < ii; i++) {
				let chainIndex = i;
				for ( let j = 0; j < n; j++) {
					chainIndex += this.partitions[j].count - 1;
				}
				c = chain[chainIndex];
				let residueIndexStart = i * lineSegmentNum * lineSegmentLength;
				let individualIndexData = [];
				for ( let j = 0, jj = lineSegmentNum - 1; j < jj; j++) {
					let segmentIndexStart = residueIndexStart + j * lineSegmentLength;
					for ( let k = 0; k < lineSegmentLength-1; k++) {
						let nextRes = 1;
						if (i === ii) {
							nextRes = 0;
						}
						let add = [ segmentIndexStart + k, segmentIndexStart + lineSegmentLength + k, segmentIndexStart + lineSegmentLength + k + nextRes, segmentIndexStart + k, segmentIndexStart + k + nextRes, segmentIndexStart + lineSegmentLength + k + nextRes ];
						if (k !== lineSegmentLength - 1) {
							if (this.front) {
								individualIndexData.push(add[0], add[1], add[2], add[3], add[5], add[4]);
							} else {
								individualIndexData.push(add[0], add[2], add[1], add[3], add[4], add[5]);
							}
						}
						if (k === lineSegmentLength - 2 && !(i === currentPartition.count - 2 && n === this.partitions.length - 1)) {
							// jump the gap, the other mesh points will be
							// covered,
							// so no need to explicitly skip them
							let jump = lineSegmentNum * lineSegmentLength - k;
							add[2] += jump;
							add[4] += jump;
							add[5] += jump;
						}
						if (this.front) {
							partitionSegmentIndexData.push(add[0], add[1], add[2], add[3], add[5], add[4]);
						} else {
							partitionSegmentIndexData.push(add[0], add[2], add[1], add[3], add[4], add[5]);
						}
					}
				}

				if (cartoon && c.split) {
					let sr = new SubRibbon(this, undefined, partitionSegmentIndexData, n);
					sr.helix = c.helix;
					sr.sheet = c.sheet;
					this.partitionSegments.push(sr);
					partitionSegmentIndexData = [];
				}

				this.segments.push(new SubRibbon(this, c.name, individualIndexData, n));
			}

			let sr = new SubRibbon(this, undefined, partitionSegmentIndexData, n);
			sr.helix = c.helix;
			sr.sheet = c.sheet;
			this.partitionSegments.push(sr);
		}
		this.storeData(this.partitions[0].positionData, this.partitions[0].normalData);
		if (this.partitions.length === 1) {
			// clear partitions to reduce overhead
			this.partitions = undefined;
		}
	};
	let _ = d3.Ribbon.prototype = new d3._Mesh();
	_.render = function(gl, styles) {
		this.bindBuffers(gl);
		// colors
		let color = styles.macro_colorByChain ? this.chainColor : undefined;
		if (!color) {
			color = this.front ? styles.proteins_primaryColor : styles.proteins_secondaryColor;
		}
		gl.material.setDiffuseColor(gl, color);
			
		for ( let i = 0, ii = this.partitionSegments.length; i < ii; i++) {
			this.partitionSegments[i].render(gl, styles, !styles.proteins_ribbonCartoonize);
		}
	};

})(ChemDoodle.RESIDUE, ChemDoodle.structures.d3, Math, ChemDoodle.lib.vec3);

(function(math, d3, v3, m4, undefined) {
	'use strict';
	d3.Light = function(diffuseColor, specularColor, direction) {
		this.camera = new d3.Camera();
		this.lightScene(diffuseColor, specularColor, direction);
	};
	let _ = d3.Light.prototype;
	_.lightScene = function(diffuseColor, specularColor, direction) {
		this.diffuseRGB = math.getRGB(diffuseColor, 1);
		this.specularRGB = math.getRGB(specularColor, 1);
		this.direction = direction;
		this.updateView();
	};
	_.updateView = function() {
		let lightDir = v3.normalize(this.direction, []);
		let eyePos = v3.scale(lightDir, (this.camera.near - this.camera.far) / 2 - this.camera.near, []);
		let up = v3.equal(lightDir, [0, 1, 0]) ? [0, 0, 1] : [0, 1, 0];
		m4.lookAt(eyePos, [0, 0, 0], up, this.camera.viewMatrix);
		this.camera.orthogonalProjectionMatrix();
	};

})(ChemDoodle.math, ChemDoodle.structures.d3, ChemDoodle.lib.vec3, ChemDoodle.lib.mat4);

(function(d3, undefined) {
	'use strict';
	d3.Line = function() {
		this.storeData([ 0, 0, 0, 0, 1, 0 ], [ 0, 0, 0, 0, 0, 0 ]);
	};
	d3.Line.prototype = new d3._Mesh();

})(ChemDoodle.structures.d3);

(function(math, d3, undefined) {
	'use strict';
	d3.Material = function() {
	};
	let _ = d3.Material.prototype;
	_.setTempColors = function(gl, ambientColor, diffuseColor, specularColor, shininess) {
		if (ambientColor) {
			gl.shader.setMaterialAmbientColor(gl, math.getRGB(ambientColor, 1));
		}
		if (diffuseColor) {
			gl.shader.setMaterialDiffuseColor(gl, math.getRGB(diffuseColor, 1));
		}
		if (specularColor) {
			gl.shader.setMaterialSpecularColor(gl, math.getRGB(specularColor, 1));
		}
		gl.shader.setMaterialShininess(gl, shininess);
		gl.shader.setMaterialAlpha(gl, 1);
	};
	_.setDiffuseColor = function(gl, diffuseColor) {
		gl.shader.setMaterialDiffuseColor(gl, math.getRGB(diffuseColor, 1));
	};
	_.setAlpha = function(gl, alpha) {
		gl.shader.setMaterialAlpha(gl, alpha);
	};

})(ChemDoodle.math, ChemDoodle.structures.d3);

(function(d3, math, document, undefined) {
	'use strict';
	d3.Picker = function() {
	};
	let _ = d3.Picker.prototype;

	_.init = function(gl) {
		// setup for picking system
		this.framebuffer = gl.createFramebuffer();

		// set pick texture
		let texture2D = gl.createTexture();
		let renderbuffer = gl.createRenderbuffer();

		gl.bindTexture(gl.TEXTURE_2D, texture2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

		// set framebuffer and bind the texture and renderbuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2D, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	};

	_.setDimension = function(gl, width, height) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

		// get binded depth attachment renderbuffer
		let renderbuffer = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
		if (gl.isRenderbuffer(renderbuffer)) {
			// set renderbuffer dimension
			gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		}

		// get binded color attachment texture 2d
		let texture2D = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
		if (gl.isTexture(texture2D)) {
			// set texture dimension
			gl.bindTexture(gl.TEXTURE_2D, texture2D);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	};

})(ChemDoodle.structures.d3, ChemDoodle.math, document);

(function(d3, m, undefined) {
	'use strict';

	d3.Pill = function(radius, height, latitudeBands, longitudeBands) {

		let capHeightScale = 1;
		let capDiameter = 2 * radius;

		height -= capDiameter;

		if (height < 0) {
			capHeightScale = 0;
			height += capDiameter;
		} else if (height < capDiameter) {
			capHeightScale = height / capDiameter;
			height = capDiameter;
		}

		// update latitude and logintude band for two caps.
		// latitudeBands *= 2;
		// longitudeBands *= 2;

		let positionData = [];
		let normalData = [];
		for ( let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
			let theta = latNumber * m.PI / latitudeBands;
			let sinTheta = m.sin(theta);
			let cosTheta = m.cos(theta) * capHeightScale;

			for ( let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
				let phi = longNumber * 2 * m.PI / longitudeBands;
				let sinPhi = m.sin(phi);
				let cosPhi = m.cos(phi);

				let x = cosPhi * sinTheta;
				let y = cosTheta;
				let z = sinPhi * sinTheta;

				normalData.push(x, y, z);
				positionData.push(radius * x, radius * y + (latNumber < latitudeBands / 2 ? height : 0), radius * z);
			}
		}

		let indexData = [];
		longitudeBands += 1;
		for ( let latNumber = 0; latNumber < latitudeBands; latNumber++) {
			for ( let longNumber = 0; longNumber < longitudeBands; longNumber++) {
				let first = (latNumber * longitudeBands) + (longNumber % longitudeBands);
				let second = first + longitudeBands;
				indexData.push(first, first + 1, second);
				if (longNumber < longitudeBands - 1) {
					indexData.push(second, first + 1, second + 1);
				}
			}
		}

		this.storeData(positionData, normalData, indexData);
	};
	d3.Pill.prototype = new d3._Mesh();

})(ChemDoodle.structures.d3, Math);

(function(extensions, RESIDUE, structures, d3, m, m4, v3, math, undefined) {
	'use strict';
	
	function createDummyResidue(x, y, z) {
		let dummyRes = new structures.Residue(-1);
		dummyRes.cp1 = dummyRes.cp2 = new structures.Atom('', x, y, z);
		return dummyRes;
	}
	
	function Pipe(a1, a2) {
		this.a1 = a1;
		this.a2 = a2;
	};
	let _1 = Pipe.prototype;
	_1.render = function(gl, styles) {
		let p1 = this.a1;
		let p2 = this.a2;
		let height = 1.001 * p1.distance3D(p2);
		let radiusScale = styles.proteins_cylinderHelixDiameter / 2;
		let scaleVector = [ radiusScale, height, radiusScale ];
		let transform = m4.translate(m4.identity(), [ p1.x, p1.y, p1.z ]);
		let y = [ 0, 1, 0 ];
		let ang = 0;
		let axis;
		if (p1.x === p2.x && p1.z === p2.z) {
			axis = [ 0, 0, 1 ];
			if (p2.y < p1.y) {
				ang = m.PI;
			}
		} else {
			let a2b = [ p2.x - p1.x, p2.y - p1.y, p2.z - p1.z ];
			ang = extensions.vec3AngleFrom(y, a2b);
			axis = v3.cross(y, a2b, []);
		}

		if (ang !== 0) {
			m4.rotate(transform, ang, axis);
		}
		m4.scale(transform, scaleVector);
		gl.shader.setMatrixUniforms(gl, transform);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinderClosedBuffer.vertexPositionBuffer.numItems);
	};

	function Plank(a1, a2, vx) {
		this.a1 = a1;
		this.a2 = a2;
		this.vx = vx;
	};
	let _2 = Plank.prototype;
	_2.render = function(gl, styles) {
		if (this.styles) {
			styles = this.styles;
		}
		// this is the elongation vector for the plank
		let height = 1.001 * this.a1.distance3D(this.a2);

		let diry = [ this.a2.x - this.a1.x, this.a2.y - this.a1.y, this.a2.z - this.a1.z ];
		let dirz = v3.cross(diry, this.vx, []);
		let dirx = v3.cross(dirz, diry, []);

		v3.normalize(dirx);
		v3.normalize(diry);
		v3.normalize(dirz);

		let transform = [
			dirx[0], dirx[1], dirx[2], 0,
			diry[0], diry[1], diry[2], 0,
			dirz[0], dirz[1], dirz[2], 0,
			this.a1.x, this.a1.y, this.a1.z, 1
		];

		let scaleVector = [ styles.proteins_plankSheetWidth, height, styles.proteins_tubeThickness];
		m4.scale(transform, scaleVector);
		gl.shader.setMatrixUniforms(gl, transform);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.boxBuffer.vertexPositionBuffer.numItems);
	};


	d3.PipePlank = function(rs, styles) {
		this.tubes = [];
		this.helixCylinders = [];
		this.sheetPlanks = [];
		this.chainColor = rs.chainColor;

		let chainNoSS = [];
		let noSSResidues = [];
		let helixResidues = [];
		let sheetResidues = [];

		// the first residue just a dummy residue.
		// so at beginning, the secondary structure of second residue must be check
		if(rs.length > 1) {
			let r0 = rs[0];
			let r1 = rs[1];
			if (r1.helix) {
				helixResidues.push(r0);
			} else if(r1.sheet) {
				sheetResidues.push(r0);
			} else {
				noSSResidues.push(r0);
			}
		}

		// iterate residues
		for ( let i = 1, ii = rs.length - 1; i <= ii; i++) {
			let residue = rs[i];
			if(residue.helix) {
				helixResidues.push(residue);

				if(residue.arrow) {
					let startPoint = v3.create();
					let endPoint = v3.create();

					if (helixResidues.length === 1) {
						// just 1 part in a helix
						startPoint = [residue.guidePointsSmall[0].x, residue.guidePointsSmall[0].y, residue.guidePointsSmall[0].z];
						let last = residue.guidePointsSmall[residue.guidePointsSmall.length-1];
						endPoint = [last.x, last.y, last.z];
					}else if (helixResidues.length === 2) {
						// PDB like 2PEC have helix which is just have 2 residues in it.
						startPoint = [helixResidues[0].cp1.x, helixResidues[0].cp1.y, helixResidues[0].cp1.z];
						endPoint = [helixResidues[1].cp1.x, helixResidues[1].cp1.y, helixResidues[1].cp1.z];
					} else {
						// To get helix axis, we need at least 4 residues.
						// if residues lenght is 3, then one residue need to be added.
						// The added residue is residue before helix.
						if(helixResidues.length === 3) {
							helixResidues.unshift(rs[m.max(i - 3, 0)]);
						}

						let Ps = [];
						let Vs = [];

						for (let h = 1, hh = helixResidues.length - 1; h < hh; h++) {
							let cai = [helixResidues[h].cp1.x, helixResidues[h].cp1.y, helixResidues[h].cp1.z];
							let A = [helixResidues[h-1].cp1.x, helixResidues[h-1].cp1.y, helixResidues[h-1].cp1.z];
							let B = [helixResidues[h+1].cp1.x, helixResidues[h+1].cp1.y, helixResidues[h+1].cp1.z];

							v3.subtract(A, cai);
							v3.subtract(B, cai);

							let Al = v3.scale(A, v3.length(B), []);
							let Bl = v3.scale(B, v3.length(A), []);

							let V = v3.normalize(v3.add(Al, Bl, []));

							Ps.push(cai);
							Vs.push(V);
						}

						let axes = [];
						for (let h = 0, hh = Ps.length - 1; h < hh; h++) {
							let P1 = Ps[h];
							let V1 = Vs[h];
							let P2 = Ps[h+1];
							let V2 = Vs[h+1];

							let H = v3.normalize(v3.cross(V1, V2, []));

							let P2subP1 = v3.subtract(P2, P1, []);
							let d = v3.dot(P2subP1, H);

							let dH = v3.scale(H, d, []);

							let dHl = v3.length(dH);
							let P2subP1l = v3.length(P2subP1);

							let r = -(dHl * dHl - P2subP1l * P2subP1l) / (2 * v3.dot(v3.subtract(P1, P2, []), V2));

							let H1 = v3.add(P1, v3.scale(V1, r, []), []);
							let H2 = v3.add(P2, v3.scale(V2, r, []), []);

							axes.push([H1, H2]);
						}
						let firstPoint = axes[0][0];
						let secondPoint = axes[0][1];
						let secondToFirst = v3.subtract(firstPoint, secondPoint, []);
						v3.add(firstPoint, secondToFirst, startPoint);

						firstPoint = axes[axes.length-1][1];
						secondPoint = axes[axes.length-1][0];
						secondToFirst = v3.subtract(firstPoint, secondPoint, []);
						v3.add(firstPoint, secondToFirst, endPoint);

					}

					let startAtom = new structures.Atom('', startPoint[0], startPoint[1], startPoint[2]);
					let endAtom = new structures.Atom('', endPoint[0], endPoint[1], endPoint[2]);

					this.helixCylinders.push(new Pipe(startAtom, endAtom));

					helixResidues = [];

					// get vector direction from Pipe end to start
					let helixDir = v3.subtract(startPoint, endPoint, []);
					v3.normalize(helixDir);
					v3.scale(helixDir, .5);

					if (noSSResidues.length > 0) {

						let additionCp = v3.add(startPoint, helixDir, []);
						let prevResCp = noSSResidues[noSSResidues.length - 1].cp1;
						let helixDirToPrevRes = v3.subtract([prevResCp.x, prevResCp.y, prevResCp.z], additionCp, []);
						v3.normalize(helixDirToPrevRes);
						v3.scale(helixDirToPrevRes, .5);
						v3.add(additionCp, helixDirToPrevRes);
						let dummyRes = new structures.Residue(-1);
						dummyRes.cp1 = dummyRes.cp2 = new structures.Atom('', additionCp[0], additionCp[1], additionCp[2]);
						noSSResidues.push(dummyRes);

						// force the non secondary structure spline to end on helix start point.
						dummyRes = createDummyResidue(startPoint[0], startPoint[1], startPoint[2]);
						noSSResidues.push(dummyRes);

						chainNoSS.push(noSSResidues);
					}

					noSSResidues = [];

					// check for next residue
					if (i < ii) {
						// force the non secondary structure spline to start on helix end point.
						let dummyRes = createDummyResidue(endPoint[0], endPoint[1], endPoint[2]);
						noSSResidues.push(dummyRes);

						let rm = rs[i + 1];
						if (rm.sheet) {
							noSSResidues.push(residue);
							noSSResidues.push(residue);
							chainNoSS.push(noSSResidues);
							noSSResidues = [];

							sheetResidues.push(residue);
						} else {
							// force the non secondary structure spline to start on helix end point.
							v3.scale(helixDir, -1);
							let additionCp = v3.add(endPoint, helixDir, []);
							let nextResCp = rm.cp1;
							let helixDirToNextRes = v3.subtract([nextResCp.x, nextResCp.y, nextResCp.z], additionCp, []);
							v3.normalize(helixDirToNextRes);
							v3.scale(helixDirToNextRes, .5);
							v3.add(additionCp, helixDirToNextRes);
							let dummyRes = createDummyResidue(additionCp[0], additionCp[1], additionCp[2]);
							noSSResidues.push(dummyRes);
						}
					}
				}

			} else if(residue.sheet) {

				sheetResidues.push(residue);
				if(residue.arrow) {

					let p1 = [0, 0, 0];
					let p2 = [0, 0, 0];
					let hh = sheetResidues.length;
					for(let h = 0; h < hh; h++) {
						let guidePoints = sheetResidues[h].guidePointsLarge;
						let gp1 = guidePoints[0];
						let gp2 = guidePoints[guidePoints.length - 1];

						v3.add(p1, [gp1.x, gp1.y, gp1.z]);
						v3.add(p2, [gp2.x, gp2.y, gp2.z]);
					}

					v3.scale(p1, 1 / hh);
					v3.scale(p2, 1 / hh);

					let dirx = v3.subtract(p1, p2);

					let firstRs = sheetResidues[0];
					let lastRs = sheetResidues[hh - 1];

					let firstGuidePoints = firstRs.guidePointsSmall[0];
					let lastGuidePoints = lastRs.guidePointsSmall[0];

					this.sheetPlanks.push(new Plank(firstGuidePoints, lastGuidePoints, dirx));

					sheetResidues = [];

					if (i < ii) {
						let rm = rs[i + 1];

						if (rm.sheet) {
							sheetResidues.push(residue);
						} else {
							let dummyRes = createDummyResidue(lastGuidePoints.x, lastGuidePoints.y, lastGuidePoints.z);
							noSSResidues.push(dummyRes);
						}
					}
				}

			} else {
				noSSResidues.push(residue);

				if (i < ii) {
					let rm = rs[i + 1];
					if (rm.sheet) {
						let guidePoints = residue.guidePointsSmall[0];
						let dummyRes = createDummyResidue(guidePoints.x, guidePoints.y, guidePoints.z);

						noSSResidues.push(dummyRes);

						chainNoSS.push(noSSResidues);
						noSSResidues = [];

						sheetResidues.push(residue);
					}
				}
			}
		}

		if(noSSResidues.length > 1) {
			if(noSSResidues.length == 2) {
				noSSResidues.push(noSSResidues[noSSResidues.length - 1]);
			}
			chainNoSS.push(noSSResidues);
		}
		noSSResidues = [];

		let chainSegments = [];
		for ( let n = 0, nn = chainNoSS.length; n < nn; n++) {
			let nhs = chainNoSS[n];
			let lineSegmentsList = [];

			for ( let i = 0, ii = nhs.length - 1; i <= ii; i++) {
				lineSegmentsList.push(nhs[i].cp1);
			}
			chainSegments.push(lineSegmentsList);
		}

		for (let i = 0, ii = chainSegments.length; i < ii; i++) {
			let t = new d3.CatmullTube(chainSegments[i], styles.proteins_tubeThickness, styles.proteins_tubeResolution_3D, styles.proteins_horizontalResolution);
			t.chainColor = rs.chainColor;
			this.tubes.push(t);
		}
	};
	let _ = d3.PipePlank.prototype = new d3._Mesh();
	_.render = function(gl, styles) {
		gl.material.setTempColors(gl, styles.proteins_materialAmbientColor_3D, undefined, styles.proteins_materialSpecularColor_3D, styles.proteins_materialShininess_3D);
		
		// colors
		gl.material.setDiffuseColor(gl, styles.macro_colorByChain ? this.chainColor : styles.proteins_tubeColor);
		for ( let j = 0, jj = this.tubes.length; j < jj; j++) {
			gl.shader.setMatrixUniforms(gl);
			this.tubes[j].render(gl, styles);
		}

		if(!styles.macro_colorByChain) {
			gl.material.setDiffuseColor(gl, styles.proteins_ribbonCartoonHelixSecondaryColor);
		}

		gl.cylinderClosedBuffer.bindBuffers(gl);
		for (let j = 0, jj = this.helixCylinders.length; j < jj; j++) {
			this.helixCylinders[j].render(gl, styles);
		}

		if(!styles.macro_colorByChain) {
			gl.material.setDiffuseColor(gl, styles.proteins_ribbonCartoonSheetColor);
		}

		gl.boxBuffer.bindBuffers(gl);
		for (let j = 0, jj = this.sheetPlanks.length; j < jj; j++) {
			this.sheetPlanks[j].render(gl, styles);
		}

	};

})(ChemDoodle.extensions, ChemDoodle.RESIDUE, ChemDoodle.structures, ChemDoodle.structures.d3, Math, ChemDoodle.lib.mat4, ChemDoodle.lib.vec3, ChemDoodle.math);

(function(d3, undefined) {
	'use strict';
	d3.Quad = function() {
		let positionData = [
			-1, 1, 0, 
			-1, -1, 0, 
			1, 1, 0, 
			1, -1, 0
		];
		let normalData = [
			0, 0, 0,
			0, 0, 0,
			0, 0, 0,
			0, 0, 0
		];
		this.storeData(positionData, normalData);
	};
	d3.Quad.prototype = new d3._Mesh();

})(ChemDoodle.structures.d3);

(function(structures, d3, v3, undefined) {
	'use strict';
	d3.Shape = function(points, thickness) {
		// points must be in the xy-plane, all z-coords must be 0, thickness
		// will be in the z-plane
		let numPoints = points.length;
		let positionData = [];
		let normalData = [];

		// calculate vertex and normal points
		let center = new structures.Point();
		for ( let i = 0, ii = numPoints; i < ii; i++) {
			let next = i + 1;
			if (i === ii - 1) {
				next = 0;
			}
			let z = [ 0, 0, 1 ];
			let currentPoint = points[i];
			let nextPoint = points[next];
			let v = [ nextPoint.x - currentPoint.x, nextPoint.y - currentPoint.y, 0 ];
			let normal = v3.cross(z, v);
			// first four are for the side normal
			// second four will do both the bottom and top triangle normals
			for ( let j = 0; j < 2; j++) {
				positionData.push(currentPoint.x, currentPoint.y, thickness / 2);
				positionData.push(currentPoint.x, currentPoint.y, -thickness / 2);
				positionData.push(nextPoint.x, nextPoint.y, thickness / 2);
				positionData.push(nextPoint.x, nextPoint.y, -thickness / 2);
			}
			// side normals
			for ( let j = 0; j < 4; j++) {
				normalData.push(normal[0], normal[1], normal[2]);
			}
			// top and bottom normals
			normalData.push(0, 0, 1);
			normalData.push(0, 0, -1);
			normalData.push(0, 0, 1);
			normalData.push(0, 0, -1);
			center.add(currentPoint);
		}
		// centers
		center.x /= numPoints;
		center.y /= numPoints;
		normalData.push(0, 0, 1);
		positionData.push(center.x, center.y, thickness / 2);
		normalData.push(0, 0, -1);
		positionData.push(center.x, center.y, -thickness / 2);

		// build mesh connectivity
		let indexData = [];
		let centerIndex = numPoints * 8;
		for ( let i = 0, ii = numPoints; i < ii; i++) {
			let start = i * 8;
			// sides
			indexData.push(start);
			indexData.push(start + 3);
			indexData.push(start + 1);
			indexData.push(start);
			indexData.push(start + 2);
			indexData.push(start + 3);
			// top and bottom
			indexData.push(start + 4);
			indexData.push(centerIndex);
			indexData.push(start + 6);
			indexData.push(start + 5);
			indexData.push(start + 7);
			indexData.push(centerIndex + 1);
		}

		this.storeData(positionData, normalData, indexData);
	};
	d3.Shape.prototype = new d3._Mesh();

})(ChemDoodle.structures, ChemDoodle.structures.d3, ChemDoodle.lib.vec3);

(function(d3, m, v3, undefined) {
	'use strict';
	d3.Star = function() {
		let ps = [ .8944, .4472, 0, .2764, .4472, .8506, .2764, .4472, -.8506, -.7236, .4472, .5257, -.7236, .4472, -.5257, -.3416, .4472, 0, -.1056, .4472, .3249, -.1056, .4472, -.3249, .2764, .4472, .2008, .2764, .4472, -.2008, -.8944, -.4472, 0, -.2764, -.4472, .8506, -.2764, -.4472, -.8506, .7236, -.4472, .5257, .7236, -.4472, -.5257, .3416, -.4472, 0, .1056, -.4472, .3249, .1056, -.4472, -.3249, -.2764, -.4472, .2008, -.2764, -.4472, -.2008, -.5527, .1058, 0, -.1708, .1058, .5527, -.1708,
				.1058, -.5527, .4471, .1058, .3249, .4471, .1058, -.3249, .5527, -.1058, 0, .1708, -.1058, .5527, .1708, -.1058, -.5527, -.4471, -.1058, .3249, -.4471, -.1058, -.3249, 0, 1, 0, 0, -1, 0 ];
		let is = [ 0, 9, 8, 2, 7, 9, 4, 5, 7, 3, 6, 5, 1, 8, 6, 0, 8, 23, 30, 6, 8, 3, 21, 6, 11, 26, 21, 13, 23, 26, 2, 9, 24, 30, 8, 9, 1, 23, 8, 13, 25, 23, 14, 24, 25, 4, 7, 22, 30, 9, 7, 0, 24, 9, 14, 27, 24, 12, 22, 27, 3, 5, 20, 30, 7, 5, 2, 22, 7, 12, 29, 22, 10, 20, 29, 1, 6, 21, 30, 5, 6, 4, 20, 5, 10, 28, 20, 11, 21, 28, 10, 19, 18, 12, 17, 19, 14, 15, 17, 13, 16, 15, 11, 18, 16, 31, 19, 17, 14, 17, 27, 2, 27, 22, 4, 22, 29, 10, 29, 19, 31, 18, 19, 12, 19, 29, 4, 29, 20, 3, 20, 28,
				11, 28, 18, 31, 16, 18, 10, 18, 28, 3, 28, 21, 1, 21, 26, 13, 26, 16, 31, 15, 16, 11, 16, 26, 1, 26, 23, 0, 23, 25, 14, 25, 15, 31, 17, 15, 13, 15, 25, 0, 25, 24, 2, 24, 27, 12, 27, 17 ];

		let positionData = [];
		let normalData = [];
		let indexData = [];
		for ( let i = 0, ii = is.length; i < ii; i += 3) {
			let j1 = is[i] * 3;
			let j2 = is[i + 1] * 3;
			let j3 = is[i + 2] * 3;

			let p1 = [ ps[j1], ps[j1 + 1], ps[j1 + 2] ];
			let p2 = [ ps[j2], ps[j2 + 1], ps[j2 + 2] ];
			let p3 = [ ps[j3], ps[j3 + 1], ps[j3 + 2] ];

			let toAbove = [ p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2] ];
			let toSide = [ p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2] ];
			let normal = v3.cross(toSide, toAbove, []);
			v3.normalize(normal);

			positionData.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2], p3[0], p3[1], p3[2]);
			normalData.push(normal[0], normal[1], normal[2], normal[0], normal[1], normal[2], normal[0], normal[1], normal[2]);
			indexData.push(i, i + 1, i + 2);
		}

		this.storeData(positionData, normalData, indexData);
	};
	d3.Star.prototype = new d3._Mesh();

})(ChemDoodle.structures.d3, Math, ChemDoodle.lib.vec3);

(function(d3, extensions, document, window, undefined) {
	'use strict';
	let ratio = 1;
	if(window.devicePixelRatio){
		ratio = window.devicePixelRatio;
	}
	
	d3.TextImage = function() {
		this.ctx = document.createElement('canvas').getContext('2d');
		this.data = [];
		this.text = '';
		this.charHeight = 0;
	};

	let _ = d3.TextImage.prototype;

	_.init = function(gl) {
		// init texture
		this.textureImage = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.textureImage);

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);

		this.updateFont(gl, 12, [ 'Sans-serif' ], false, false, false);
	};

	_.charData = function(character) {
		let index = this.text.indexOf(character);
		return index >= 0 ? this.data[index] : null;
	};

	_.updateFont = function(gl, fontSize, fontFamilies, fontBold, fontItalic, fontStroke) {
		let ctx = this.ctx;
		let canvas = this.ctx.canvas;
		let data = [];
		let text = "";
		fontSize *= ratio;
		let contextFont = extensions.getFontString(fontSize, fontFamilies, fontBold, fontItalic);

		ctx.font = contextFont;

		ctx.save();

		let totalWidth = 0;
		let charHeight = fontSize * 1.5;

		for ( let i = 32, ii = 127; i < ii; i++) {

			// skip control characters
			// if(i <= 31 || i == 127) continue;

			let character = String.fromCharCode(i), width = ctx.measureText(character).width;

			data.push({
				text : character,
				width : width,
				height : charHeight
			});

			totalWidth += width * 2;
		}
		
		// add other characters
		let chars = '\u00b0\u212b\u00AE'.split('');
		for ( let i = 0, ii = chars.length; i < ii; i++) {

			let character = chars[i], width = ctx.measureText(character).width;

			data.push({
				text : character,
				width : width,
				height : charHeight
			});

			totalWidth += width * 2;
		}

		let areaImage = totalWidth * charHeight;
		let sqrtArea = Math.sqrt(areaImage);
		let totalRows = Math.ceil(sqrtArea / charHeight);
		let maxWidth = Math.ceil(totalWidth / (totalRows - 1));

		canvas.width = maxWidth;
		canvas.height = totalRows * charHeight;

		ctx.font = contextFont;
		ctx.textAlign = "left";
		ctx.textBaseline = "middle";

		ctx.strokeStyle = "#000";
		ctx.lineWidth = 1.4;

		ctx.fillStyle = "#fff";

		let offsetRow = 0;
		let posX = 0;
		for ( let i = 0, ii = data.length; i < ii; i++) {
			let charData = data[i];
			let charWidth = charData.width * 2;
			let charHeight = charData.height;
			let charText = charData.text;
			let willWidth = posX + charWidth;

			if (willWidth > maxWidth) {
				offsetRow++;
				posX = 0;
			}

			let posY = offsetRow * charHeight;

			if (fontStroke) {
				// stroke must draw before fill
				ctx.strokeText(charText, posX, posY + (charHeight / 2));
			}

			ctx.fillText(charText, posX, posY + (charHeight / 2));

			charData.x = posX;
			charData.y = posY;

			text += charText;
			posX += charWidth;
		}

		this.text = text;
		this.data = data;
		this.charHeight = charHeight;

		// also update the texture
		gl.bindTexture(gl.TEXTURE_2D, this.textureImage);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	_.pushVertexData = function(text, position, zDepth, data) {
		// characters of string text
		let textPiece = text.toString().split("");

		// height of texture image
		let heightImage = this.getHeight();
		let widthImage = this.getWidth();

		let x1 = -this.textWidth(text) / 2 / ratio;
		let y1 = -this.charHeight / 2 / ratio;

		// iterate each character
		for ( let j = 0, jj = textPiece.length; j < jj; j++) {
			let charData = this.charData(textPiece[j]);

			let width = charData.width;
			let left = charData.x / widthImage;
			let right = left + charData.width * 1.8 / widthImage;
			let top = charData.y / heightImage;
			let bottom = top + charData.height / heightImage;

			let x2 = x1 + width * 1.8 / ratio;
			let y2 = this.charHeight / 2 / ratio;

			data.position.push(
			// left top
			position[0], position[1], position[2],
			// right top
			position[0], position[1], position[2],
			// right bottom
			position[0], position[1], position[2],

			// left top
			position[0], position[1], position[2],
			// left bottom
			position[0], position[1], position[2],
			// right bottom
			position[0], position[1], position[2]);

			data.texCoord.push(
			// left top
			left, top,
			// right bottom
			right, bottom,
			// right top
			right, top,

			// left top
			left, top,
			// left bottom
			left, bottom,
			// right bottom
			right, bottom);

			data.translation.push(
			// left top
			x1, y2, zDepth,
			// right bottom
			x2, y1, zDepth,
			// right top
			x2, y2, zDepth,

			// left top
			x1, y2, zDepth,
			// left bottom
			x1, y1, zDepth,
			// right bottom
			x2, y1, zDepth);

			x1 = x2 + (width - width * 1.8) / ratio;
		}

	};
	_.getCanvas = function() {
		return this.ctx.canvas;
	};
	_.getHeight = function() {
		return this.getCanvas().height;
	};
	_.getWidth = function() {
		return this.getCanvas().width;
	};
	_.textWidth = function(text) {
		return this.ctx.measureText(text).width;
	};
	_.test = function() {
		document.body.appendChild(this.getCanvas());
	};
	_.useTexture = function(gl) {
		gl.bindTexture(gl.TEXTURE_2D, this.textureImage);
	};

})(ChemDoodle.structures.d3, ChemDoodle.extensions, document, window);

(function(d3, m, undefined) {
	'use strict';
	d3.TextMesh = function() {
	};
	let _ = d3.TextMesh.prototype;
	_.init = function(gl) {
		// set vertex buffer
		this.vertexPositionBuffer = gl.createBuffer();
		this.vertexTexCoordBuffer = gl.createBuffer();
		this.vertexTranslationBuffer = gl.createBuffer();
	};
	_.setVertexData = function(gl, vertexBuffer, bufferData, itemSize) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData), gl.STATIC_DRAW);
		vertexBuffer.itemSize = itemSize;
		vertexBuffer.numItems = bufferData.length / itemSize;
	};
	_.storeData = function(gl, vertexPositionData, vertexTexCoordData, vertexTranslationData) {
		this.setVertexData(gl, this.vertexPositionBuffer, vertexPositionData, 3);
		this.setVertexData(gl, this.vertexTexCoordBuffer, vertexTexCoordData, 2);
		this.setVertexData(gl, this.vertexTranslationBuffer, vertexTranslationData, 3);
	};
	_.bindBuffers = function(gl) {
		// positions
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		gl.vertexAttribPointer(gl.shader.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

		// texCoord
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
		gl.vertexAttribPointer(gl.shader.vertexTexCoordAttribute, this.vertexTexCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

		// translation and z depth
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTranslationBuffer);
		gl.vertexAttribPointer(gl.shader.vertexNormalAttribute, this.vertexTranslationBuffer.itemSize, gl.FLOAT, false, 0, 0);
	};
	_.render = function(gl) {
		let numItems = this.vertexPositionBuffer.numItems;

		if (!numItems) {
			// nothing to do here
			return;
		}

		this.bindBuffers(gl);
		gl.drawArrays(gl.TRIANGLES, 0, numItems);
	};

})(ChemDoodle.structures.d3, Math);

(function(ELEMENT, math, d3, m, m4, v3, undefined) {
	'use strict';
	d3.Torsion = function(a1, a2, a3, a4) {
		this.a1 = a1;
		this.a2 = a2;
		this.a3 = a3;
		this.a4 = a4;
	};
	let _ = d3.Torsion.prototype = new d3._Measurement();
	_.calculateData = function(styles) {
		let positionData = [];
		let normalData = [];
		let indexData = [];
		let dist1 = this.a2.distance3D(this.a1);
		let dist2 = this.a2.distance3D(this.a3);
		this.distUse = m.min(dist1, dist2) / 2;
		// data for the angle
		let b1 = [ this.a2.x - this.a1.x, this.a2.y - this.a1.y, this.a2.z - this.a1.z ];
		let b2 = [ this.a3.x - this.a2.x, this.a3.y - this.a2.y, this.a3.z - this.a2.z ];
		let b3 = [ this.a4.x - this.a3.x, this.a4.y - this.a3.y, this.a4.z - this.a3.z ];
		let cross12 = v3.cross(b1, b2, []);
		let cross23 = v3.cross(b2, b3, []);
		v3.scale(b1, v3.length(b2));
		this.torsion = m.atan2(v3.dot(b1, cross23), v3.dot(cross12, cross23));

		let vec1 = v3.normalize(v3.cross(cross12, b2, []));
		let vec3 = v3.normalize(v3.cross(b2, vec1, []));

		this.pos = v3.add([ this.a2.x, this.a2.y, this.a2.z ], v3.scale(v3.normalize(b2, []), this.distUse));

		let vec0 = [];

		let bands = styles.measurement_angleBands_3D;
		let norm = undefined;
		let i = 0;
		for (i = 0; i <= bands; ++i) {
			let theta = this.torsion * i / bands;
			let vecCos = v3.scale(vec1, m.cos(theta), []);
			let vecSin = v3.scale(vec3, m.sin(theta), []);
			norm = v3.scale(v3.normalize(v3.add(vecCos, vecSin, [])), this.distUse);

			if (i == 0) {
				vec0 = norm;
			}

			positionData.push(this.pos[0] + norm[0], this.pos[1] + norm[1], this.pos[2] + norm[2]);
			normalData.push(0, 0, 0);
			if (i < bands) {
				indexData.push(i, i + 1);
			}
		}

		this.vecText = v3.normalize(v3.add(vec0, norm, []));
		
		let arrowLength = 0.25;
		let b2Norm = v3.normalize(b2, []);
		v3.scale(b2Norm, arrowLength / 4);

		let theta = this.torsion - m.asin(arrowLength / 2) * 2 * this.torsion / m.abs(this.torsion);
		let vecCos = v3.scale(vec1, m.cos(theta), []);
		let vecSin = v3.scale(vec3, m.sin(theta), []);
		norm = v3.scale(v3.normalize(v3.add(vecCos, vecSin, [])), this.distUse);

		positionData.push(this.pos[0] + b2Norm[0] + norm[0], this.pos[1] + b2Norm[1] + norm[1], this.pos[2] + b2Norm[2] + norm[2]);
		normalData.push(0, 0, 0);

		positionData.push(this.pos[0] - b2Norm[0] + norm[0], this.pos[1] - b2Norm[1] + norm[1], this.pos[2] - b2Norm[2] + norm[2]);
		normalData.push(0, 0, 0);

		indexData.push(--i, i + 1, i, i + 2);

		this.storeData(positionData, normalData, indexData);
	};
	_.getText = function(styles) {
		v3.add(this.pos, v3.scale(this.vecText, this.distUse + 0.3, []));

		return {
			pos : this.pos,
			value : [ math.angleBounds(this.torsion, true, true).toFixed(2), ' \u00b0' ].join('')
		};
	};

})(ChemDoodle.ELEMENT, ChemDoodle.math, ChemDoodle.structures.d3, Math, ChemDoodle.lib.mat4, ChemDoodle.lib.vec3);

(function(extensions, RESIDUE, structures, d3, m, m4, v3, math, undefined) {
	'use strict';
	let loadPartition = function(gl, p) {
		// positions
		gl.bindBuffer(gl.ARRAY_BUFFER, p.vertexPositionBuffer);
		gl.vertexAttribPointer(gl.shader.vertexPositionAttribute, p.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		// normals
		gl.bindBuffer(gl.ARRAY_BUFFER, p.vertexNormalBuffer);
		gl.vertexAttribPointer(gl.shader.vertexNormalAttribute, p.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		// indexes
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.vertexIndexBuffer);
	};

	let PointRotator = function(point, axis, angle) {
		let d = m.sqrt(axis[1] * axis[1] + axis[2] * axis[2]);
		let Rx = [ 1, 0, 0, 0, 0, axis[2] / d, -axis[1] / d, 0, 0, axis[1] / d, axis[2] / d, 0, 0, 0, 0, 1 ];
		let RxT = [ 1, 0, 0, 0, 0, axis[2] / d, axis[1] / d, 0, 0, -axis[1] / d, axis[2] / d, 0, 0, 0, 0, 1 ];
		let Ry = [ d, 0, -axis[0], 0, 0, 1, 0, 0, axis[0], 0, d, 0, 0, 0, 0, 1 ];
		let RyT = [ d, 0, axis[0], 0, 0, 1, 0, 0, -axis[0], 0, d, 0, 0, 0, 0, 1 ];
		let Rz = [ m.cos(angle), -m.sin(angle), 0, 0, m.sin(angle), m.cos(angle), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];
		let matrix = m4.multiply(Rx, m4.multiply(Ry, m4.multiply(Rz, m4.multiply(RyT, RxT, []))));
		this.rotate = function() {
			return m4.multiplyVec3(matrix, point);
		};
	};

	d3.Tube = function(chain, thickness, cylinderResolution) {
		let lineSegmentNum = chain[0].lineSegments[0].length;
		this.partitions = [];
		let currentPartition;
		this.ends = [];
		this.ends.push(chain[0].lineSegments[0][0]);
		this.ends.push(chain[chain.length - 1].lineSegments[0][0]);
		// calculate vertex and normal points
		let last = [ 1, 0, 0 ];
		for ( let i = 0, ii = chain.length; i < ii; i++) {
			if (!currentPartition || currentPartition.positionData.length > 65000) {
				if (this.partitions.length > 0) {
					i--;
				}
				currentPartition = {
					count : 0,
					positionData : [],
					normalData : [],
					indexData : []
				};
				this.partitions.push(currentPartition);
			}
			let residue = chain[i];
			currentPartition.count++;
			let min = Infinity;
			let p = new structures.Atom('', chain[i].cp1.x, chain[i].cp1.y, chain[i].cp1.z);
			for ( let j = 0; j < lineSegmentNum; j++) {
				let currentPoint = residue.lineSegments[0][j];
				let nextPoint;
				if (j === lineSegmentNum - 1) {
					if (i === chain.length - 1) {
						nextPoint = residue.lineSegments[0][j - 1];
					} else {
						nextPoint = chain[i + 1].lineSegments[0][0];
					}
				} else {
					nextPoint = residue.lineSegments[0][j + 1];
				}
				let axis = [ nextPoint.x - currentPoint.x, nextPoint.y - currentPoint.y, nextPoint.z - currentPoint.z ];
				v3.normalize(axis);
				if (i === chain.length - 1 && j === lineSegmentNum - 1) {
					v3.scale(axis, -1);
				}
				let startVector = v3.cross(axis, last, []);
				v3.normalize(startVector);
				v3.scale(startVector, thickness / 2);
				let rotator = new PointRotator(startVector, axis, 2 * Math.PI / cylinderResolution);
				for ( let k = 0, kk = cylinderResolution; k < kk; k++) {
					let use = rotator.rotate();
					if (k === m.floor(cylinderResolution / 4)) {
						last = [ use[0], use[1], use[2] ];
					}
					currentPartition.normalData.push(use[0], use[1], use[2]);
					currentPartition.positionData.push(currentPoint.x + use[0], currentPoint.y + use[1], currentPoint.z + use[2]);
				}
				// find closest point to attach stick to
				if (p) {
					let dist = currentPoint.distance3D(p);
					if (dist < min) {
						min = dist;
						chain[i].pPoint = currentPoint;
					}
				}
			}
		}

		// build mesh connectivity
		for ( let n = 0, nn = this.partitions.length; n < nn; n++) {
			let currentPartition = this.partitions[n];
			for ( let i = 0, ii = currentPartition.count - 1; i < ii; i++) {
				let indexStart = i * lineSegmentNum * cylinderResolution;
				for ( let j = 0, jj = lineSegmentNum; j < jj; j++) {
					let segmentIndexStart = indexStart + j * cylinderResolution;
					for ( let k = 0; k < cylinderResolution; k++) {
						let next = 1;
						let sk = segmentIndexStart + k;
						currentPartition.indexData.push(sk);
						currentPartition.indexData.push(sk + cylinderResolution);
						currentPartition.indexData.push(sk + cylinderResolution + next);
						currentPartition.indexData.push(sk);
						currentPartition.indexData.push(sk + cylinderResolution + next);
						currentPartition.indexData.push(sk + next);
					}
				}
			}
		}

		this.storeData(this.partitions[0].positionData, this.partitions[0].normalData, this.partitions[0].indexData);

		let ps = [ new structures.Point(2, 0) ];
		for ( let i = 0; i < 60; i++) {
			let ang = i / 60 * m.PI;
			ps.push(new structures.Point(2 * m.cos(ang), -2 * m.sin(ang)));
		}
		ps.push(new structures.Point(-2, 0), new structures.Point(-2, 4), new structures.Point(2, 4));
		let platform = new structures.d3.Shape(ps, 1);

		this.render = function(gl, styles) {
			// draw tube
			this.bindBuffers(gl);
			// colors
			gl.material.setDiffuseColor(gl, styles.macro_colorByChain ? this.chainColor : styles.nucleics_tubeColor);
			// render
			gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			if (this.partitions) {
				for ( let i = 1, ii = this.partitions.length; i < ii; i++) {
					let p = this.partitions[i];
					loadPartition(gl, p);
					// render
					gl.drawElements(gl.TRIANGLES, p.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
				}
			}

			// draw ends
			gl.sphereBuffer.bindBuffers(gl);
			for ( let i = 0; i < 2; i++) {
				let p = this.ends[i];
				let transform = m4.translate(m4.identity(), [ p.x, p.y, p.z ]);
				let radius = thickness / 2;
				m4.scale(transform, [ radius, radius, radius ]);
				// render
				gl.shader.setMatrixUniforms(gl, transform);
				gl.drawElements(gl.TRIANGLES, gl.sphereBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			}

			// draw nucleotide handles
			gl.cylinderBuffer.bindBuffers(gl);
			for ( let i = 0, ii = chain.length - 1; i < ii; i++) {
				let residue = chain[i];
				let p1 = residue.pPoint;
				let p2 = new structures.Atom('', residue.cp2.x, residue.cp2.y, residue.cp2.z);
				let height = 1.001 * p1.distance3D(p2);
				let scaleVector = [ thickness / 4, height, thickness / 4 ];
				let transform = m4.translate(m4.identity(), [ p1.x, p1.y, p1.z ]);
				let y = [ 0, 1, 0 ];
				let ang = 0;
				let axis;
				let a2b = [ p2.x - p1.x, p2.y - p1.y, p2.z - p1.z ];
				if (p1.x === p2.x && p1.z === p2.z) {
					axis = [ 0, 0, 1 ];
					if (p1.y < p1.y) {
						ang = m.PI;
					}
				} else {
					ang = extensions.vec3AngleFrom(y, a2b);
					axis = v3.cross(y, a2b, []);
				}
				if (ang !== 0) {
					m4.rotate(transform, ang, axis);
				}
				m4.scale(transform, scaleVector);
				gl.shader.setMatrixUniforms(gl, transform);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinderBuffer.vertexPositionBuffer.numItems);
			}

			// draw nucleotide platforms
			platform.bindBuffers(gl);
			// colors
			if (styles.nucleics_residueColor === 'none' && !styles.macro_colorByChain) {
				gl.material.setDiffuseColor(gl, styles.nucleics_baseColor);
			}
			for ( let i = 0, ii = chain.length - 1; i < ii; i++) {
				let residue = chain[i];
				let p2 = residue.cp2;
				let transform = m4.translate(m4.identity(), [ p2.x, p2.y, p2.z ]);
				// rotate to direction
				let y = [ 0, 1, 0 ];
				let ang = 0;
				let axis;
				let p3 = residue.cp3;
				if(p3){
					let a2b = [ p3.x - p2.x, p3.y - p2.y, p3.z - p2.z ];
					if (p2.x === p3.x && p2.z === p3.z) {
						axis = [ 0, 0, 1 ];
						if (p2.y < p2.y) {
							ang = m.PI;
						}
					} else {
						ang = extensions.vec3AngleFrom(y, a2b);
						axis = v3.cross(y, a2b, []);
					}
					if (ang !== 0) {
						m4.rotate(transform, ang, axis);
					}
					// rotate to orientation
					let x = [ 1, 0, 0 ];
					let rM = m4.rotate(m4.identity([]), ang, axis);
					m4.multiplyVec3(rM, x);
					let p4 = residue.cp4;
					let p5 = residue.cp5;
					if (!(p4.y === p5.y && p4.z === p5.z)) {
						let pivot = [ p5.x - p4.x, p5.y - p4.y, p5.z - p4.z ];
						let ang2 = extensions.vec3AngleFrom(x, pivot);
						if (v3.dot(a2b, v3.cross(x, pivot)) < 0) {
							ang2 *= -1;
						}
						m4.rotateY(transform, ang2);
					}
					// color
					if (!styles.macro_colorByChain) {
						if (styles.nucleics_residueColor === 'shapely') {
							if (RESIDUE[residue.name]) {
								gl.material.setDiffuseColor(gl, RESIDUE[residue.name].shapelyColor);
							} else {
								gl.material.setDiffuseColor(gl, RESIDUE['*'].shapelyColor);
							}
						} else if (styles.nucleics_residueColor === 'rainbow') {
							gl.material.setDiffuseColor(gl, math.rainbowAt(i, ii, styles.macro_rainbowColors));
						}
					}
					// render
					gl.shader.setMatrixUniforms(gl, transform);
					gl.drawElements(gl.TRIANGLES, platform.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
				}
			}

		};
	};
	d3.Tube.prototype = new d3._Mesh();

	d3.CatmullTube = function(chains, thickness, cylinderResolution, horizontalResolution) {
		let chain = [];
		chains.push(chains[chains.length - 1]);
		for ( let i = 0, ii = chains.length - 2; i <= ii; i++) {
			let p0 = chains[i == 0 ? 0 : i - 1];
			let p1 = chains[i + 0];
			let p2 = chains[i + 1];
			let p3 = chains[i == ii ? i + 1 : i + 2];

			let segments = [];

			for(let j = 0; j < horizontalResolution; j++) {

				let t = j / horizontalResolution;
				if(i == ii) {
					t = j / (horizontalResolution-1);
				}

				let x = 0.5 * ((2 * p1.x) +
                      (p2.x - p0.x) * t +
                      (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * t * t +
                      (3*p1.x - p0.x - 3 * p2.x + p3.x) * t * t * t);
				let y = 0.5 * ((2 * p1.y) +
                      (p2.y - p0.y) * t +
                      (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * t * t +
                      (3*p1.y -p0.y - 3 * p2.y + p3.y) * t * t * t);
				let z = 0.5 * ((2 * p1.z) +
                      (p2.z - p0.z) * t +
                      (2*p0.z - 5*p1.z + 4*p2.z - p3.z) * t * t +
                      (3*p1.z -p0.z - 3 * p2.z + p3.z) * t * t * t);

				let o = new structures.Atom('C', x, y, z);
				segments.push(o);
			}

			chain.push(segments);
		}

		let lineSegmentNum = chain[0].length;
		this.partitions = [];
		let currentPartition;
		this.ends = [];
		this.ends.push(chain[0][0]);
		this.ends.push(chain[chain.length - 1][0]);

		// calculate vertex and normal points
		let last = [ 1, 0, 0 ];
		for ( let i = 0, ii = chain.length; i < ii; i++) {
			if (!currentPartition || currentPartition.positionData.length > 65000) {
				if (this.partitions.length > 0) {
					i--;
				}
				currentPartition = {
					count : 0,
					positionData : [],
					normalData : [],
					indexData : []
				};
				this.partitions.push(currentPartition);
			}

			let residue = chain[i];

			currentPartition.count++;
			let min = Infinity;
			// let p = new structures.Atom('', chain[i].cp1.x, chain[i].cp1.y, chain[i].cp1.z);
			for ( let j = 0; j < lineSegmentNum; j++) {
				let currentPoint = residue[j];
				let nextPoint;
				if (j === lineSegmentNum - 1) {
					if (i === chain.length - 1) {
						nextPoint = residue[j - 1];
					} else {
						nextPoint = chain[i + 1][0];
					}
				} else {
					nextPoint = residue[j + 1];
				}

				let axis = [ nextPoint.x - currentPoint.x, nextPoint.y - currentPoint.y, nextPoint.z - currentPoint.z ];
				v3.normalize(axis);
				if (i === chain.length - 1 && j === lineSegmentNum - 1) {
					v3.scale(axis, -1);
				}
				let startVector = v3.cross(axis, last, []);
				v3.normalize(startVector);
				v3.scale(startVector, thickness / 2);
				let rotator = new PointRotator(startVector, axis, 2 * Math.PI / cylinderResolution);
				for ( let k = 0, kk = cylinderResolution; k < kk; k++) {
					let use = rotator.rotate();
					if (k === m.floor(cylinderResolution / 4)) {
						last = [ use[0], use[1], use[2] ];
					}
					currentPartition.normalData.push(use[0], use[1], use[2]);
					currentPartition.positionData.push(currentPoint.x + use[0], currentPoint.y + use[1], currentPoint.z + use[2]);
				}
			}
		}

		// build mesh connectivity
		for ( let n = 0, nn = this.partitions.length; n < nn; n++) {
			let currentPartition = this.partitions[n];
			for ( let i = 0, ii = currentPartition.count - 1; i < ii; i++) {
				let indexStart = i * lineSegmentNum * cylinderResolution;
				for ( let j = 0, jj = lineSegmentNum; j < jj; j++) {
					let segmentIndexStart = indexStart + j * cylinderResolution;
					for ( let k = 0; k <= cylinderResolution; k++) {
						let sk = segmentIndexStart + k % cylinderResolution;
						currentPartition.indexData.push(sk, sk + cylinderResolution);
					}
				}
			}
		}

		this.storeData(this.partitions[0].positionData, this.partitions[0].normalData, this.partitions[0].indexData);
	};
	let _ = d3.CatmullTube.prototype = new d3._Mesh();
	_.render = function(gl, styles) {
		// draw tube
		this.bindBuffers(gl);

		// render
		for ( let i = 0, ii = this.partitions.length; i < ii; i++) {
			let p = this.partitions[i];
			loadPartition(gl, p);
			// render
			gl.drawElements(gl.TRIANGLE_STRIP, p.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}

		// draw ends
		gl.sphereBuffer.bindBuffers(gl);
		for ( let i = 0; i < 2; i++) {
			let p = this.ends[i];
			let transform = m4.translate(m4.identity(), [ p.x, p.y, p.z ]);
			let radius = styles.proteins_tubeThickness / 2;
			m4.scale(transform, [ radius, radius, radius ]);
			// render
			gl.shader.setMatrixUniforms(gl, transform);
			gl.drawElements(gl.TRIANGLES, gl.sphereBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	};

})(ChemDoodle.extensions, ChemDoodle.RESIDUE, ChemDoodle.structures, ChemDoodle.structures.d3, Math, ChemDoodle.lib.mat4, ChemDoodle.lib.vec3, ChemDoodle.math);

(function(d3, io, m4, v3, undefined) {
	'use strict';
	d3.UnitCell = function(lengths, angles, offset) {
		// store data
		this.lengths = lengths;
		this.angles = angles;
		this.offset = offset;

		let abc2xyz = io.CIFInterpreter.generateABC2XYZ(lengths[0], lengths[1], lengths[2], angles[0], angles[1], angles[2]);

		if(!offset){
			this.offset = [0,0,0];
		}

		this.unitCellVectors = {
			o : m4.multiplyVec3(abc2xyz, this.offset, []),
			x : m4.multiplyVec3(abc2xyz, [ this.offset[0] + 1, this.offset[1], this.offset[2] ]),
			y : m4.multiplyVec3(abc2xyz, [ this.offset[0], this.offset[1] + 1, this.offset[2] ]),
			z : m4.multiplyVec3(abc2xyz, [ this.offset[0], this.offset[1], this.offset[2] + 1 ]),
			xy : m4.multiplyVec3(abc2xyz, [ this.offset[0] + 1, this.offset[1] + 1, this.offset[2] ]),
			xz : m4.multiplyVec3(abc2xyz, [ this.offset[0] + 1, this.offset[1], this.offset[2] + 1 ]),
			yz : m4.multiplyVec3(abc2xyz, [ this.offset[0], this.offset[1] + 1, this.offset[2] + 1 ]),
			xyz : m4.multiplyVec3(abc2xyz, [ this.offset[0] + 1, this.offset[1] + 1, this.offset[2] + 1 ])
		};

		let positionData = [];
		let normalData = [];
		// calculate vertex and normal points

		let pushSide = function(p1, p2, p3, p4) {
			positionData.push(p1[0], p1[1], p1[2]);
			positionData.push(p2[0], p2[1], p2[2]);
			positionData.push(p3[0], p3[1], p3[2]);
			positionData.push(p4[0], p4[1], p4[2]);
			// push 0s for normals so shader gives them full color
			for ( let i = 0; i < 4; i++) {
				normalData.push(0, 0, 0);
			}
		};
		pushSide(this.unitCellVectors.o, this.unitCellVectors.x, this.unitCellVectors.xy, this.unitCellVectors.y);
		pushSide(this.unitCellVectors.o, this.unitCellVectors.y, this.unitCellVectors.yz, this.unitCellVectors.z);
		pushSide(this.unitCellVectors.o, this.unitCellVectors.z, this.unitCellVectors.xz, this.unitCellVectors.x);
		pushSide(this.unitCellVectors.yz, this.unitCellVectors.y, this.unitCellVectors.xy, this.unitCellVectors.xyz);
		pushSide(this.unitCellVectors.xyz, this.unitCellVectors.xz, this.unitCellVectors.z, this.unitCellVectors.yz);
		pushSide(this.unitCellVectors.xy, this.unitCellVectors.x, this.unitCellVectors.xz, this.unitCellVectors.xyz);

		// build mesh connectivity
		let indexData = [];
		for ( let i = 0; i < 6; i++) {
			let start = i * 4;
			// sides
			indexData.push(start, start + 1, start + 1, start + 2, start + 2, start + 3, start + 3, start);
		}

		this.storeData(positionData, normalData, indexData);
	};
	let _ = d3.UnitCell.prototype = new d3._Mesh();
	_.render = function(gl, styles) {
		gl.shader.setMatrixUniforms(gl);
		this.bindBuffers(gl);
		// colors
		gl.material.setDiffuseColor(gl, styles.shapes_color);
		gl.lineWidth(styles.shapes_lineWidth);
		// render
		gl.drawElements(gl.LINES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	};

})(ChemDoodle.structures.d3, ChemDoodle.io, ChemDoodle.lib.mat4, ChemDoodle.lib.vec3);

(function(d3, math, document, undefined) {
	'use strict';
	d3.Framebuffer = function() {
	};
	let _ = d3.Framebuffer.prototype;

	_.init = function(gl) {
		this.framebuffer = gl.createFramebuffer();
	};

	_.setColorTexture = function(gl, texture, attachment) {
		let i = attachment === undefined ? 0 : attachment;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	};
	_.setColorRenderbuffer = function(gl, renderbuffer, attachment) {
		let i = attachment === undefined ? 0 : attachment;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.RENDERBUFFER, renderbuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	};
	_.setDepthTexture = function(gl, texture) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	};
	_.setDepthRenderbuffer = function(gl, renderbuffer) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	};
	_.bind = function(gl, width, height) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.viewport(0, 0, width, height);
	};

})(ChemDoodle.structures.d3, ChemDoodle.math, document);

(function(d3, math, document, undefined) {
	'use strict';
	d3.Renderbuffer = function() {
	};
	let _ = d3.Renderbuffer.prototype;

	_.init = function(gl, format) {
		this.renderbuffer = gl.createRenderbuffer();
		this.format = format;
	};

	_.setParameter = function(gl, width, height) {
		this.width = width;
		this.height = height;
		
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, this.format, this.width, this.height);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	};

})(ChemDoodle.structures.d3, ChemDoodle.math, document);

(function(math, d3, m, undefined) {
	'use strict';
	d3.SSAO = function() {
	};
	let _ = d3.SSAO.prototype;

	_.initSampleKernel = function(kernelSize) {
		let sampleKernel = [];

		for(let i = 0; i < kernelSize; i++) {
			let x = m.random() * 2.0 - 1.0;
			let y = m.random() * 2.0 - 1.0;
			let z = m.random() * 2.0 - 1.0;

			let scale = i / kernelSize;
			let scale2 = scale * scale;
			let lerp = 0.1 + scale2 * 0.9;

			x *= lerp;
			y *= lerp;
			z *= lerp;

			sampleKernel.push(x, y, z);
		}

		this.sampleKernel = new Float32Array(sampleKernel);
	};

	_.initNoiseTexture = function(gl) {
		let noiseSize = 16;
		let ssaoNoise = [];

		for(let i = 0; i < noiseSize; i++) {
			ssaoNoise.push(m.random() * 2 - 1);
			ssaoNoise.push(m.random() * 2 - 1);
			ssaoNoise.push(0.0);
		}

		this.noiseTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 4, 4, 0, gl.RGB, gl.FLOAT, new Float32Array(ssaoNoise));
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		gl.bindTexture(gl.TEXTURE_2D, null);
	};

})(ChemDoodle.math, ChemDoodle.structures.d3, Math);

(function(d3, math, document, undefined) {
	'use strict';
	d3.Texture = function() {
	};
	let _ = d3.Texture.prototype;

	_.init = function(gl, type, internalFormat, format) {
		this.texture = gl.createTexture();
		this.type = type;
		this.internalFormat = internalFormat;
		this.format = format !== undefined ? format : internalFormat;

		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	_.setParameter = function(gl, width, height) {
		this.width = width;
		this.height = height;

		// set texture dimension
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};

})(ChemDoodle.structures.d3, ChemDoodle.math, document);

(function(d3, m3, m4, document, undefined) {
	'use strict';
	d3._Shader = function() {
	};
	let _ = d3._Shader.prototype;
	_.useShaderProgram = function(gl) {
		gl.useProgram(this.gProgram);
		gl.shader = this;
	};
	_.init = function(gl) {
		let vertexShader = this.getShader(gl, 'vertex-shader');
		if (!vertexShader) {
			vertexShader = this.loadDefaultVertexShader(gl);
		}
		let fragmentShader = this.getShader(gl, 'fragment-shader');
		if (!fragmentShader) {
			fragmentShader = this.loadDefaultFragmentShader(gl);
		}

		this.gProgram = gl.createProgram();

		gl.attachShader(this.gProgram, vertexShader);
		gl.attachShader(this.gProgram, fragmentShader);
		
		this.onShaderAttached(gl);

		gl.linkProgram(this.gProgram);

		if (!gl.getProgramParameter(this.gProgram, gl.LINK_STATUS)) {
			alert('Could not initialize shaders: ' + gl.getProgramInfoLog(this.gProgram));
		}

		gl.useProgram(this.gProgram);
		this.initUniformLocations(gl);
		gl.useProgram(null);
	};
	_.onShaderAttached = function(gl) {
		// set vertex attributes explicitly
		this.vertexPositionAttribute = 0;
		this.vertexNormalAttribute = 1;

		gl.bindAttribLocation(this.gProgram, this.vertexPositionAttribute, 'a_vertex_position');
		gl.bindAttribLocation(this.gProgram, this.vertexNormalAttribute, 'a_vertex_normal');
	};
	_.getShaderFromStr = function(gl, shaderType, strSrc) {
		let shader = gl.createShader(shaderType);
		gl.shaderSource(shader, strSrc);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(shaderScript.type + ' ' + gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return undefined;
		}
		return shader;
	};
	_.enableAttribsArray = function(gl) {
		gl.enableVertexAttribArray(this.vertexPositionAttribute);
	};
	_.disableAttribsArray = function(gl) {
		gl.disableVertexAttribArray(this.vertexPositionAttribute);
	};
	_.getShader = function(gl, id) {
		let shaderScript = document.getElementById(id);
		if (!shaderScript) {
			return undefined;
		}
		let sb = [];
		let k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType === 3) {
				sb.push(k.textContent);
			}
			k = k.nextSibling;
		}
		let sdrSrc = sb.join('');
		let shader;
		if (shaderScript.type === 'x-shader/x-fragment') {
			shader = this.getShaderFromStr(gl, gl.FRAGMENT_SHADER, sdrSrc);
		} else if (shaderScript.type === 'x-shader/x-vertex') {
			shader = this.getShaderFromStr(gl, gl.VERTEX_SHADER, sdrSrc);
		} else {
			return undefined;
		}
		return shader;
	};
	_.initUniformLocations = function(gl) {
		this.modelViewMatrixUniform = gl.getUniformLocation(this.gProgram, 'u_model_view_matrix');
		this.projectionMatrixUniform = gl.getUniformLocation(this.gProgram, 'u_projection_matrix');
	};
	_.loadDefaultVertexShader = function(gl) {
	};
	_.loadDefaultFragmentShader = function(gl) {
	};
	_.setMatrixUniforms = function(gl, modelMatrix) {
		if(modelMatrix === undefined) {
			this.setModelViewMatrix(gl, gl.modelViewMatrix);
		} else {
			this.setModelViewMatrix(gl, m4.multiply(gl.modelViewMatrix, modelMatrix, []));
		}
	};
	_.setProjectionMatrix = function(gl, matrix) {
		gl.uniformMatrix4fv(this.projectionMatrixUniform, false, matrix);
	};
	_.setModelViewMatrix = function(gl, mvMatrix) {
		gl.uniformMatrix4fv(this.modelViewMatrixUniform, false, mvMatrix);
	};
	_.setMaterialAmbientColor = function(gl, ambient) {
	};
	_.setMaterialDiffuseColor = function(gl, diffuse) {
	};
	_.setMaterialSpecularColor = function(gl, specular) {
	};
	_.setMaterialShininess = function(gl, shininess) {
	};
	_.setMaterialAlpha = function(gl, alpha) {
	};

})(ChemDoodle.structures.d3, ChemDoodle.lib.mat3, ChemDoodle.lib.mat4, document);

(function(d3, m3, m4, document, undefined) {
	'use strict';

	d3.FXAAShader = function() {
	};
	let _super = d3._Shader.prototype;
	let _ = d3.FXAAShader.prototype = new d3._Shader();
	_.initUniformLocations = function(gl) {
		// assign uniform properties
		_super.initUniformLocations.call(this, gl);
		this.buffersizeUniform = gl.getUniformLocation(this.gProgram, 'u_buffersize');
		this.antialiasUniform = gl.getUniformLocation(this.gProgram, 'u_antialias');

		this.edgeThresholdUniform = gl.getUniformLocation(this.gProgram, 'u_edge_threshold');
		this.edgeThresholdMinUniform = gl.getUniformLocation(this.gProgram, 'u_edge_threshold_min');
		this.searchStepsUniform = gl.getUniformLocation(this.gProgram, 'u_search_steps');
		this.searchThresholdUniform = gl.getUniformLocation(this.gProgram, 'u_search_threshold');
		this.subpixCapUniform = gl.getUniformLocation(this.gProgram, 'u_subpix_cap');
		this.subpixTrimUniform = gl.getUniformLocation(this.gProgram, 'u_subpix_trim');
	};
	_.setBuffersize = function(gl, width, height) {
		gl.uniform2f(this.buffersizeUniform, width, height);
	};
	_.setAntialias = function(gl, val) {
		gl.uniform1f(this.antialiasUniform, val);
	};
	_.setEdgeThreshold = function(gl, val) {
		gl.uniform1f(this.edgeThresholdUniform, val);
	};
	_.setEdgeThresholdMin = function(gl, val) {
		gl.uniform1f(this.edgeThresholdMinUniform, val);
	};
	_.setSearchSteps = function(gl, val) {
		gl.uniform1i(this.searchStepsUniform, val);
	};
	_.setSearchThreshold = function(gl, val) {
		gl.uniform1f(this.searchThresholdUniform, val);
	};
	_.setSubpixCap = function(gl, val) {
		gl.uniform1f(this.subpixCapUniform, val);
	};
	_.setSubpixTrim = function(gl, val) {
		gl.uniform1f(this.subpixTrimUniform, val);
	};
	_.loadDefaultVertexShader = function(gl) {
		let sb = [
		'precision mediump float;',
		
		// attributes set when rendering objects
		'attribute vec3 a_vertex_position;',

    	'varying vec2 v_texcoord;',

		'void main() {',
			'gl_Position = vec4(a_vertex_position, 1.);',
        	'v_texcoord = a_vertex_position.xy * .5 + .5;',
		'}'].join('');

		return this.getShaderFromStr(gl, gl.VERTEX_SHADER, sb);
	};

	_.loadDefaultFragmentShader = function(gl) {
		let sb = [
		'precision mediump float;',

		'const int fxaaMaxSearchSteps = 128;',

		'uniform float u_edge_threshold;',
		'uniform float u_edge_threshold_min;',
		'uniform int u_search_steps;',
		'uniform float u_search_threshold;',
		'uniform float u_subpix_cap;',
		'uniform float u_subpix_trim;',

		'uniform sampler2D u_sampler0;',
		'uniform vec2 u_buffersize;',
		'uniform bool u_antialias;',

		'varying vec2 v_texcoord;',

		'float FxaaLuma(vec3 rgb) {',
			'return rgb.y * (0.587/0.299) + rgb.x;',
		'}',

		'vec3 FxaaLerp3(vec3 a, vec3 b, float amountOfA) {',
		    'return (vec3(-amountOfA) * b) + ((a * vec3(amountOfA)) + b);',
		'}',

		'vec4 FxaaTexOff(sampler2D tex, vec2 pos, vec2 off, vec2 rcpFrame) {',
		    'return texture2D(tex, pos + off * rcpFrame);',
		'}',

		'vec3 FxaaPixelShader(vec2 pos, sampler2D tex, vec2 rcpFrame) {',
			'float subpix_trim_scale = (1.0/(1.0 - u_subpix_trim));',
		    'vec3 rgbN = FxaaTexOff(tex, pos.xy, vec2( 0.,-1.), rcpFrame).xyz;',
		    'vec3 rgbW = FxaaTexOff(tex, pos.xy, vec2(-1., 0.), rcpFrame).xyz;',
		    'vec3 rgbM = FxaaTexOff(tex, pos.xy, vec2( 0., 0.), rcpFrame).xyz;',
		    'vec3 rgbE = FxaaTexOff(tex, pos.xy, vec2( 1., 0.), rcpFrame).xyz;',
		    'vec3 rgbS = FxaaTexOff(tex, pos.xy, vec2( 0., 1.), rcpFrame).xyz;',

		    'float lumaN = FxaaLuma(rgbN);',
		    'float lumaW = FxaaLuma(rgbW);',
		    'float lumaM = FxaaLuma(rgbM);',
		    'float lumaE = FxaaLuma(rgbE);',
		    'float lumaS = FxaaLuma(rgbS);',
		    'float rangeMin = min(lumaM, min(min(lumaN, lumaW), min(lumaS, lumaE)));',
		    'float rangeMax = max(lumaM, max(max(lumaN, lumaW), max(lumaS, lumaE)));',

		    'float range = rangeMax - rangeMin;',
		    'if(range < max(u_edge_threshold_min, rangeMax * u_edge_threshold)) {',
		        'return rgbM;',
		    '}',

		    'vec3 rgbL = rgbN + rgbW + rgbM + rgbE + rgbS;',

		    'float lumaL = (lumaN + lumaW + lumaE + lumaS) * 0.25;',
		    'float rangeL = abs(lumaL - lumaM);',
		    'float blendL = max(0.0, (rangeL / range) - u_subpix_trim) * subpix_trim_scale;',
		    'blendL = min(u_subpix_cap, blendL);',

		    'vec3 rgbNW = FxaaTexOff(tex, pos.xy, vec2(-1.,-1.), rcpFrame).xyz;',
		    'vec3 rgbNE = FxaaTexOff(tex, pos.xy, vec2( 1.,-1.), rcpFrame).xyz;',
		    'vec3 rgbSW = FxaaTexOff(tex, pos.xy, vec2(-1., 1.), rcpFrame).xyz;',
		    'vec3 rgbSE = FxaaTexOff(tex, pos.xy, vec2( 1., 1.), rcpFrame).xyz;',
		    'rgbL += (rgbNW + rgbNE + rgbSW + rgbSE);',
		    'rgbL *= vec3(1.0/9.0);',

		    'float lumaNW = FxaaLuma(rgbNW);',
		    'float lumaNE = FxaaLuma(rgbNE);',
		    'float lumaSW = FxaaLuma(rgbSW);',
		    'float lumaSE = FxaaLuma(rgbSE);',

		    'float edgeVert =',
		        'abs((0.25 * lumaNW) + (-0.5 * lumaN) + (0.25 * lumaNE)) +',
		        'abs((0.50 * lumaW ) + (-1.0 * lumaM) + (0.50 * lumaE )) +',
		        'abs((0.25 * lumaSW) + (-0.5 * lumaS) + (0.25 * lumaSE));',
		    'float edgeHorz =',
		        'abs((0.25 * lumaNW) + (-0.5 * lumaW) + (0.25 * lumaSW)) +',
		        'abs((0.50 * lumaN ) + (-1.0 * lumaM) + (0.50 * lumaS )) +',
		        'abs((0.25 * lumaNE) + (-0.5 * lumaE) + (0.25 * lumaSE));',

		    'bool horzSpan = edgeHorz >= edgeVert;',
		    'float lengthSign = horzSpan ? -rcpFrame.y : -rcpFrame.x;',

		    'if(!horzSpan) {',
		        'lumaN = lumaW;',
		        'lumaS = lumaE;',
		    '}',

		    'float gradientN = abs(lumaN - lumaM);',
		    'float gradientS = abs(lumaS - lumaM);',
		    'lumaN = (lumaN + lumaM) * 0.5;',
		    'lumaS = (lumaS + lumaM) * 0.5;',

		    'if (gradientN < gradientS) {',
		        'lumaN = lumaS;',
		        'lumaN = lumaS;',
		        'gradientN = gradientS;',
		        'lengthSign *= -1.0;',
		    '}',

		    'vec2 posN;',
		    'posN.x = pos.x + (horzSpan ? 0.0 : lengthSign * 0.5);',
		    'posN.y = pos.y + (horzSpan ? lengthSign * 0.5 : 0.0);',

		    'gradientN *= u_search_threshold;',

		    'vec2 posP = posN;',
		    'vec2 offNP = horzSpan ? vec2(rcpFrame.x, 0.0) : vec2(0.0, rcpFrame.y);',
		    'float lumaEndN = lumaN;',
		    'float lumaEndP = lumaN;',
		    'bool doneN = false;',
		    'bool doneP = false;',
		    'posN += offNP * vec2(-1.0, -1.0);',
		    'posP += offNP * vec2( 1.0,  1.0);',

		    'for(int i = 0; i < fxaaMaxSearchSteps; i++) {',
		    	'if(i >= u_search_steps) break;',
		        'if(!doneN) {',
		            'lumaEndN = FxaaLuma(texture2D(tex, posN.xy).xyz);',
		        '}',
		        'if(!doneP) {',
		            'lumaEndP = FxaaLuma(texture2D(tex, posP.xy).xyz);',
		        '}',

		        'doneN = doneN || (abs(lumaEndN - lumaN) >= gradientN);',
		        'doneP = doneP || (abs(lumaEndP - lumaN) >= gradientN);',

		        'if(doneN && doneP) {',
		            'break;',
		        '}',
		        'if(!doneN) {',
		            'posN -= offNP;',
		        '}',
		        'if(!doneP) {',
		            'posP += offNP;',
		        '}',
		    '}',

		    'float dstN = horzSpan ? pos.x - posN.x : pos.y - posN.y;',
		    'float dstP = horzSpan ? posP.x - pos.x : posP.y - pos.y;',
		    'bool directionN = dstN < dstP;',
		    'lumaEndN = directionN ? lumaEndN : lumaEndP;',

		    'if(((lumaM - lumaN) < 0.0) == ((lumaEndN - lumaN) < 0.0)) {',
		        'lengthSign = 0.0;',
		    '}',


		    'float spanLength = (dstP + dstN);',
		    'dstN = directionN ? dstN : dstP;',
		    'float subPixelOffset = (0.5 + (dstN * (-1.0/spanLength))) * lengthSign;',
		    'vec3 rgbF = texture2D(tex, vec2(',
		        'pos.x + (horzSpan ? 0.0 : subPixelOffset),',
		        'pos.y + (horzSpan ? subPixelOffset : 0.0))).xyz;',
		    'return FxaaLerp3(rgbL, rgbF, blendL);',
		'}',

		'void main() {',
			'gl_FragColor = texture2D(u_sampler0, v_texcoord);',
			'if(u_antialias) {',
				'gl_FragColor.xyz = FxaaPixelShader(v_texcoord, u_sampler0, 1. / u_buffersize).xyz;',
			'}',
		'}'
		].join('\n');

		return this.getShaderFromStr(gl, gl.FRAGMENT_SHADER, sb);
	};

})(ChemDoodle.structures.d3, ChemDoodle.lib.mat3, ChemDoodle.lib.mat4, document);

(function(d3, m3, m4, document, undefined) {
	'use strict';
	d3.LabelShader = function() {
	};
	let _super = d3._Shader.prototype;
	let _ = d3.LabelShader.prototype = new d3._Shader();
	_.initUniformLocations = function(gl) {
		_super.initUniformLocations.call(this, gl);
		this.dimensionUniform = gl.getUniformLocation(this.gProgram, 'u_dimension');
	};
	_.onShaderAttached = function(gl) {
		_super.onShaderAttached.call(this, gl);
		this.vertexTexCoordAttribute = 2;
		gl.bindAttribLocation(this.gProgram, this.vertexTexCoordAttribute, 'a_vertex_texcoord');
	};
	_.loadDefaultVertexShader = function(gl) {
		let sb = [
		'precision mediump float;',
		
		// attributes set when rendering objects
		'attribute vec3 a_vertex_position;',
		'attribute vec3 a_vertex_normal;',
		'attribute vec2 a_vertex_texcoord;',

		// matrices set by gl.setMatrixUniforms
		'uniform mat4 u_model_view_matrix;',
		'uniform mat4 u_projection_matrix;',
		'uniform vec2 u_dimension;',

		// sent to the fragment shader
		'varying vec2 v_texcoord;',

		'void main() {',

			'gl_Position = u_model_view_matrix * vec4(a_vertex_position, 1.);',

			'vec4 depth_pos = vec4(gl_Position);',

			'depth_pos.z += a_vertex_normal.z;',

			'gl_Position = u_projection_matrix * gl_Position;',

			'depth_pos = u_projection_matrix * depth_pos;',

			'gl_Position /= gl_Position.w;',

			'gl_Position.xy += a_vertex_normal.xy / u_dimension * 2.;',

			'gl_Position.z = depth_pos.z / depth_pos.w;',

			'v_texcoord = a_vertex_texcoord;',

		'}'].join('');

		return this.getShaderFromStr(gl, gl.VERTEX_SHADER, sb);
	};
	_.loadDefaultFragmentShader = function(gl) {
		let sb = [
		// set macro for depth mmap texture
		gl.depthTextureExt ? '#define CWC_DEPTH_TEX\n' : '',
		
		// set float precision
		'precision mediump float;',

		// texture for draw text nor shadow map
		'uniform sampler2D u_image;',
					
		// from the vertex shader
		'varying vec2 v_texcoord;',

		'void main(void) {',
			'gl_FragColor = texture2D(u_image, v_texcoord);',
		'}'
		].join('');

		return this.getShaderFromStr(gl, gl.FRAGMENT_SHADER, sb);
	};
	_.enableAttribsArray = function(gl) {
		_super.enableAttribsArray.call(this, gl);
		gl.enableVertexAttribArray(this.vertexNormalAttribute);
		gl.enableVertexAttribArray(this.vertexTexCoordAttribute);
	};
	_.disableAttribsArray = function(gl) {
		_super.disableAttribsArray.call(this, gl);
		gl.disableVertexAttribArray(this.vertexNormalAttribute);
		gl.disableVertexAttribArray(this.vertexTexCoordAttribute);
	};
	_.setDimension = function(gl, width, height) {
		gl.uniform2f(this.dimensionUniform, width, height);
	};

})(ChemDoodle.structures.d3, ChemDoodle.lib.mat3, ChemDoodle.lib.mat4, document);

(function(d3, m3, m4, document, undefined) {
	'use strict';

	d3.LightingShader = function() {
	};
	let _super = d3._Shader.prototype;
	let _ = d3.LightingShader.prototype = new d3._Shader();
	
	_.initUniformLocations = function(gl) {
		_super.initUniformLocations.call(this, gl);
		// assign uniform properties
		this.positionSampleUniform = gl.getUniformLocation(this.gProgram, 'u_position_sample');
		this.colorSampleUniform = gl.getUniformLocation(this.gProgram, 'u_color_sample');
		this.ssaoSampleUniform = gl.getUniformLocation(this.gProgram, 'u_ssao_sample');
		this.outlineSampleUniform = gl.getUniformLocation(this.gProgram, 'u_outline_sample');
	};
	_.loadDefaultVertexShader = function(gl) {
		let sb = [
		'precision mediump float;',
		
		// attributes set when rendering objects
		'attribute vec3 a_vertex_position;',

		// sent to the fragment shader
    	'varying vec2 v_texcoord;',

		'void main() {',
			'gl_Position = vec4(a_vertex_position, 1.);',
        	'v_texcoord = a_vertex_position.xy * .5 + .5;',
		'}'].join('');

		return this.getShaderFromStr(gl, gl.VERTEX_SHADER, sb);
	};
	_.loadDefaultFragmentShader = function(gl) {
		let sb = [

		// set float precision
		'precision mediump float;',

	    'uniform sampler2D u_position_sample;',
	    'uniform sampler2D u_color_sample;',
		'uniform sampler2D u_ssao_sample;',
		'uniform sampler2D u_outline_sample;',
	    
    	'varying vec2 v_texcoord;',

	    'void main() {',
	    	'vec4 position = texture2D(u_position_sample, v_texcoord);',
	    	'vec4 color = texture2D(u_color_sample, v_texcoord);',
			'vec4 ao = texture2D(u_ssao_sample, v_texcoord);',
			'float outline = texture2D(u_outline_sample, v_texcoord).r;',

			// skip background color
	    	'if(position.w == 0. && outline == 1.) {',
				// 'gl_FragColor = vec4(0., 0., 0., 1.);',
	    		'return;',
	    	'}',

			'gl_FragColor = vec4(color.rgb * ao.r * outline, 1.);',
	    '}'].join('');

		return this.getShaderFromStr(gl, gl.FRAGMENT_SHADER, sb);
	};

})(ChemDoodle.structures.d3, ChemDoodle.lib.mat3, ChemDoodle.lib.mat4, document);

(function(d3, m3, m4, document, undefined) {
	'use strict';

	d3.NormalShader = function() {
	};
	let _super = d3._Shader.prototype;
	let _ = d3.NormalShader.prototype = new d3._Shader();
	_.initUniformLocations = function(gl) {
		_super.initUniformLocations.call(this, gl);
		// assign uniform properties
		this.normalMatrixUniform = gl.getUniformLocation(this.gProgram, 'u_normal_matrix');
	};
	_.loadDefaultVertexShader = function(gl) {
		let sb = [
		'precision mediump float;',
		
		// attributes set when rendering objects
		'attribute vec3 a_vertex_position;',
		'attribute vec3 a_vertex_normal;',

		// matrices set by gl.setMatrixUniforms
		'uniform mat4 u_model_view_matrix;',
		'uniform mat4 u_projection_matrix;',
		'uniform mat3 u_normal_matrix;',

		// sent to the fragment shader
		'varying vec3 v_normal;',

		'void main() {',

			'v_normal = length(a_vertex_normal)==0. ? a_vertex_normal : u_normal_matrix * a_vertex_normal;',
			
			'gl_Position = u_projection_matrix * u_model_view_matrix * vec4(a_vertex_position, 1.);',

		'}'].join('');
		
		return this.getShaderFromStr(gl, gl.VERTEX_SHADER, sb);
	};
	_.loadDefaultFragmentShader = function(gl) {
		let sb = [
		
		// set float precision
		'precision mediump float;',
					
		'varying vec3 v_normal;',

		'void main(void) {',
			'vec3 normal = length(v_normal)==0. ? vec3(0., 0., 1.) : normalize(v_normal);',
			'gl_FragColor = vec4(normal, 0.);',
		'}'].join('');
		
		return this.getShaderFromStr(gl, gl.FRAGMENT_SHADER, sb);
	};
	_.enableAttribsArray = function(gl) {
		_super.enableAttribsArray.call(this, gl);
		gl.enableVertexAttribArray(this.vertexNormalAttribute);
	};
	_.disableAttribsArray = function(gl) {
		_super.disableAttribsArray.call(this, gl);
		gl.disableVertexAttribArray(this.vertexNormalAttribute);
	};
	_.setModelViewMatrix = function(gl, mvMatrix) {
		_super.setModelViewMatrix.call(this, gl, mvMatrix);
		// create the normal matrix and push it to the graphics card
		let normalMatrix = m3.transpose(m4.toInverseMat3(mvMatrix, []));
		gl.uniformMatrix3fv(this.normalMatrixUniform, false, normalMatrix);
	};

})(ChemDoodle.structures.d3, ChemDoodle.lib.mat3, ChemDoodle.lib.mat4, document);

(function(d3, m3, m4, document, undefined) {
	'use strict';

	d3.OutlineShader = function() {
	};
	let _super = d3._Shader.prototype;
	let _ = d3.OutlineShader.prototype = new d3._Shader();

	_.initUniformLocations = function(gl) {
		_super.initUniformLocations.call(this, gl);
		this.normalSampleUniform = gl.getUniformLocation(this.gProgram, 'u_normal_sample');
		this.depthSampleUniform = gl.getUniformLocation(this.gProgram, 'u_depth_sample');
		this.gbufferTextureSizeUniform = gl.getUniformLocation(this.gProgram, 'u_gbuffer_texture_size');

		this.normalThresholdUniform = gl.getUniformLocation(this.gProgram, 'u_normal_threshold');
		this.depthThresholdUniform = gl.getUniformLocation(this.gProgram, 'u_depth_threshold');
		this.thicknessUniform = gl.getUniformLocation(this.gProgram, 'u_thickness');
	};
	_.loadDefaultVertexShader = function(gl) {
		let sb = [
		'precision mediump float;',
		
		// attributes set when rendering objects
		'attribute vec3 a_vertex_position;',

    	'varying vec2 v_texcoord;',

		'void main() {',
			'gl_Position = vec4(a_vertex_position, 1.);',
        	'v_texcoord = a_vertex_position.xy * .5 + .5;',
		'}'].join('');

		return this.getShaderFromStr(gl, gl.VERTEX_SHADER, sb);
	};
	_.loadDefaultFragmentShader = function(gl) {
		let sb = [
		// set float precision
		'precision mediump float;',

	    'uniform sampler2D u_normal_sample;',
	    'uniform sampler2D u_depth_sample;',

	    'uniform float u_normal_threshold;',
	    'uniform float u_depth_threshold;',

	    'uniform float u_thickness;',

	    'uniform vec2 u_gbuffer_texture_size;',

	    
	    'varying vec2 v_texcoord;',

	    'void main() {',
	    	'vec3 normal = texture2D(u_normal_sample, v_texcoord).xyz;',
	    	'float depth = texture2D(u_depth_sample, v_texcoord).r;',

	    	// check background pixel
	    	// 'if(depth == 1.) {',
	    	// 	'return;',
	    	// '}',

	    	'vec2 texelSize = u_thickness/u_gbuffer_texture_size * .5;',
	    	'vec2 offsets[8];',

			'offsets[0] = vec2(-texelSize.x, -texelSize.y);',
			'offsets[1] = vec2(-texelSize.x, 0);',
			'offsets[2] = vec2(-texelSize.x, texelSize.y);',

			'offsets[3] = vec2(0, -texelSize.y);',
			'offsets[4] = vec2(0,  texelSize.y);',

			'offsets[5] = vec2(texelSize.x, -texelSize.y);',
			'offsets[6] = vec2(texelSize.x, 0);',
			'offsets[7] = vec2(texelSize.x, texelSize.y);',

			'float edge = 0.;',

			'for (int i = 0; i < 8; i++) {',
				'vec3 sampleNorm = texture2D(u_normal_sample, v_texcoord + offsets[i]).xyz;',

				'if(normal == vec3(.0, .0, .0)) {',
					'if(sampleNorm != vec3(.0, .0, .0)) {',
						'edge = 1.0;',
						'break;',
					'}',
					'continue;',
				'}',

				'if (dot(sampleNorm, normal) < u_normal_threshold) {',
					'edge = 1.0;',
					'break;',
				'}',

				'float sampleDepth = texture2D(u_depth_sample, v_texcoord + offsets[i]).r;',
				'if (abs(sampleDepth - depth) > u_depth_threshold) {',
					'edge = 1.0;',
					'break;',
				'}',
			'}',

			'edge = 1. - edge;',

		    'gl_FragColor = vec4(edge, edge, edge, 1.);',
	    '}'].join('');

		return this.getShaderFromStr(gl, gl.FRAGMENT_SHADER, sb);
	};
	_.setGbufferTextureSize = function(gl, width, height) {
		gl.uniform2f(this.gbufferTextureSizeUniform, width, height);
	};
	_.setNormalThreshold = function(gl, value) {
		gl.uniform1f(this.normalThresholdUniform, value);
	};
	_.setDepthThreshold = function(gl, value) {
		gl.uniform1f(this.depthThresholdUniform, value);
	};
	_.setThickness = function(gl, value) {
		gl.uniform1f(this.thicknessUniform, value);
	};

})(ChemDoodle.structures.d3, ChemDoodle.lib.mat3, ChemDoodle.lib.mat4, document);

(function(d3, m3, m4, document, undefined) {
	'use strict';

	d3.PhongShader = function() {
	};
	let _super = d3._Shader.prototype;
	let _ = d3.PhongShader.prototype = new d3._Shader();
	_.initUniformLocations = function(gl) {
		_super.initUniformLocations.call(this, gl);
		// assign uniform properties
		this.shadowUniform = gl.getUniformLocation(this.gProgram, 'u_shadow');
		this.flatColorUniform = gl.getUniformLocation(this.gProgram, 'u_flat_color');
		this.normalMatrixUniform = gl.getUniformLocation(this.gProgram, 'u_normal_matrix');
		
		this.lightModelViewMatrixUniform = gl.getUniformLocation(this.gProgram, 'u_light_model_view_matrix');
		this.lightProjectionMatrixUniform = gl.getUniformLocation(this.gProgram, 'u_light_projection_matrix');

		this.lightDiffuseColorUniform = gl.getUniformLocation(this.gProgram, 'u_light_diffuse_color');
		this.lightSpecularColorUniform = gl.getUniformLocation(this.gProgram, 'u_light_specular_color');
		this.lightDirectionUniform = gl.getUniformLocation(this.gProgram, 'u_light_direction');

		this.materialAmbientColorUniform = gl.getUniformLocation(this.gProgram, 'u_material_ambient_color');
		this.materialDiffuseColorUniform = gl.getUniformLocation(this.gProgram, 'u_material_diffuse_color');
		this.materialSpecularColorUniform = gl.getUniformLocation(this.gProgram, 'u_material_specular_color');
		this.materialShininessUniform = gl.getUniformLocation(this.gProgram, 'u_material_shininess');
		this.materialAlphaUniform = gl.getUniformLocation(this.gProgram, 'u_material_alpha');

		this.fogModeUniform = gl.getUniformLocation(this.gProgram, 'u_fog_mode');
		this.fogColorUniform = gl.getUniformLocation(this.gProgram, 'u_fog_color');
		this.fogStartUniform = gl.getUniformLocation(this.gProgram, 'u_fog_start');
		this.fogEndUniform = gl.getUniformLocation(this.gProgram, 'u_fog_end');
		this.fogDensityUniform = gl.getUniformLocation(this.gProgram, 'u_fog_density');

		// texture for shadow map
		this.shadowDepthSampleUniform = gl.getUniformLocation(this.gProgram, 'u_shadow_depth_sample');
		this.shadowTextureSizeUniform = gl.getUniformLocation(this.gProgram, 'u_shadow_texture_size');
		this.shadowIntensityUniform = gl.getUniformLocation(this.gProgram, 'u_shadow_intensity');
		
		// gamma correction
		this.gammaCorrectionUniform = gl.getUniformLocation(this.gProgram, 'u_gamma_inverted');
		
		// point size
		this.pointSizeUniform = gl.getUniformLocation(this.gProgram, 'u_point_size');
	};
	_.loadDefaultVertexShader = function(gl) {
		let sb = [
		'precision mediump float;',
		
		// attributes set when rendering objects
		'attribute vec3 a_vertex_position;',
		'attribute vec3 a_vertex_normal;',

		// scene uniforms
		'uniform vec3 u_light_diffuse_color;',
		'uniform vec3 u_material_ambient_color;',
		'uniform vec3 u_material_diffuse_color;',
		// matrices set by gl.setMatrixUniforms
		'uniform mat4 u_model_view_matrix;',
		'uniform mat4 u_projection_matrix;',
		'uniform mat3 u_normal_matrix;',

		'uniform mat4 u_light_model_view_matrix;',
		'uniform mat4 u_light_projection_matrix;',

		'uniform bool u_shadow;',

		// sent to the fragment shader
		'varying vec3 v_viewpos;',
  		'varying vec4 v_shadcoord;',
		'varying vec3 v_diffuse;',
		'varying vec3 v_ambient;',
		'varying vec3 v_normal;',
		
		'uniform float u_point_size;',

		'void main() {',

			'v_normal = length(a_vertex_normal)==0. ? a_vertex_normal : u_normal_matrix * a_vertex_normal;',
			'v_ambient = u_material_ambient_color;',
			'v_diffuse = u_material_diffuse_color * u_light_diffuse_color;',

			'if(u_shadow) {',
				'v_shadcoord = u_light_projection_matrix * u_light_model_view_matrix * vec4(a_vertex_position, 1.);',
				'v_shadcoord /= v_shadcoord.w;',
			'}',

			'vec4 viewPos = u_model_view_matrix * vec4(a_vertex_position, 1.);',

			'v_viewpos = viewPos.xyz / viewPos.w;',
			
			'gl_Position = u_projection_matrix * viewPos;',

			// just to make sure the w is 1
			'gl_Position /= gl_Position.w;',
			'gl_PointSize = u_point_size;',

		'}'].join('');
		
		return this.getShaderFromStr(gl, gl.VERTEX_SHADER, sb);
	};
	_.loadDefaultFragmentShader = function(gl) {
		let sb = [
		// set macro for depth mmap texture
		gl.depthTextureExt ? '#define CWC_DEPTH_TEX\n' : '',
		
		// set float precision
		'precision mediump float;',
					
		// scene uniforms
		'uniform vec3 u_light_specular_color;',
		'uniform vec3 u_light_direction;',

		'uniform vec3 u_material_specular_color;',
		'uniform float u_material_shininess;',
		'uniform float u_material_alpha;',

		'uniform int u_fog_mode;',
		'uniform vec3 u_fog_color;',
		'uniform float u_fog_density;',
		'uniform float u_fog_start;',
		'uniform float u_fog_end;',

		'uniform bool u_shadow;',
		'uniform float u_shadow_intensity;',

		'uniform bool u_flat_color;',
		
		'uniform float u_gamma_inverted;',

		// texture for shadow map
		'uniform sampler2D u_shadow_depth_sample;',

		'uniform vec2 u_shadow_texture_size;',
					
		// from the vertex shader
		'varying vec3 v_viewpos;',
  		'varying vec4 v_shadcoord;',
		'varying vec3 v_diffuse;',
		'varying vec3 v_ambient;',
		'varying vec3 v_normal;',


		'\n#ifndef CWC_DEPTH_TEX\n',
		'float unpack (vec4 colour) {',
			'const vec4 bitShifts = vec4(1.,',
				'1. / 255.,',
				'1. / (255. * 255.),',
				'1. / (255. * 255. * 255.));',
			'return dot(colour, bitShifts);',
		'}',
		'\n#endif\n',

		'float shadowMapDepth(vec4 shadowMapColor) {',
			'float zShadowMap;',
			'\n#ifdef CWC_DEPTH_TEX\n',
			'zShadowMap = shadowMapColor.r;',
			'\n#else\n',
			'zShadowMap = unpack(shadowMapColor);',
			'\n#endif\n',
			'return zShadowMap;',
		'}',

		'void main(void) {',
			'vec3 color = v_diffuse;',
			'if(length(v_normal)!=0.){',
				'vec3 normal = normalize(v_normal);',
				'vec3 lightDir = normalize(-u_light_direction);',
				'float nDotL = dot(normal, lightDir);',

    			'float shadow = 0.0;',
    			'if(u_shadow) {',
					'vec3 depthCoord = .5 + v_shadcoord.xyz / v_shadcoord.w * .5;',

				    'if(depthCoord.z <= 1. && depthCoord.z >= 0.) {',
						'float bias = max(.05 * (1. - nDotL), .005);',
						'vec2 texelSize = 1. / u_shadow_texture_size;',
					    'for(int x = -1; x <= 1; ++x) {',
					        'for(int y = -1; y <= 1; ++y)  {',
								'vec4 shadowMapColor = texture2D(u_shadow_depth_sample, depthCoord.xy + vec2(x, y) * texelSize);',
								'float zShadowMap = shadowMapDepth(shadowMapColor);',
					            'shadow += zShadowMap + bias < depthCoord.z ? 1. : 0.;',
					        '}',
					    '}',
					    'shadow /= 9.;',
					    'shadow *= u_shadow_intensity;',
					'}',
    			'}',

    			'if(!u_flat_color) {',
					'vec3 viewDir = normalize(-v_viewpos);',
					'vec3 halfDir = normalize(lightDir + viewDir);',
					'float nDotHV = max(dot(halfDir, normal), 0.);',
					'vec3 specular = u_material_specular_color * u_light_specular_color;',
					'color*=max(nDotL, 0.);',
					'color+=specular * pow(nDotHV, u_material_shininess);',
				'}',

				// set the color
				'color = (1.-shadow)*color+v_ambient;',
			'}',

			'gl_FragColor = vec4(pow(color, vec3(u_gamma_inverted)), u_material_alpha);',

			'if(u_fog_mode != 0){',
				'float fogCoord = 1.-clamp((u_fog_end - gl_FragCoord.z/gl_FragCoord.w) / (u_fog_end - u_fog_start), 0., 1.);',
				'float fogFactor = 1.;',

				// linear equation
				'if(u_fog_mode == 1){',
					'fogFactor = 1.-fogCoord;',
				'}',
				// exp equation
				'else if(u_fog_mode == 2) {',
					'fogFactor = clamp(exp(-u_fog_density*fogCoord), 0., 1.);',
				'}',
				// exp2 equation
				'else if(u_fog_mode == 3) {',
					'fogFactor = clamp(exp(-pow(u_fog_density*fogCoord, 2.)), 0., 1.);',
				'}',
				'gl_FragColor = mix(vec4(u_fog_color, 1.), gl_FragColor, fogFactor);',

				// for debugging
				// 'gl_FragColor = vec4(vec3(fogFactor), 1.);',
			'}',
		'}'
		].join('');
		
		return this.getShaderFromStr(gl, gl.FRAGMENT_SHADER, sb);
	};
	_.enableAttribsArray = function(gl) {
		_super.enableAttribsArray.call(this, gl);
		gl.enableVertexAttribArray(this.vertexNormalAttribute);
	};
	_.disableAttribsArray = function(gl) {
		_super.disableAttribsArray.call(this, gl);
		gl.disableVertexAttribArray(this.vertexNormalAttribute);
	};
	_.setMatrixUniforms = function(gl, modelMatrix) {
		if(modelMatrix === undefined) {
			this.setModelViewMatrix(gl, gl.modelViewMatrix);
			this.setLightModelViewMatrix(gl, gl.lightViewMatrix);
		} else {
			let mvMatrix = m4.multiply(gl.modelViewMatrix, modelMatrix, []);
			let lightModelViewMatrix = m4.multiply(gl.lightViewMatrix, modelMatrix, []);

			this.setModelViewMatrix(gl, mvMatrix);
			this.setLightModelViewMatrix(gl, lightModelViewMatrix);
		}
	};
	_.setModelViewMatrix = function(gl, mvMatrix) {
		_super.setModelViewMatrix.call(this, gl, mvMatrix);
		// create the normal matrix and push it to the graphics card
		let normalMatrix = m3.transpose(m4.toInverseMat3(mvMatrix, []));
		gl.uniformMatrix3fv(this.normalMatrixUniform, false, normalMatrix);
	};
	_.setFlatColor = function(gl, enabled) {
		gl.uniform1i(this.flatColorUniform, enabled);
	};
	_.setShadow = function(gl, enabled) {
		gl.uniform1i(this.shadowUniform, enabled);
	};
	_.setFogMode = function(gl, mode) {
		gl.uniform1i(this.fogModeUniform, mode);
	};
	_.setFogColor = function(gl, color) {
		gl.uniform3fv(this.fogColorUniform, color);
	};
	_.setFogStart = function(gl, fogStart) {
		gl.uniform1f(this.fogStartUniform, fogStart);
	};
	_.setFogEnd = function(gl, fogEnd) {
		gl.uniform1f(this.fogEndUniform, fogEnd);
	};
	_.setFogDensity = function(gl, density) {
		gl.uniform1f(this.fogDensityUniform, density);
	};
	_.setMaterialAmbientColor = function(gl, ambient) {
		gl.uniform3fv(this.materialAmbientColorUniform, ambient);
	};
	_.setMaterialDiffuseColor = function(gl, diffuse) {
		gl.uniform3fv(this.materialDiffuseColorUniform, diffuse);
	};
	_.setMaterialSpecularColor = function(gl, specular) {
		gl.uniform3fv(this.materialSpecularColorUniform, specular);
	};
	_.setMaterialShininess = function(gl, shininess) {
		gl.uniform1f(this.materialShininessUniform, shininess);
	};
	_.setMaterialAlpha = function(gl, alpha) {
		gl.uniform1f(this.materialAlphaUniform, alpha);
	};
	_.setLightDiffuseColor = function(gl, diffuse) {
		gl.uniform3fv(this.lightDiffuseColorUniform, diffuse);
	};
	_.setLightSpecularColor = function(gl, specular) {
		gl.uniform3fv(this.lightSpecularColorUniform, specular);
	};
	_.setLightDirection = function(gl, direction) {
		gl.uniform3fv(this.lightDirectionUniform, direction);
	};
	_.setLightModelViewMatrix = function(gl, mvMatrix) {
		gl.uniformMatrix4fv(this.lightModelViewMatrixUniform, false, mvMatrix);
	};
	_.setLightProjectionMatrix = function(gl, matrix) {
		gl.uniformMatrix4fv(this.lightProjectionMatrixUniform, false, matrix);
	};
	_.setShadowTextureSize = function(gl, width, height) {
		gl.uniform2f(this.shadowTextureSizeUniform, width, height);
	};
	_.setShadowIntensity = function(gl, intensity) {
		gl.uniform1f(this.shadowIntensityUniform, intensity);
	};
	_.setGammaCorrection = function(gl, gammaCorrection) {
	    // make sure gamma correction is inverted here as it is more efficient in the shader
		gl.uniform1f(this.gammaCorrectionUniform, 1.0/gammaCorrection);
	};
	_.setPointSize = function(gl, pointSize) {
		gl.uniform1f(this.pointSizeUniform, pointSize);
	};

})(ChemDoodle.structures.d3, ChemDoodle.lib.mat3, ChemDoodle.lib.mat4, document);

(function(d3, m3, m4, document, undefined) {
	'use strict';

	d3.PickShader = function() {
	};
	let _super = d3._Shader.prototype;
	let _ = d3.PickShader.prototype = new d3._Shader();
	_.initUniformLocations = function(gl) {
		// assign uniform properties
		_super.initUniformLocations.call(this, gl);
		this.materialDiffuseColorUniform = gl.getUniformLocation(this.gProgram, 'u_material_diffuse_color');
	};
	_.loadDefaultVertexShader = function(gl) {
		let sb = [
		'precision mediump float;',
		
		// attributes set when rendering objects
		'attribute vec3 a_vertex_position;',

		// matrices set by gl.setMatrixUniforms
		'uniform mat4 u_model_view_matrix;',
		'uniform mat4 u_projection_matrix;',

		'void main() {',
			
			'gl_Position = u_projection_matrix * u_model_view_matrix * vec4(a_vertex_position, 1.);',

			// just to make sure the w is 1
			'gl_Position /= gl_Position.w;',

		'}'].join('');

		return this.getShaderFromStr(gl, gl.VERTEX_SHADER, sb);
	};
	_.loadDefaultFragmentShader = function(gl) {
		let sb = [
		// set macro for depth mmap texture
		gl.depthTextureExt ? '#define CWC_DEPTH_TEX\n' : '',
		
		// set float precision
		'precision mediump float;',

		'uniform vec3 u_material_diffuse_color;',
					
		'void main(void) {',
			'gl_FragColor = vec4(u_material_diffuse_color, 1.);',
		'}'
		].join('');

		return this.getShaderFromStr(gl, gl.FRAGMENT_SHADER, sb);
	};
	_.setMaterialDiffuseColor = function(gl, diffuse) {
		gl.uniform3fv(this.materialDiffuseColorUniform, diffuse);
	};

})(ChemDoodle.structures.d3, ChemDoodle.lib.mat3, ChemDoodle.lib.mat4, document);

(function(d3, m3, m4, document, undefined) {
	'use strict';

	d3.PositionShader = function() {
	};
	let _super = d3._Shader.prototype;
	let _ = d3.PositionShader.prototype = new d3._Shader();

	_.loadDefaultVertexShader = function(gl) {
		let sb = [
		'precision mediump float;',
		
		// attributes set when rendering objects
		'attribute vec3 a_vertex_position;',

		// matrices set by gl.setMatrixUniforms
		'uniform mat4 u_model_view_matrix;',
		'uniform mat4 u_projection_matrix;',

		'varying vec4 v_position;',

		'void main() {',
			'vec4 viewPos = u_model_view_matrix * vec4(a_vertex_position, 1.);',

			'gl_Position = u_projection_matrix * viewPos;',

			'v_position = viewPos / viewPos.w;',

		'}'].join('');
		
		return this.getShaderFromStr(gl, gl.VERTEX_SHADER, sb);
	};
	_.loadDefaultFragmentShader = function(gl) {
		let sb = [
		// set float precision
		'precision mediump float;',

		'varying vec4 v_position;',

		'void main(void) {',
			'gl_FragColor = v_position;',
		'}'].join('');
		
		return this.getShaderFromStr(gl, gl.FRAGMENT_SHADER, sb);
	};

})(ChemDoodle.structures.d3, ChemDoodle.lib.mat3, ChemDoodle.lib.mat4, document);

(function(d3, m3, m4, document, undefined) {
	'use strict';

	d3.QuadShader = function() {
	};
	let _ = d3.QuadShader.prototype = new d3._Shader();
	_.loadDefaultVertexShader = function(gl) {
		let sb = [
		'precision mediump float;',
		
		// attributes set when rendering objects
		'attribute vec3 a_vertex_position;',

    	'varying vec2 v_texcoord;',

		'void main() {',
			'gl_Position = vec4(a_vertex_position, 1.);',
        	'v_texcoord = a_vertex_position.xy * .5 + .5;',
		'}'].join('');

		return this.getShaderFromStr(gl, gl.VERTEX_SHADER, sb);
	};
	_.loadDefaultFragmentShader = function(gl) {
		let sb = [

		// set float precision
		'precision mediump float;',

	    'uniform sampler2D u_image;',

    	'varying vec2 v_texcoord;',
	    
	    'void main() {',
	        'gl_FragColor = texture2D(u_image, v_texcoord);',
	    '}'].join('');

		return this.getShaderFromStr(gl, gl.FRAGMENT_SHADER, sb);
	};

})(ChemDoodle.structures.d3, ChemDoodle.lib.mat3, ChemDoodle.lib.mat4, document);

(function(structures, d3, ELEMENT, MarchingCubes, v3, m, undefined) {
	'use strict';
	
	let Triangle = function(i1, i2, i3){
		this.i1 = i1;
		this.i2 = i2;
		this.i3 = i3;
	};
	
	function getRange(atoms, probeRadius) {
		let r = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
		let add = probeRadius + 2;
		for (let i = 0, ii = atoms.length; i<ii; i++) {
			let a = atoms[i];
			r[0] = m.min(r[0], a.x - add);
			r[1] = m.max(r[1], a.x + add);
			r[2] = m.min(r[2], a.y - add);
			r[3] = m.max(r[3], a.y + add);
			r[4] = m.min(r[4], a.z - add);
			r[5] = m.max(r[5], a.z + add);
		}
		return r;
	};
	
	function addPoint(p, points, xs, ys, zs, step) {
		// transform back into real space
		let px = p[0] * step + xs - step;
		let py = p[1] * step + ys - step;
		let pz = p[2] * step + zs - step;
		// find any previous match
		let index = -1;
		let cutoff = 1E-3;
		for (let j = 0, jj = points.length; j < jj; j++) {
			let pj = points[j];
			if (m.abs(pj.x - px) < cutoff && m.abs(pj.y - py) < cutoff && m.abs(pj.z - pz) < cutoff) {
				index = j;
				break;
			}
		}
		if (index == -1) {
			index = points.length;
			points.push(new structures.Atom('C', px, py, pz));
		}
		return index;
	};
	
	d3._Surface = function() {
	};
	let _ = d3._Surface.prototype = new d3._Mesh();
	_.generate = function(xdif, ydif, zdif, step, range, xsteps, ysteps, zsteps){
		// generate the function
		let vals = [];
		let z = range[4] - step;
		for (let k = 0; k < zsteps; k++) {
			let y = range[2] - step;
			for (let j = 0; j < ysteps; j++) {
				let x = range[0] - step;
				for (let i = 0; i < xsteps; i++) {
					vals.push(this.calculate(x, y, z));
					x += step;
				}
				y += step;
			}
			z += step;
		}
		return vals;
	};
	_.build = function(atoms, probeRadius, resolution) {
		let positionData = [];
		let normalData = [];
		let indexData = [];

		// calculate the range of the function
		let range = getRange(atoms, probeRadius);
		let xdif = range[1] - range[0];
		let ydif = range[3] - range[2];
		let zdif = range[5] - range[4];
		let step = m.min(xdif, m.min(ydif, zdif)) / resolution;
		
		// generate the function
		let xsteps = 2 + m.ceil(xdif / step);
		let ysteps = 2 + m.ceil(ydif / step);
		let zsteps = 2 + m.ceil(zdif / step);
		let vals = this.generate(xdif, ydif, zdif, step, range, xsteps, ysteps, zsteps);
		
		// marching cubes
		let mesh = MarchingCubes(vals, [xsteps, ysteps, zsteps]);
		
		// build surface
		let ps = [];
		let is = [];
		for (let i = 0, ii = mesh.vertices.length; i<ii; i++) {
			is.push(addPoint(mesh.vertices[i], ps, range[0], range[2], range[4], step));
		}
		
		// triangles
		let triangles = [];
		for (let i = 0, ii = mesh.faces.length; i < ii; i++) {
			let f = mesh.faces[i];
			let i1 = is[f[0]];
			let i2 = is[f[1]];
			let i3 = is[f[2]];
			triangles.push(new Triangle(i1, i2, i3));
			indexData.push(i1, i2, i3);
		}
		
		// smoothing - 1 pass
		let savedConnections = [];
		for (let i = 0, ii = ps.length; i < ii; i++) {
			let connections = [];
			for (let j = 0, jj = triangles.length; j < jj; j++) {
				let t = triangles[j];
				if (t.i1===i || t.i2===i || t.i3===i) {
					if (t.i1 != i && connections.indexOf(t.i1)===-1) {
						connections.push(t.i1);
					}
					if (t.i2 != i && connections.indexOf(t.i2)===-1) {
						connections.push(t.i2);
					}
					if (t.i3 != i && connections.indexOf(t.i3)===-1) {
						connections.push(t.i3);
					}
				}
			}
			savedConnections.push(connections);
		}
		let tmp = [];
		for (let i = 0, ii = ps.length; i < ii; i++) {
			let pi = ps[i];
			let connections = savedConnections[i];
			let pt = new structures.Atom();
			if (connections.length < 3) {
				pt.x = pi.x;
				pt.y = pi.y;
				pt.z = pi.z;
			} else {
				let wt = 1;
				if (connections.length < 5) {
					wt = .5;
				}
				for (let j = 0, jj = connections.length; j < jj; j++) {
					let pc = ps[connections[j]];
					pt.x+=pc.x;
					pt.y+=pc.y;
					pt.z+=pc.z;
				}
				pt.x += pi.x*wt;
				pt.y += pi.y*wt;
				pt.z += pi.z*wt;
				let scale = 1 / (wt + connections.length);
				pt.x*=scale;
				pt.y*=scale;
				pt.z*=scale;
			}
			tmp.push(pt);
		}
		ps = tmp;
		for (let i = 0, ii = ps.length; i < ii; i++) {
			let pi = ps[i];
			positionData.push(pi.x, pi.y, pi.z);
		}
		
		// normals
		for (let i = 0, ii = triangles.length; i < ii; i++) {
			let t = triangles[i];
			let p1 = ps[t.i1];
			let p2 = ps[t.i2];
			let p3 = ps[t.i3];
			let v12 = [p2.x-p1.x, p2.y-p1.y, p2.z-p1.z];
			let v13 = [p3.x-p1.x, p3.y-p1.y, p3.z-p1.z];
			v3.cross(v12, v13);
			if (isNaN(v12[0])) {
				// for some reason, origin shows up as some points and should be
				// ignored
				v12 = [0,0,0];
			}
			t.normal = v12;
		}
		for (let i = 0, ii = ps.length; i < ii; i++) {
			let sum = [0, 0, 0];
			for (let j = 0, jj = triangles.length; j < jj; j++) {
				let t = triangles[j];
				if (t.i1===i || t.i2===i || t.i3===i) {
					sum[0]+=t.normal[0];
					sum[1]+=t.normal[1];
					sum[2]+=t.normal[2];
				}
			}
			v3.normalize(sum);
			normalData.push(sum[0], sum[1], sum[2]);
		}
		this.storeData(positionData, normalData, indexData);
	};
	_.render = function(gl, styles) {
		if(this.styles){
			styles = this.styles;
		}
		if(!styles.surfaces_display){
			return;
		}
		gl.shader.setMatrixUniforms(gl);
		this.bindBuffers(gl);
		// colors
		gl.material.setTempColors(gl, styles.surfaces_materialAmbientColor_3D, styles.surfaces_color, styles.surfaces_materialSpecularColor_3D, styles.surfaces_materialShininess_3D);
		// alpha must be set after temp colors as that function sets alpha to 1
		gl.material.setAlpha(gl, styles.surfaces_alpha);
		// render
		if(styles.surfaces_style === 'Dots'){
			// dots
			//gl.pointSize(1);
			// pointSize isn't part of WebGL API, so we have to make it a shader uniform in the vertex shader
			gl.shader.setPointSize(gl, styles.shapes_pointSize);
			//gl.drawArrays(gl.POINTS, 0, this.vertexIndexBuffer.numItems);
			gl.drawElements(gl.POINTS, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}else if(styles.surfaces_style === 'Mesh'){
			// mesh
			gl.lineWidth(styles.shapes_lineWidth);
			//gl.polygonMode(gl.FRONT_AND_BACK, gl.LINE);
			gl.drawElements(gl.LINES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			//gl.polygonMode(gl.FRONT_AND_BACK, gl.FILL);
		}else{
			// solid
			gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
		
	};

})(ChemDoodle.structures, ChemDoodle.structures.d3, ChemDoodle.ELEMENT, ChemDoodle.lib.MarchingCubes, ChemDoodle.lib.vec3, Math);

(function(structures, d3, ELEMENT, m, undefined) {
	'use strict';
	
	d3.SASSurface = function(atoms, probeRadius, resolution) {
		this.atoms = atoms;
		this.probeRadius = probeRadius;
		this.resolution = resolution;
		this.build(atoms, probeRadius, resolution);
	};
	let _ = d3.SASSurface.prototype = new d3._Surface();
	_.calculate = function(x, y, z) {
		let min = Infinity;
		let p = new structures.Atom('C', x, y, z);
		for (let i = 0, ii = this.atoms.length; i<ii; i++) {
			let a = this.atoms[i];
			let vdwRadius = (ELEMENT[a.label] && ELEMENT[a.label].vdWRadius!==0)?ELEMENT[a.label].vdWRadius:2;
			let distanceCenter = a.distance3D(p) - this.probeRadius;
			let distanceSurface = distanceCenter - vdwRadius;
			min = m.min(min, distanceSurface);
		}
		return min;
	};
	

})(ChemDoodle.structures, ChemDoodle.structures.d3, ChemDoodle.ELEMENT, Math);

(function(structures, d3, ELEMENT, m, undefined) {
	'use strict';
	
	d3.VDWSurface = function(atoms, resolution) {
		this.atoms = atoms;
		this.probeRadius = 0;
		this.resolution = resolution;
		this.build(atoms, 0, resolution);
	};
	let _ = d3.VDWSurface.prototype = new d3._Surface();
	_.calculate = function(x, y, z) {
		let min = Infinity;
		let p = new structures.Atom('C', x, y, z);
		for (let i = 0, ii = this.atoms.length; i<ii; i++) {
			let a = this.atoms[i];
			let vdwRadius = (ELEMENT[a.label] && ELEMENT[a.label].vdWRadius!==0)?ELEMENT[a.label].vdWRadius:2;
			let distanceCenter = a.distance3D(p);
			let distanceSurface = distanceCenter - vdwRadius;
			min = m.min(min, distanceSurface);
		}
		return min;
	};
	

})(ChemDoodle.structures, ChemDoodle.structures.d3, ChemDoodle.ELEMENT, Math);

(function(structures, extensions, m, undefined) {
	'use strict';
	structures.Plate = function(lanes) {
		this.lanes = new Array(lanes);
		for (i = 0, ii = lanes; i < ii; i++) {
			this.lanes[i] = [];
		}
	};
	let _ = structures.Plate.prototype;
	_.sort = function() {
		for (i = 0, ii = this.lanes.length; i < ii; i++) {
			this.lanes[i].sort(function(a, b) {
				return a - b;
			});
		}
	};
	_.draw = function(ctx, styles) {
		// Front and origin
		let width = ctx.canvas.width;
		let height = ctx.canvas.height;
		this.origin = 9 * height / 10;
		this.front = height / 10;
		this.laneLength = this.origin - this.front;
		ctx.strokeStyle = '#000000';
		ctx.beginPath();
		ctx.moveTo(0, this.front);
		ctx.lineTo(width, this.front);
		ctx.setLineDash([3]);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.beginPath();
		ctx.moveTo(0, this.origin);
		ctx.lineTo(width, this.origin);
		ctx.closePath();
		ctx.stroke();
		// Lanes
		for (i = 0, ii = this.lanes.length; i < ii; i++) {
			let laneX = (i + 1) * width / (ii + 1);
			ctx.beginPath();
			ctx.moveTo(laneX, this.origin);
			ctx.lineTo(laneX, this.origin + 3);
			ctx.closePath();
			ctx.stroke();
			// Spots
			for (s = 0, ss = this.lanes[i].length; s < ss; s++) {
				let spotY = this.origin - (this.laneLength * this.lanes[i][s].rf);
				switch (this.lanes[i][s].type) {
				case 'compact':
					ctx.beginPath();
					ctx.arc(laneX, spotY, 3, 0, 2 * m.PI, false);
					ctx.closePath();
					break;
				case 'expanded':
					ctx.beginPath();
					ctx.arc(laneX, spotY, 7, 0, 2 * m.PI, false);
					ctx.closePath();
					break;
				case 'trailing':
					// trailing
					break;
				case 'widened':
					extensions.contextEllipse(ctx, laneX - 18, spotY - 10, 36, 10);
					break;
				case 'cresent':
					ctx.beginPath();
					ctx.arc(laneX, spotY, 9, 0, m.PI, true);
					ctx.closePath();
					break;
				}
				switch (this.lanes[i][s].style) {
				case 'solid':
					ctx.fillStyle = '#000000';
					ctx.fill();
					break;
				case 'transparent':
					ctx.stroke();
					break;
				case 'gradient':
					// gradient
					break;
				}
			}
		}
	};

	structures.Plate.Spot = function(type, rf, style) {
		this.type = type;
		this.rf = rf;
		this.style = style ? style : 'solid';
	};

})(ChemDoodle.structures, ChemDoodle.extensions, Math);

(function (c, structures, m, JSON, Object, undefined) {
	'use strict';

	c.DEFAULT_STYLES = {
		// default canvas properties
		backgroundColor:'#FFFFFF',
		scale:1,
		rotateAngle:0,
		bondLength_2D:20,
		angstromsPerBondLength:1.25,
		lightDirection_3D:[-.1, -.1, -1],
		lightDiffuseColor_3D:'#FFFFFF',
		lightSpecularColor_3D:'#FFFFFF',
		projectionPerspective_3D:true,
		projectionPerspectiveVerticalFieldOfView_3D:45,
		projectionOrthoWidth_3D:40,
		projectionWidthHeightRatio_3D:undefined,
		projectionFrontCulling_3D:.1,
		projectionBackCulling_3D:10000,
		cullBackFace_3D:true,
		fog_mode_3D:0,
		fog_color_3D:'#000000',
		fog_start_3D:0,
		fog_end_3D:1,
		fog_density_3D:1,
		shadow_3D:false,
		shadow_intensity_3D:.85,
		flat_color_3D:false,
		antialias_3D:true,
		gammaCorrection_3D:2.2,
		colorHover:'#885110',
		colorSelect:'#0060B2',
		colorError:'#c10000',
		colorPreview:'#00FF00',

		// 3D shaders
		// default ssao
		ssao_3D:false,
		ssao_kernel_radius:17,
		ssao_kernel_samples:32,
		ssao_power:1.0,
		// default outline 3D
		outline_3D:false,
		outline_thickness:1.0,
		outline_normal_threshold:0.85,
		outline_depth_threshold:0.1,
		// defult fxaa antialiasing
		fxaa_edgeThreshold:1.0 / 16.0,
		fxaa_edgeThresholdMin:1.0 / 12.0,
		fxaa_searchSteps:64,
		fxaa_searchThreshold:1.0 / 4.0,
		fxaa_subpixCap:1.0,
		fxaa_subpixTrim:0.0,

		// default atom properties
		atoms_display:true,
		atoms_color:'#000000',
		atoms_font_size_2D:12,
		atoms_font_families_2D:['Helvetica', 'Arial', 'Dialog'],
		atoms_font_bold_2D:false,
		atoms_font_italic_2D:false,
		atoms_circles_2D:false,
		atoms_circleDiameter_2D:10,
		atoms_circleBorderWidth_2D:1,
		atoms_lonePairDistance_2D:8,
		atoms_lonePairSpread_2D:4,
		atoms_lonePairDiameter_2D:1,
		atoms_useJMOLColors:false,
		atoms_usePYMOLColors:false,
		atoms_HBlack_2D:true,
		atoms_implicitHydrogens_2D:true,
		atoms_displayTerminalCarbonLabels_2D:false,
		atoms_showHiddenCarbons_2D:true,
		atoms_showAttributedCarbons_2D:true,
		atoms_displayAllCarbonLabels_2D:false,
		atoms_resolution_3D:30,
		atoms_sphereDiameter_3D:.8,
		atoms_useVDWDiameters_3D:false,
		atoms_vdwMultiplier_3D:1,
		atoms_materialAmbientColor_3D:'#000000',
		atoms_materialSpecularColor_3D:'#555555',
		atoms_materialShininess_3D:32,
		atoms_nonBondedAsStars_3D:false,
		atoms_displayLabels_3D:false,

		// default bond properties
		bonds_display:true,
		bonds_color:'#000000',
		bonds_width_2D:1,
		bonds_useAbsoluteSaturationWidths_2D:true,
		bonds_saturationWidth_2D:.2,
		bonds_saturationWidthAbs_2D:5,
		bonds_ends_2D:'round',
		bonds_splitColor:false,
		bonds_colorGradient:false,
		bonds_saturationAngle_2D:m.PI / 3,
		bonds_symmetrical_2D:false,
		bonds_clearOverlaps_2D:false,
		bonds_overlapClearWidth_2D:.5,
		bonds_atomLabelBuffer_2D:1,
		bonds_wedgeThickness_2D:6,
		bonds_wavyLength_2D:4,
		bonds_hashWidth_2D:1,
		bonds_hashSpacing_2D:2.5,
		bonds_dotSize_2D:2,
		bonds_lewisStyle_2D:false,
		bonds_showBondOrders_3D:false,
		bonds_resolution_3D:30,
		bonds_renderAsLines_3D:false,
		bonds_cylinderDiameter_3D:.3,
		bonds_pillLatitudeResolution_3D:10,
		bonds_pillLongitudeResolution_3D:20,
		bonds_pillHeight_3D:.3,
		bonds_pillSpacing_3D:.1,
		bonds_pillDiameter_3D:.3,
		bonds_materialAmbientColor_3D:'#000000',
		bonds_materialSpecularColor_3D:'#555555',
		bonds_materialShininess_3D:32,

		// default macromolecular properties
		proteins_displayRibbon:true,
		proteins_displayBackbone:false,
		proteins_backboneThickness:1.5,
		proteins_backboneColor:'#CCCCCC',
		proteins_ribbonCartoonize:false,
		proteins_displayPipePlank:false,
		// shapely, amino, polarity, rainbow, acidity
		proteins_residueColor:'none',
		proteins_primaryColor:'#FF0D0D',
		proteins_secondaryColor:'#FFFF30',
		proteins_ribbonCartoonHelixPrimaryColor:'#00E740',
		proteins_ribbonCartoonHelixSecondaryColor:'#9905FF',
		proteins_ribbonCartoonSheetColor:'#E8BB99',
		proteins_tubeColor:'#FF0D0D',
		proteins_tubeResolution_3D:15,
		proteins_ribbonThickness:.2,
		proteins_tubeThickness:0.5,
		proteins_plankSheetWidth:3.5,
		proteins_cylinderHelixDiameter:4,
		proteins_verticalResolution:8,
		proteins_horizontalResolution:8,
		proteins_materialAmbientColor_3D:'#000000',
		proteins_materialSpecularColor_3D:'#555555',
		proteins_materialShininess_3D:32,
		nucleics_display:true,
		nucleics_tubeColor:'#CCCCCC',
		nucleics_baseColor:'#C10000',
		// shapely, rainbow
		nucleics_residueColor:'none',
		nucleics_tubeThickness:1.5,
		nucleics_tubeResolution_3D:15,
		nucleics_verticalResolution:8,
		nucleics_materialAmbientColor_3D:'#000000',
		nucleics_materialSpecularColor_3D:'#555555',
		nucleics_materialShininess_3D:32,
		macro_displayAtoms:false,
		macro_displayBonds:false,
		macro_atomToLigandDistance:-1,
		macro_showWater:false,
		macro_colorByChain:false,
		macro_rainbowColors:['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000'],

		// default surface properties
		surfaces_display:true,
		surfaces_alpha:.5,
		surfaces_style:'Solid',
		surfaces_color:'white',
		surfaces_materialAmbientColor_3D:'#000000',
		surfaces_materialSpecularColor_3D:'#000000',
		surfaces_materialShininess_3D:32,

		// default spectrum properties
		plots_color:'#000000',
		plots_width:1,
		plots_showIntegration:false,
		plots_integrationColor:'#c10000',
		plots_integrationLineWidth:1,
		plots_showGrid:false,
		plots_gridColor:'gray',
		plots_gridLineWidth:.5,
		plots_showYAxis:true,
		plots_flipXAxis:false,

		// default shape properties
		text_font_size:12,
		text_font_families:['Helvetica', 'Arial', 'Dialog'],
		text_font_bold:true,
		text_font_italic:false,
		text_font_stroke_3D:true,
		text_color:'#000000',
		shapes_color:'#000000',
		shapes_lineWidth:1,
		shapes_pointSize:2,
		shapes_arrowLength_2D:8,
		compass_display:false,
		compass_axisXColor_3D:'#FF0000',
		compass_axisYColor_3D:'#00FF00',
		compass_axisZColor_3D:'#0000FF',
		compass_size_3D:50,
		compass_resolution_3D:10,
		compass_displayText_3D:true,
		compass_type_3D:0,
		measurement_update_3D:false,
		measurement_angleBands_3D:10,
		measurement_displayText_3D:true
	}

	structures.Styles = function (copy) {
		// use json for a copy of arrays without assigning the same pointers from DEFAULT_STYLES
		Object.assign(this, JSON.parse(JSON.stringify(copy===undefined?c.DEFAULT_STYLES:copy)));
	};
	let _ = structures.Styles.prototype;
	_.set3DRepresentation = function (representation) {
		this.atoms_display = true;
		this.bonds_display = true;
		this.bonds_color = '#777777';
		this.atoms_useVDWDiameters_3D = true;
		this.atoms_useJMOLColors = true;
		this.bonds_splitColor = true;
		this.bonds_showBondOrders_3D = true;
		this.bonds_renderAsLines_3D = false;
		if (representation === 'Ball and Stick') {
			this.atoms_vdwMultiplier_3D = .3;
			this.bonds_splitColor = false;
			this.bonds_cylinderDiameter_3D = .3;
			this.bonds_materialAmbientColor_3D = ChemDoodle.DEFAULT_STYLES.atoms_materialAmbientColor_3D;
			this.bonds_pillDiameter_3D = .15;
		} else if (representation === 'van der Waals Spheres') {
			this.bonds_display = false;
			this.atoms_vdwMultiplier_3D = 1;
		} else if (representation === 'Stick') {
			this.atoms_useVDWDiameters_3D = false;
			this.bonds_showBondOrders_3D = false;
			this.bonds_cylinderDiameter_3D = this.atoms_sphereDiameter_3D = .8;
			this.bonds_materialAmbientColor_3D = this.atoms_materialAmbientColor_3D;
		} else if (representation === 'Wireframe') {
			this.atoms_useVDWDiameters_3D = false;
			this.bonds_cylinderDiameter_3D = this.bonds_pillDiameter_3D = .05;
			this.atoms_sphereDiameter_3D = .15;
			this.bonds_materialAmbientColor_3D = ChemDoodle.DEFAULT_STYLES.atoms_materialAmbientColor_3D;
		} else if (representation === 'Line') {
			this.atoms_display = false;
			this.bonds_renderAsLines_3D = true;
			this.bonds_width_2D = 1;
			this.bonds_cylinderDiameter_3D = .05;
		} else {
			alert('"' + representation + '" is not recognized. Use one of the following strings:\n\n' + '1. Ball and Stick\n' + '2. van der Waals Spheres\n' + '3. Stick\n' + '4. Wireframe\n' + '5. Line\n');
		}
	};
	_.copy = function () {
		return new structures.Styles(this);
	};

})(ChemDoodle, ChemDoodle.structures, Math, JSON, Object);
(function(c, ELEMENT, informatics, structures, undefined) {
	'use strict';
	informatics.getPointsPerAngstrom = function() {
		return c.DEFAULT_STYLES.bondLength_2D / c.DEFAULT_STYLES.angstromsPerBondLength;
	};

	informatics.BondDeducer = function() {
	};
	let _ = informatics.BondDeducer.prototype;
	_.margin = 1.1;
	_.deduceCovalentBonds = function(molecule, customPointsPerAngstrom) {
		let pointsPerAngstrom = informatics.getPointsPerAngstrom();
		if (customPointsPerAngstrom) {
			pointsPerAngstrom = customPointsPerAngstrom;
		}
		for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
			for ( let j = i + 1; j < ii; j++) {
				let first = molecule.atoms[i];
				let second = molecule.atoms[j];
				if (first.distance3D(second) < (ELEMENT[first.label].covalentRadius + ELEMENT[second.label].covalentRadius) * pointsPerAngstrom * this.margin) {
					molecule.bonds.push(new structures.Bond(first, second, 1));
				}
			}
		}
	};

})(ChemDoodle, ChemDoodle.ELEMENT, ChemDoodle.informatics, ChemDoodle.structures);
(function(informatics, structures, undefined) {
	'use strict';
	informatics.HydrogenDeducer = function() {
	};
	let _ = informatics.HydrogenDeducer.prototype;
	_.removeHydrogens = function(molecule, removeStereo) {
		let atoms = [];
		let bonds = [];
		for ( let i = 0, ii = molecule.bonds.length; i < ii; i++) {
			let b = molecule.bonds[i];
			let save = b.a1.label !== 'H' && b.a2.label !== 'H';
			if(!save && (!removeStereo && b.stereo !== structures.Bond.STEREO_NONE)){
				save = true;
			}
			if (save) {
				b.a1.tag = true;
				bonds.push(b);
			}else{
				if(b.a1.label === 'H'){
					b.a1.remove = true;
				}
				if(b.a2.label === 'H'){
					b.a2.remove = true;
				}
			}
		}
		for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
			let a = molecule.atoms[i];
			if (a.remove) {
				a.remove = undefined;
			}else{
				atoms.push(a);
			}
		}
		molecule.atoms = atoms;
		molecule.bonds = bonds;
	};

})(ChemDoodle.informatics, ChemDoodle.structures);
(function(informatics, structures, undefined) {
	'use strict';
	informatics.Splitter = function() {
	};
	let _ = informatics.Splitter.prototype;
	_.split = function(molecule) {
		let mols = [];
		for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
			molecule.atoms[i].visited = false;
		}
		for ( let i = 0, ii = molecule.bonds.length; i < ii; i++) {
			molecule.bonds[i].visited = false;
		}
		for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
			let a = molecule.atoms[i];
			if (!a.visited) {
				let newMol = new structures.Molecule();
				newMol.atoms.push(a);
				a.visited = true;
				let q = new structures.Queue();
				q.enqueue(a);
				while (!q.isEmpty()) {
					let atom = q.dequeue();
					for ( let j = 0, jj = molecule.bonds.length; j < jj; j++) {
						let b = molecule.bonds[j];
						if (b.contains(atom) && !b.visited) {
							b.visited = true;
							newMol.bonds.push(b);
							let neigh = b.getNeighbor(atom);
							if (!neigh.visited) {
								neigh.visited = true;
								newMol.atoms.push(neigh);
								q.enqueue(neigh);
							}
						}
					}
				}
				mols.push(newMol);
			}
		}
		return mols;
	};

})(ChemDoodle.informatics, ChemDoodle.structures);
(function(informatics, io, structures, undefined) {
	'use strict';
	informatics.StructureBuilder = function() {
	};
	let _ = informatics.StructureBuilder.prototype;
	_.copy = function(molecule) {
		let json = new io.JSONInterpreter();
		return json.molFrom(json.molTo(molecule));
	};

})(ChemDoodle.informatics, ChemDoodle.io, ChemDoodle.structures);
(function(informatics, undefined) {
	'use strict';
	informatics._Counter = function() {
	};
	let _ = informatics._Counter.prototype;
	_.value = 0;
	_.molecule = undefined;
	_.setMolecule = function(molecule) {
		this.value = 0;
		this.molecule = molecule;
		if (this.innerCalculate) {
			this.innerCalculate();
		}
	};
})(ChemDoodle.informatics);
(function(informatics, undefined) {
	'use strict';
	informatics.FrerejacqueNumberCounter = function(molecule) {
		this.setMolecule(molecule);
	};
	let _ = informatics.FrerejacqueNumberCounter.prototype = new informatics._Counter();
	_.innerCalculate = function() {
		this.value = this.molecule.bonds.length - this.molecule.atoms.length + new informatics.NumberOfMoleculesCounter(this.molecule).value;
	};
})(ChemDoodle.informatics);
(function(structures, informatics, undefined) {
	'use strict';
	informatics.NumberOfMoleculesCounter = function(molecule) {
		this.setMolecule(molecule);
	};
	let _ = informatics.NumberOfMoleculesCounter.prototype = new informatics._Counter();
	_.innerCalculate = function() {
		for ( let i = 0, ii = this.molecule.atoms.length; i < ii; i++) {
			this.molecule.atoms[i].visited = false;
		}
		for ( let i = 0, ii = this.molecule.atoms.length; i < ii; i++) {
			if (!this.molecule.atoms[i].visited) {
				this.value++;
				let q = new structures.Queue();
				this.molecule.atoms[i].visited = true;
				q.enqueue(this.molecule.atoms[i]);
				while (!q.isEmpty()) {
					let atom = q.dequeue();
					for ( let j = 0, jj = this.molecule.bonds.length; j < jj; j++) {
						let b = this.molecule.bonds[j];
						if (b.contains(atom)) {
							let neigh = b.getNeighbor(atom);
							if (!neigh.visited) {
								neigh.visited = true;
								q.enqueue(neigh);
							}
						}
					}
				}
			}
		}
	};
})(ChemDoodle.structures, ChemDoodle.informatics);

(function(informatics, undefined) {
	'use strict';
	informatics._RingFinder = function() {
	};
	let _ = informatics._RingFinder.prototype;
	_.atoms = undefined;
	_.bonds = undefined;
	_.rings = undefined;
	_.reduce = function(molecule) {
		for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
			molecule.atoms[i].visited = false;
		}
		for ( let i = 0, ii = molecule.bonds.length; i < ii; i++) {
			molecule.bonds[i].visited = false;
		}
		let cont = true;
		while (cont) {
			cont = false;
			for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
				let count = 0;
				let bond;
				for ( let j = 0, jj = molecule.bonds.length; j < jj; j++) {
					if (molecule.bonds[j].contains(molecule.atoms[i]) && !molecule.bonds[j].visited) {
						count++;
						if (count === 2) {
							break;
						}
						bond = molecule.bonds[j];
					}
				}
				if (count === 1) {
					cont = true;
					bond.visited = true;
					molecule.atoms[i].visited = true;
				}
			}
		}
		for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
			if (!molecule.atoms[i].visited) {
				this.atoms.push(molecule.atoms[i]);
			}
		}
		for ( let i = 0, ii = molecule.bonds.length; i < ii; i++) {
			if (!molecule.bonds[i].visited) {
				this.bonds.push(molecule.bonds[i]);
			}
		}
		if (this.bonds.length === 0 && this.atoms.length !== 0) {
			this.atoms = [];
		}
	};
	_.setMolecule = function(molecule) {
		this.atoms = [];
		this.bonds = [];
		this.rings = [];
		this.reduce(molecule);
		if (this.atoms.length > 2 && this.innerGetRings) {
			this.innerGetRings();
		}
	};
	_.fuse = function() {
		for ( let i = 0, ii = this.rings.length; i < ii; i++) {
			for ( let j = 0, jj = this.bonds.length; j < jj; j++) {
				if (this.rings[i].atoms.indexOf(this.bonds[j].a1) !== -1 && this.rings[i].atoms.indexOf(this.bonds[j].a2) !== -1) {
					this.rings[i].bonds.push(this.bonds[j]);
				}
			}
		}
	};

})(ChemDoodle.informatics);
(function(informatics, structures, undefined) {
	'use strict';
	function Finger(a, from) {
		this.atoms = [];
		if (from) {
			for ( let i = 0, ii = from.atoms.length; i < ii; i++) {
				this.atoms[i] = from.atoms[i];
			}
		}
		this.atoms.push(a);
	}
	let _2 = Finger.prototype;
	_2.grow = function(bonds, blockers) {
		let last = this.atoms[this.atoms.length - 1];
		let neighs = [];
		for ( let i = 0, ii = bonds.length; i < ii; i++) {
			if (bonds[i].contains(last)) {
				let neigh = bonds[i].getNeighbor(last);
				if (blockers.indexOf(neigh) === -1) {
					neighs.push(neigh);
				}
			}
		}
		let returning = [];
		for ( let i = 0, ii = neighs.length; i < ii; i++) {
			returning.push(new Finger(neighs[i], this));
		}
		return returning;
	};
	_2.check = function(bonds, finger, a) {
		// check that they dont contain similar parts
		for ( let i = 0, ii = finger.atoms.length - 1; i < ii; i++) {
			if (this.atoms.indexOf(finger.atoms[i]) !== -1) {
				return undefined;
			}
		}
		let ring;
		// check if fingers meet at tips
		if (finger.atoms[finger.atoms.length - 1] === this.atoms[this.atoms.length - 1]) {
			ring = new structures.Ring();
			ring.atoms[0] = a;
			for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
				ring.atoms.push(this.atoms[i]);
			}
			for ( let i = finger.atoms.length - 2; i >= 0; i--) {
				ring.atoms.push(finger.atoms[i]);
			}
		} else {
			// check if fingers meet at bond
			let endbonds = [];
			for ( let i = 0, ii = bonds.length; i < ii; i++) {
				if (bonds[i].contains(finger.atoms[finger.atoms.length - 1])) {
					endbonds.push(bonds[i]);
				}
			}
			for ( let i = 0, ii = endbonds.length; i < ii; i++) {
				if ((finger.atoms.length === 1 || !endbonds[i].contains(finger.atoms[finger.atoms.length - 2])) && endbonds[i].contains(this.atoms[this.atoms.length - 1])) {
					ring = new structures.Ring();
					ring.atoms[0] = a;
					for ( let j = 0, jj = this.atoms.length; j < jj; j++) {
						ring.atoms.push(this.atoms[j]);
					}
					for ( let j = finger.atoms.length - 1; j >= 0; j--) {
						ring.atoms.push(finger.atoms[j]);
					}
					break;
				}
			}
		}
		return ring;
	};

	informatics.EulerFacetRingFinder = function(molecule) {
		this.setMolecule(molecule);
	};
	let _ = informatics.EulerFacetRingFinder.prototype = new informatics._RingFinder();
	_.fingerBreak = 5;
	_.innerGetRings = function() {
		for ( let i = 0, ii = this.atoms.length; i < ii; i++) {
			let neigh = [];
			for ( let j = 0, jj = this.bonds.length; j < jj; j++) {
				if (this.bonds[j].contains(this.atoms[i])) {
					neigh.push(this.bonds[j].getNeighbor(this.atoms[i]));
				}
			}
			for ( let j = 0, jj = neigh.length; j < jj; j++) {
				// weird that i can't optimize this loop without breaking a test
				// case...
				for ( let k = j + 1; k < neigh.length; k++) {
					let fingers = [];
					fingers[0] = new Finger(neigh[j]);
					fingers[1] = new Finger(neigh[k]);
					let blockers = [];
					blockers[0] = this.atoms[i];
					for ( let l = 0, ll = neigh.length; l < ll; l++) {
						if (l !== j && l !== k) {
							blockers.push(neigh[l]);
						}
					}
					let found = [];
					// check for 3 membered ring
					let three = fingers[0].check(this.bonds, fingers[1], this.atoms[i]);
					if (three) {
						found[0] = three;
					}
					while (found.length === 0 && fingers.length > 0 && fingers[0].atoms.length < this.fingerBreak) {
						let newfingers = [];
						for ( let l = 0, ll = fingers.length; l < ll; l++) {
							let adding = fingers[l].grow(this.bonds, blockers);
							for ( let m = 0, mm = adding.length; m < mm; m++) {
								newfingers.push(adding[m]);
							}
						}
						fingers = newfingers;
						for ( let l = 0, ll = fingers.length; l < ll; l++) {
							for ( let m = l + 1; m < ll; m++) {
								let r = fingers[l].check(this.bonds, fingers[m], this.atoms[i]);
								if (r) {
									found.push(r);
								}
							}
						}
						if (found.length === 0) {
							let newBlockers = [];
							for ( let l = 0, ll = blockers.length; l < ll; l++) {
								for ( let m = 0, mm = this.bonds.length; m < mm; m++) {
									if (this.bonds[m].contains(blockers[l])) {
										let neigh = this.bonds[m].getNeighbor(blockers[l]);
										if (blockers.indexOf(neigh) === -1 && newBlockers.indexOf(neigh) === -1) {
											newBlockers.push(neigh);
										}
									}
								}
							}
							for ( let l = 0, ll = newBlockers.length; l < ll; l++) {
								blockers.push(newBlockers[l]);
							}
						}
					}
					if (found.length > 0) {
						// this undefined is required...weird, don't know why
						let use = undefined;
						for ( let l = 0, ll = found.length; l < ll; l++) {
							if (!use || use.atoms.length > found[l].atoms.length) {
								use = found[l];
							}
						}
						let already = false;
						for ( let l = 0, ll = this.rings.length; l < ll; l++) {
							let all = true;
							for ( let m = 0, mm = use.atoms.length; m < mm; m++) {
								if (this.rings[l].atoms.indexOf(use.atoms[m]) === -1) {
									all = false;
									break;
								}
							}
							if (all) {
								already = true;
								break;
							}
						}
						if (!already) {
							this.rings.push(use);
						}
					}
				}
			}
		}
		this.fuse();
	};

})(ChemDoodle.informatics, ChemDoodle.structures);

(function(informatics, undefined) {
	'use strict';
	informatics.SSSRFinder = function(molecule) {
		this.rings = [];
		if (molecule.atoms.length > 0) {
			let frerejacqueNumber = new informatics.FrerejacqueNumberCounter(molecule).value;
			let all = new informatics.EulerFacetRingFinder(molecule).rings;
			all.sort(function(a, b) {
				return a.atoms.length - b.atoms.length;
			});
			for ( let i = 0, ii = molecule.bonds.length; i < ii; i++) {
				molecule.bonds[i].visited = false;
			}
			for ( let i = 0, ii = all.length; i < ii; i++) {
				let use = false;
				for ( let j = 0, jj = all[i].bonds.length; j < jj; j++) {
					if (!all[i].bonds[j].visited) {
						use = true;
						break;
					}
				}
				if (use) {
					for ( let j = 0, jj = all[i].bonds.length; j < jj; j++) {
						all[i].bonds[j].visited = true;
					}
					this.rings.push(all[i]);
				}
				if (this.rings.length === frerejacqueNumber) {
					break;
				}
			}
		}
	};

})(ChemDoodle.informatics);
(function(io, undefined) {
	'use strict';
	io._Interpreter = function() {
	};
	let _ = io._Interpreter.prototype;
	_.fit = function(data, length, leftAlign) {
		let size = data.length;
		let padding = [];
		for ( let i = 0; i < length - size; i++) {
			padding.push(' ');
		}
		return leftAlign ? data + padding.join('') : padding.join('') + data;
	};

})(ChemDoodle.io);

(function(c, io, structures, d3, m, m4, v3, undefined) {
	'use strict';
	let whitespaceRegex = /\s+/g;
	let whitespaceAndParenthesisRegex = /\(|\)|\s+/g;
	let whitespaceAndQuoteRegex = /\'|\s+/g;
	let whitespaceAndQuoteAndCommaRegex = /,|\'|\s+/g;
	let leadingWhitespaceRegex = /^\s+/;
	let digitsRegex = /[0-9]/g;
	let digitsSymbolRegex = /[0-9]|\+|\-/g;

	let filter = function(s) {
		return s.length !== 0;
	};

	let hallTranslations = {
		'P' : [],
		'A' : [ [ 0, .5, .5 ] ],
		'B' : [ [ .5, 0, .5 ] ],
		'C' : [ [ .5, .5, 0 ] ],
		'I' : [ [ .5, .5, .5 ] ],
		'R' : [ [ 2 / 3, 1 / 3, 1 / 3 ], [ 1 / 3, 2 / 3, 2 / 3 ] ],
		'S' : [ [ 1 / 3, 1 / 3, 2 / 3 ], [ 2 / 3, 2 / 3, 1 / 3 ] ],
		'T' : [ [ 1 / 3, 2 / 3, 1 / 3 ], [ 2 / 3, 1 / 3, 2 / 3 ] ],
		'F' : [ [ 0, .5, .5 ], [ .5, 0, .5 ], [ .5, .5, 0 ] ]
	};

	let parseTransform = function(s) {
		let displacement = 0;
		let x = 0, y = 0, z = 0;
		let indexx = s.indexOf('x');
		let indexy = s.indexOf('y');
		let indexz = s.indexOf('z');
		if (indexx !== -1) {
			x++;
			if (indexx > 0 && s.charAt(indexx - 1) !== '+') {
				x *= -1;
			}
		}
		if (indexy !== -1) {
			y++;
			if (indexy > 0 && s.charAt(indexy - 1) !== '+') {
				y *= -1;
			}
		}
		if (indexz !== -1) {
			z++;
			if (indexz > 0 && s.charAt(indexz - 1) !== '+') {
				z *= -1;
			}
		}
		if (s.length > 2) {
			let op = '+';
			for ( let i = 0, ii = s.length; i < ii; i++) {
				let l = s.charAt(i);
				if ((l === '-' || l === '/') && (i === s.length - 1 || s.charAt(i + 1).match(digitsRegex))) {
					op = l;
				}
				if (l.match(digitsRegex)) {
					if (op === '+') {
						displacement += parseInt(l);
					} else if (op === '-') {
						displacement -= parseInt(l);
					} else if (op === '/') {
						displacement /= parseInt(l);
					}
				}
			}
		}
		return [ displacement, x, y, z ];
	};

	io.CIFInterpreter = function() {
	};
	io.CIFInterpreter.generateABC2XYZ = function(a, b, c, alpha, beta, gamma) {
		let d = (m.cos(alpha) - m.cos(gamma) * m.cos(beta)) / m.sin(gamma);
		return [ a, 0, 0, 0, b * m.cos(gamma), b * m.sin(gamma), 0, 0, c * m.cos(beta), c * d, c * m.sqrt(1 - m.pow(m.cos(beta), 2) - d * d), 0, 0, 0, 0, 1 ];
	};
	let _ = io.CIFInterpreter.prototype = new io._Interpreter();
	_.read = function(content, xSuper, ySuper, zSuper) {
		xSuper = xSuper ? xSuper : 1;
		ySuper = ySuper ? ySuper : 1;
		zSuper = zSuper ? zSuper : 1;
		let molecule = new structures.Molecule();
		if (!content) {
			return molecule;
		}
		let lines = content.split('\n');
		let aLength = 0, bLength = 0, cLength = 0, alphaAngle = 0, betaAngle = 0, gammaAngle = 0;
		let hallClass = 'P';
		let transformLoop;
		let atomLoop;
		let bondLoop;

		let line;
		let shift = true;
		while (lines.length > 0) {
			if (shift) {
				line = lines.shift();
			} else {
				shift = true;
			}
			if (line.length > 0) {
				if (line.startsWith('_cell_length_a')) {
					aLength = parseFloat(line.split(whitespaceAndParenthesisRegex)[1]);
				} else if (line.startsWith('_cell_length_b')) {
					bLength = parseFloat(line.split(whitespaceAndParenthesisRegex)[1]);
				} else if (line.startsWith('_cell_length_c')) {
					cLength = parseFloat(line.split(whitespaceAndParenthesisRegex)[1]);
				} else if (line.startsWith('_cell_angle_alpha')) {
					alphaAngle = m.PI * parseFloat(line.split(whitespaceAndParenthesisRegex)[1]) / 180;
				} else if (line.startsWith('_cell_angle_beta')) {
					betaAngle = m.PI * parseFloat(line.split(whitespaceAndParenthesisRegex)[1]) / 180;
				} else if (line.startsWith('_cell_angle_gamma')) {
					gammaAngle = m.PI * parseFloat(line.split(whitespaceAndParenthesisRegex)[1]) / 180;
				} else if (line.startsWith('_symmetry_space_group_name_H-M')) {
					hallClass = line.split(whitespaceAndQuoteRegex)[1];
				} else if (line.startsWith('loop_')) {
					let loop = {
						fields : [],
						lines : []
					};
					let pushingLines = false;
					// keep undefined check here because the line may be an
					// empty string
					while ((line = lines.shift()) !== undefined && !(line = line.replace(leadingWhitespaceRegex, '')).startsWith('loop_') && line.length > 0) {
						// remove leading whitespace that may appear in
						// subloop lines ^
						if (line.startsWith('_')) {
							if (pushingLines) {
								break;
							}
							loop.fields = loop.fields.concat(line.split(whitespaceRegex).filter(filter));
						} else {
							pushingLines = true;
							loop.lines.push(line);
						}
					}
					if (lines.length !== 0 && (line.startsWith('loop_') || line.startsWith('_'))) {
						shift = false;
					}
					if (loop.fields.indexOf('_symmetry_equiv_pos_as_xyz') !== -1 || loop.fields.indexOf('_space_group_symop_operation_xyz') !== -1) {
						transformLoop = loop;
					} else if (loop.fields.indexOf('_atom_site_label') !== -1) {
						atomLoop = loop;
					} else if (loop.fields.indexOf('_geom_bond_atom_site_label_1') !== -1) {
						bondLoop = loop;
					}
				}
			}
		}
		let abc2xyz = io.CIFInterpreter.generateABC2XYZ(aLength, bLength, cLength, alphaAngle, betaAngle, gammaAngle);
		// internal atom coordinates
		if (atomLoop) {
			let labelIndex = -1, altLabelIndex = -1, xIndex = -1, yIndex = -1, zIndex = -1;
			for ( let i = 0, ii = atomLoop.fields.length; i < ii; i++) {
				let field = atomLoop.fields[i];
				if (field === '_atom_site_type_symbol') {
					labelIndex = i;
				} else if (field === '_atom_site_label') {
					altLabelIndex = i;
				} else if (field === '_atom_site_fract_x') {
					xIndex = i;
				} else if (field === '_atom_site_fract_y') {
					yIndex = i;
				} else if (field === '_atom_site_fract_z') {
					zIndex = i;
				}
			}
			for ( let i = 0, ii = atomLoop.lines.length; i < ii; i++) {
				line = atomLoop.lines[i];
				let tokens = line.split(whitespaceRegex).filter(filter);
				let a = new structures.Atom(tokens[labelIndex === -1 ? altLabelIndex : labelIndex].split(digitsSymbolRegex)[0], parseFloat(tokens[xIndex]), parseFloat(tokens[yIndex]), parseFloat(tokens[zIndex]));
				molecule.atoms.push(a);
				if (altLabelIndex !== -1) {
					a.cifId = tokens[altLabelIndex];
					a.cifPart = 0;
				}
			}
		}
		// transforms, unless bonds are specified
		if (transformLoop && !bondLoop) {
			// assume the index is 0, just incase a different identifier is
			// used
			let symIndex = 0;
			for ( let i = 0, ii = transformLoop.fields.length; i < ii; i++) {
				let field = transformLoop.fields[i];
				if (field === '_symmetry_equiv_pos_as_xyz' || field === '_space_group_symop_operation_xyz') {
					symIndex = i;
				}
			}
			let impliedTranslations = hallTranslations[hallClass];
			let add = [];
			for ( let i = 0, ii = transformLoop.lines.length; i < ii; i++) {
				let parts = transformLoop.lines[i].split(whitespaceAndQuoteAndCommaRegex).filter(filter);
				let multx = parseTransform(parts[symIndex]);
				let multy = parseTransform(parts[symIndex + 1]);
				let multz = parseTransform(parts[symIndex + 2]);
				for ( let j = 0, jj = molecule.atoms.length; j < jj; j++) {
					let a = molecule.atoms[j];
					let x = a.x * multx[1] + a.y * multx[2] + a.z * multx[3] + multx[0];
					let y = a.x * multy[1] + a.y * multy[2] + a.z * multy[3] + multy[0];
					let z = a.x * multz[1] + a.y * multz[2] + a.z * multz[3] + multz[0];
					let copy1 = new structures.Atom(a.label, x, y, z);
					add.push(copy1);
					// cifID could be 0, so check for undefined
					if (a.cifId !== undefined) {
						copy1.cifId = a.cifId;
						copy1.cifPart = i + 1;
					}
					if (impliedTranslations) {
						for ( let k = 0, kk = impliedTranslations.length; k < kk; k++) {
							let trans = impliedTranslations[k];
							let copy2 = new structures.Atom(a.label, x + trans[0], y + trans[1], z + trans[2]);
							add.push(copy2);
							// cifID could be 0, so check for undefined
							if (a.cifId !== undefined) {
								copy2.cifId = a.cifId;
								copy2.cifPart = i + 1;
							}
						}
					}
				}
			}
			// make sure all atoms are within the unit cell
			for ( let i = 0, ii = add.length; i < ii; i++) {
				let a = add[i];
				while (a.x >= 1) {
					a.x--;
				}
				while (a.x < 0) {
					a.x++;
				}
				while (a.y >= 1) {
					a.y--;
				}
				while (a.y < 0) {
					a.y++;
				}
				while (a.z >= 1) {
					a.z--;
				}
				while (a.z < 0) {
					a.z++;
				}
			}
			// remove overlaps
			let noOverlaps = [];
			for ( let i = 0, ii = add.length; i < ii; i++) {
				let overlap = false;
				let a = add[i];
				for ( let j = 0, jj = molecule.atoms.length; j < jj; j++) {
					if (molecule.atoms[j].distance3D(a) < .0001) {
						overlap = true;
						break;
					}
				}
				if (!overlap) {
					for ( let j = 0, jj = noOverlaps.length; j < jj; j++) {
						if (noOverlaps[j].distance3D(a) < .0001) {
							overlap = true;
							break;
						}
					}
					if (!overlap) {
						noOverlaps.push(a);
					}
				}
			}
			// concat arrays
			molecule.atoms = molecule.atoms.concat(noOverlaps);
		}
		// build super cell
		let extras = [];
		for ( let i = 0; i < xSuper; i++) {
			for ( let j = 0; j < ySuper; j++) {
				for ( let k = 0; k < zSuper; k++) {
					if (!(i === 0 && j === 0 && k === 0)) {
						for ( let l = 0, ll = molecule.atoms.length; l < ll; l++) {
							let a = molecule.atoms[l];
							let copy = new structures.Atom(a.label, a.x + i, a.y + j, a.z + k);
							extras.push(copy);
							// cifID could be 0, so check for undefined
							if (a.cifId !== undefined) {
								copy.cifId = a.cifId;
								copy.cifPart = a.cifPart + (transformLoop ? transformLoop.lines.length : 0) + i + j * 10 + k * 100;
							}
						}
					}
				}
			}
		}
		molecule.atoms = molecule.atoms.concat(extras);
		// convert to xyz
		for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
			let a = molecule.atoms[i];
			let xyz = m4.multiplyVec3(abc2xyz, [ a.x, a.y, a.z ]);
			a.x = xyz[0];
			a.y = xyz[1];
			a.z = xyz[2];
		}
		// handle bonds
		if (bondLoop) {
			let atom1 = -1, atom2 = -1;
			for ( let i = 0, ii = bondLoop.fields.length; i < ii; i++) {
				let field = bondLoop.fields[i];
				if (field === '_geom_bond_atom_site_label_1') {
					atom1 = i;
				} else if (field === '_geom_bond_atom_site_label_2') {
					atom2 = i;
				}
			}
			for ( let k = 0, kk = bondLoop.lines.length; k < kk; k++) {
				let tokens = bondLoop.lines[k].split(whitespaceRegex).filter(filter);
				let id1 = tokens[atom1];
				let id2 = tokens[atom2];
				for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
					for ( let j = i + 1; j < ii; j++) {
						let ai = molecule.atoms[i];
						let aj = molecule.atoms[j];
						if (ai.cifPart !== aj.cifPart) {
							break;
						}
						if (ai.cifId === id1 && aj.cifId === id2 || ai.cifId === id2 && aj.cifId === id1) {
							molecule.bonds.push(new structures.Bond(ai, aj));
						}
					}
				}
			}
		} else {
			new c.informatics.BondDeducer().deduceCovalentBonds(molecule, 1);
		}
		// here we also generate the unit cell
		return {molecule:molecule, unitCell: new d3.UnitCell([aLength, bLength, cLength], [alphaAngle, betaAngle, gammaAngle], [ 0, 0, 0 ])};
	};

	// shortcuts
	let interpreter = new io.CIFInterpreter();
	c.readCIF = function(content, xSuper, ySuper, zSuper) {
		return interpreter.read(content, xSuper, ySuper, zSuper);
	};

})(ChemDoodle, ChemDoodle.io, ChemDoodle.structures, ChemDoodle.structures.d3, Math, ChemDoodle.lib.mat4, ChemDoodle.lib.vec3);
(function(c, io, structures, undefined) {
	'use strict';
	io.CMLInterpreter = function() {
	};
	let _ = io.CMLInterpreter.prototype = new io._Interpreter();
	_.read = function(content) {
		let molecules = [];
		let parser = new DOMParser();
		let xmlDoc = parser.parseFromString(content, 'text/xml');
		// Possible for multiple CML tags to exist
		let allCml = xmlDoc.getElementsByTagName('cml');
		for (let i = 0, ii = allCml.length; i < ii; i++){
			let allMolecules = allCml[i].getElementsByTagName('molecule');
			for (let j = 0, jj = allMolecules.length; j < jj; j++) {
				let currentMolecule = molecules[j] = new structures.Molecule();
				let idmap = [];
				// Don't even bother with atomArrays, there's no point.
				let cmlAtoms = allMolecules[j].getElementsByTagName('atom');
				for (let k = 0, kk = cmlAtoms.length; k < kk; k++) {
					let currentCMLAtom = cmlAtoms[k];
					let label = currentCMLAtom.getAttribute('elementType');
					let x = currentCMLAtom.getAttribute('x2');
					let y = currentCMLAtom.getAttribute('y2');
					let z = 0;
					if (x === null || x === '') {
						x = currentCMLAtom.getAttribute('x3');
						y = currentCMLAtom.getAttribute('y3');
						z = currentCMLAtom.getAttribute('z3');
					}
					let currentAtom = molecules[j].atoms[k] = new structures.Atom(label, x, y, z);
					idmap[k] = currentCMLAtom.getAttribute('id');
					// charge
					if (currentCMLAtom.getAttribute('formalCharge') !== null) {
						currentAtom.charge = currentCMLAtom.getAttribute('formalCharge');
					}
				}
				let cmlBonds = allMolecules[j].getElementsByTagName('bond');
				for (let k = 0, kk = cmlBonds.length; k < kk; k++) {
					let currentCMLBond = cmlBonds[k];
					let atomRefs2 = currentCMLBond.getAttribute('atomRefs2').split(' ');
					let a1, a2, order;
					a1 = currentMolecule.atoms[idmap.indexOf(atomRefs2[0])];
					a2 = currentMolecule.atoms[idmap.indexOf(atomRefs2[1])];
					switch(currentCMLBond.getAttribute('order')) {
					case '2':
					case 'D':
						order = 2;
						break;
					case '3':
					case 'T':
						order = 3;
						break;
					case 'A':
						order = 1.5;
						break;
					default:
						order = 1;	 
					}
					let currentBond = molecules[j].bonds[k] = new structures.Bond(a1, a2, order);
					// check stereo... only support W or H
					let bondStereoElement = currentCMLBond.querySelector('bondStereo');
					if(bondStereoElement){
						switch (bondStereoElement.textContent) {
						case 'W':
							currentBond.stereo = structures.Bond.STEREO_PROTRUDING;
							break;
						case 'H':
							currentBond.stereo = structures.Bond.STEREO_RECESSED;
							break;
						}
					}
				}
			}
		}
		return molecules;
	};
	_.write = function(molecules) {
		let sb = [];
		sb.push('<?xml version="1.0" encoding="UTF-8"?>\n');
		sb.push('<cml convention="conventions:molecular" xmlns="http://www.xml-cml.org/schema" xmlns:conventions="http://www.xml-cml.org/convention/" xmlns:dc="http://purl.org/dc/elements/1.1/">\n');
		// TODO: Metadata
		for (let i = 0, ii = molecules.length; i < ii; i++) {
			sb.push('<molecule id="m'); 
			sb.push(i); 
			sb.push('">');
			sb.push('<atomArray>');
			for (let j = 0, jj = molecules[i].atoms.length; j < jj; j++) {
				let currentAtom = molecules[i].atoms[j];
				sb.push('<atom elementType="'); 
				sb.push(currentAtom.label); 
				sb.push('" id="a');
				sb.push(j); 
				sb.push('" ');
				// Always do 3D coordinates, unless there is a fancy reliable way to tell if the molecule is 2D.
				sb.push('x3="');
				sb.push(currentAtom.x);
				sb.push('" y3="');
				sb.push(currentAtom.y);
				sb.push('" z3="');
				sb.push(currentAtom.z);
				sb.push('" ');
				if (currentAtom.charge != 0) {
					sb.push('formalCharge="');
					sb.push(currentAtom.charge);
					sb.push('" ');
				}
				sb.push('/>');
			}
			sb.push('</atomArray>');
			sb.push('<bondArray>');
			for (let j = 0, jj = molecules[i].bonds.length; j < jj; j++) {
				let currentBond = molecules[i].bonds[j];
				sb.push('<bond atomRefs2="a');
				sb.push(molecules[i].atoms.indexOf(currentBond.a1));
				sb.push(' a');
				sb.push(molecules[i].atoms.indexOf(currentBond.a2));
				sb.push('" order="');
				switch(currentBond.bondOrder) {
				case 1.5:
					sb.push('A');
					break;
				case 1:
				case 2:
				case 3:
					sb.push(currentBond.bondOrder);
					break;
				case 0.5:
				default:
					sb.push('S');
				break;
				}
				sb.push('"/>');
			}
			sb.push('</bondArray>');
			sb.push('</molecule>');
		}
		sb.push('</cml>');
		return sb.join('');
	};

	// shortcuts
	let interpreter = new io.CMLInterpreter();
	c.readCML = function(content) {
		return interpreter.read(content);
	};
	c.writeCML = function(molecules) {
		return interpreter.write(molecules);
	};
	
})(ChemDoodle, ChemDoodle.io, ChemDoodle.structures);

(function(c, ELEMENT, io, structures, undefined) {
	'use strict';
	io.MOLInterpreter = function() {
	};
	let _ = io.MOLInterpreter.prototype = new io._Interpreter();
	_.version = 2;
	_.read = function(content, multiplier) {
		if (!multiplier) {
			multiplier = c.DEFAULT_STYLES.bondLength_2D;
		}
		let molecule = new structures.Molecule();
		if (!content) {
			return molecule;
		}
		let lines = content.split('\n');

		let counts = lines[3];
		let numAtoms = parseInt(counts.substring(0, 3));
		let numBonds = parseInt(counts.substring(3, 6));
		let version = counts.substring(34, 39).trim().toUpperCase()==='V3000'?3:2;

		if(version===2){
			for ( let i = 0; i < numAtoms; i++) {
				let line = lines[4 + i];
				let a = new structures.Atom(line.substring(31, 34), parseFloat(line.substring(0, 10)) * multiplier, (multiplier === 1 ? 1 : -1) * parseFloat(line.substring(10, 20)) * multiplier, parseFloat(line.substring(20, 30)) * multiplier);
				let massDif = parseInt(line.substring(34, 36));
				if (massDif !== 0 && ELEMENT[a.label]) {
					a.mass = ELEMENT[a.label].mass + massDif;
				}
				switch (parseInt(line.substring(36, 39))) {
				case 1:
					a.charge = 3;
					break;
				case 2:
					a.charge = 2;
					break;
				case 3:
					a.charge = 1;
					break;
				case 5:
					a.charge = -1;
					break;
				case 6:
					a.charge = -2;
					break;
				case 7:
					a.charge = -3;
					break;
				}
				molecule.atoms[i] = a;
			}
			for ( let i = 0; i < numBonds; i++) {
				let line = lines[4 + numAtoms + i];
				let bondOrder = parseInt(line.substring(6, 9));
				let stereo = parseInt(line.substring(9, 12));
				if (bondOrder > 3) {
					switch (bondOrder) {
					case 4:
						bondOrder = 1.5;
						break;
					default:
						bondOrder = 1;
						break;
					}
				}
				let b = new structures.Bond(molecule.atoms[parseInt(line.substring(0, 3)) - 1], molecule.atoms[parseInt(line.substring(3, 6)) - 1], bondOrder);
				switch (stereo) {
				case 3:
					b.stereo = structures.Bond.STEREO_AMBIGUOUS;
					break;
				case 1:
					b.stereo = structures.Bond.STEREO_PROTRUDING;
					break;
				case 6:
					b.stereo = structures.Bond.STEREO_RECESSED;
					break;
				}
				molecule.bonds[i] = b;
			}
		}else if(version===3){
			let block;
			for(let i = 4, ii=lines.length; i<ii; i++){
				let line = lines[i].trim();
				
				if(line.startsWith('M  V30 ')){
					line = line.substring(7);
					if(line.startsWith('BEGIN ')){
						block = line.substring(6);
					}else if(line.startsWith('END ')){
						block = undefined;
					}else{
						let tokens = line.split(/(\s+)/).filter( e => e.trim().length > 0);
						if(block==='ATOM'){
							// first two tokens are M and V30, already removed
							// 3rd token is index
							let a = new structures.Atom(tokens[1], parseFloat(tokens[2]) * multiplier, (multiplier === 1 ? 1 : -1) * parseFloat(tokens[3]) * multiplier, parseFloat(tokens[4]) * multiplier);
							// 8th token is aamap
							// remaining tokens
							for(let j = 6, jj=tokens.length; j<jj; j++){
								let token = tokens[j];
								let equalsIndex = token.indexOf('=');
								if(equalsIndex!==-1){
									let field = token.substring(0, equalsIndex);
									let value = token.substring(equalsIndex+1);
									if(field==='CHG'){
										a.charge = parseInt(value);
									}else if(field==='RAD'){
										a.numRadical = parseInt(value);
									}else if(field==='MASS'){
										a.mass = parseInt(value);
									}else if(field==='VAL'){
									
									}
								}
							}
							molecule.atoms.push(a);
						}else if(block==='BOND'){
							// first two tokens are M and V30, already removed
							// 3rd token is index
							let bondOrder = parseInt(tokens[1]);
							if (bondOrder > 3) {
								switch (bondOrder) {
								case 4:
									bondOrder = 1.5;
									break;
								default:
									bondOrder = 1;
									break;
								}
							}
							let b = new structures.Bond(molecule.atoms[parseInt(tokens[2]) - 1], molecule.atoms[parseInt(tokens[3]) - 1], bondOrder);
							// remaining tokens
							for(let j = 4, jj=tokens.length; j<jj; j++){
								let token = tokens[j];
								let equalsIndex = token.indexOf('=');
								if(equalsIndex!==-1){
									let field = token.substring(0, equalsIndex);
									let value = token.substring(equalsIndex+1);
									if(field==='CFG'){
										switch (parseInt(value)) {
										case 2:
											b.stereo = structures.Bond.STEREO_AMBIGUOUS;
											break;
										case 1:
											b.stereo = structures.Bond.STEREO_PROTRUDING;
											break;
										case 3:
											b.stereo = structures.Bond.STEREO_RECESSED;
											break;
										default:
											break;
										}
									}
								}
							}
							molecule.bonds.push(b);
						}else if(block==='COLLECTION'){
							if(line.startsWith('MDLV30/STEREL')){
								line = line.substring(13);
								let firstSpace = line.indexOf(' ');
								let group = parseInt(line.substring(0, firstSpace));
								let value = line.substring(firstSpace+1);
								// cut out values
								value = value.substring(7, value.length-1);
								let tokens2 = value.split(/(\s+)/).filter( e => e.trim().length > 0);
								for(let j = 1, jj=tokens2.length; j<jj; j++){
									let t = tokens2[j];
									molecule.atoms[parseInt(t)-1].enhancedStereo = {type:structures.Atom.ESTEREO_OR, group:group};
								}
							}else if(line.startsWith('MDLV30/STERAC')){
								line = line.substring(13);
								let firstSpace = line.indexOf(' ');
								let group = parseInt(line.substring(0, firstSpace));
								let value = line.substring(firstSpace+1);
								// cut out values
								value = value.substring(7, value.length-1);
								let tokens2 = value.split(/(\s+)/).filter( e => e.trim().length > 0);
								for(let j = 1, jj=tokens2.length; j<jj; j++){
									let t = tokens2[j];
									molecule.atoms[parseInt(t)-1].enhancedStereo = {type:structures.Atom.ESTEREO_AND, group:group};
								}
							}
						}
					}
				}
			}
		}
		
		return molecule;
	};
	_.write = function(molecule) {
		let sb = [];
		sb.push('Molecule from ChemDoodle Web Components\n\nhttp://www.ichemlabs.com\n');
		sb.push(this.fit(molecule.atoms.length.toString(), 3));
		sb.push(this.fit(molecule.bonds.length.toString(), 3));
		sb.push('  0  0  0  0            999 V'+this.version+'000\n');
		let p = molecule.getCenter();
		
		if(this.version===2){
			for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
				let a = molecule.atoms[i];
				let mass = ' 0';
				if (a.mass !== -1 && ELEMENT[a.label]) {
					let dif = a.mass - ELEMENT[a.label].mass;
					if (dif < 5 && dif > -4) {
						mass = (dif > -1 ? ' ' : '') + dif;
					}
				}
				let charge = '  0';
				if (a.charge !== 0) {
					switch (a.charge) {
					case 3:
						charge = '  1';
						break;
					case 2:
						charge = '  2';
						break;
					case 1:
						charge = '  3';
						break;
					case -1:
						charge = '  5';
						break;
					case -2:
						charge = '  6';
						break;
					case -3:
						charge = '  7';
						break;
					}
				}
				sb.push(this.fit(((a.x - p.x) / c.DEFAULT_STYLES.bondLength_2D).toFixed(4), 10));
				sb.push(this.fit((-(a.y - p.y) / c.DEFAULT_STYLES.bondLength_2D).toFixed(4), 10));
				sb.push(this.fit((a.z / c.DEFAULT_STYLES.bondLength_2D).toFixed(4), 10));
				sb.push(' ');
				sb.push(this.fit(a.label, 3, true));
				sb.push(mass);
				sb.push(charge);
				sb.push('  0  0  0  0\n');
			}
			for ( let i = 0, ii = molecule.bonds.length; i < ii; i++) {
				let b = molecule.bonds[i];
				let stereo = 0;
				if (b.stereo === structures.Bond.STEREO_AMBIGUOUS) {
					stereo = 3;
				} else if (b.stereo === structures.Bond.STEREO_PROTRUDING) {
					stereo = 1;
				} else if (b.stereo === structures.Bond.STEREO_RECESSED) {
					stereo = 6;
				}
				sb.push(this.fit((molecule.atoms.indexOf(b.a1) + 1).toString(), 3));
				sb.push(this.fit((molecule.atoms.indexOf(b.a2) + 1).toString(), 3));
				let btype = b.bondOrder;
				if(btype==1.5){
					btype = 4;
				}else if(btype>3 || btype%1!=0){
					btype = 1;
				}
				sb.push(this.fit(btype.toString(), 3));
				sb.push('  ');
				sb.push(stereo);
				sb.push('  0  0  0\n');
			}
		}else if(this.version===3){
			// begin v3000 ctab
			sb.push('M  V30 BEGIN CTAB\n');
			// counts
			sb.push('M  V30 COUNTS ');
			sb.push(molecule.atoms.length);
			sb.push(' ');
			sb.push(molecule.bonds.length);
			sb.push(' 0 0 0\n');
			sb.push('M  V30 BEGIN ATOM\n');
			for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
				let a = molecule.atoms[i];
				sb.push('M  V30 ');
				sb.push(i+1);
				sb.push(' ');
				sb.push(a.label);
				sb.push(' ');
				sb.push(((a.x - p.x) / c.DEFAULT_STYLES.bondLength_2D).toFixed(6));
				sb.push(' ');
				sb.push((-(a.y - p.y) / c.DEFAULT_STYLES.bondLength_2D).toFixed(6));
				sb.push(' ');
				sb.push((a.z / c.DEFAULT_STYLES.bondLength_2D).toFixed(6));
				sb.push(' 0');
				if(a.charge!==0){
					sb.push(' CHG=');
					sb.push(a.charge);
				}
				if(a.numRadical!==0){
					sb.push(' RAD=');
					sb.push(a.numRadical);
				}
				if(a.mass!==-1){
					sb.push(' MASS=');
					sb.push(a.mass);
				}
				sb.push('\n');
			}
			sb.push('M  V30 END ATOM\n');
			sb.push('M  V30 BEGIN BOND\n');
			for ( let i = 0, ii = molecule.bonds.length; i < ii; i++) {
				let b = molecule.bonds[i];
				let btype = b.bondOrder;
				if(btype==1.5){
					btype = 4;
				}else if(btype>3 || btype%1!=0){
					btype = 1;
				}
				
				sb.push('M  V30 ');
				sb.push(i+1);
				sb.push(' ');
				sb.push(btype);
				sb.push(' ');
				sb.push(molecule.atoms.indexOf(b.a1) + 1);
				sb.push(' ');
				sb.push(molecule.atoms.indexOf(b.a2) + 1);
				if(b.stereo !== structures.Bond.STEREO_NONE){
					let stereo = 0;
					if (b.stereo === structures.Bond.STEREO_AMBIGUOUS) {
						stereo = 2;
					} else if (b.stereo === structures.Bond.STEREO_PROTRUDING) {
						stereo = 1;
					} else if (b.stereo === structures.Bond.STEREO_RECESSED) {
						stereo = 3;
					}
					sb.push(' CFG=');
					sb.push(stereo);
				}
				sb.push('\n');
			}
			sb.push('M  V30 END BOND\n');
			let and, or;
			for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
				let a = molecule.atoms[i];
				if (a.enhancedStereo.type!==structures.Atom.ESTEREO_ABSOLUTE) {
					if (!and) {
						and = [];
						or = [];
					}
					let addingTo;
					if (a.enhancedStereo.type===structures.Atom.ESTEREO_AND) {
						addingTo = and;
					} else if (a.enhancedStereo.type===structures.Atom.ESTEREO_OR) {
						addingTo = or;
					}
					let group;
					for ( let j = 0, jj = addingTo.length; j < jj; j++) {
						let g = addingTo[j];
						if (g.group == a.enhancedStereo.group) {
							group = g;
							break;
						}
					}
					if (!group) {
						group = {group:a.enhancedStereo.group, list:[]};
						addingTo.push(group);
					}
					group.list.push(a);
				}
			}
			if (and && (and.length>0 || or.length>0)) {
				sb.push('M  V30 BEGIN COLLECTION\n');
				if(and.length>0) {
					for ( let i = 0, ii = and.length; i < ii; i++) {
						let g = and[i];
						sb.push('M  V30 MDLV30/STERAC');
						sb.push(g.group);
						sb.push(' ATOMS=(');
						sb.push(g.list.length);
						for ( let j = 0, jj = g.list.length; j < jj; j++) {
							sb.push(' ');
							sb.push(molecule.atoms.indexOf(g.list[j])+1);
						}
						sb.push(')\n');
					}
				}
				if(or.length>0) {
					for ( let i = 0, ii = or.length; i < ii; i++) {
						let g = or[i];
						sb.push('M  V30 MDLV30/STEREL');
						sb.push(g.group);
						sb.push(' ATOMS=(');
						sb.push(g.list.length);
						for ( let j = 0, jj = g.list.length; j < jj; j++) {
							sb.push(' ');
							sb.push(molecule.atoms.indexOf(g.list[j])+1);
						}
						sb.push(')\n');
					}
				}
				sb.push('M  V30 END COLLECTION\n');
			}
			sb.push('M  V30 END CTAB\n');
		}
		sb.push('M  END');
		return sb.join('');
	};

	// shortcuts
	let interpreter2 = new io.MOLInterpreter();
	c.readMOL = function(content, multiplier) {
		return interpreter2.read(content, multiplier);
	};
	c.writeMOL = function(mol) {
		return interpreter2.write(mol);
	};
	let interpreter3 = new io.MOLInterpreter();
	interpreter3.version = 3;
	c.writeMOLV3 = function(mol) {
		return interpreter3.write(mol);
	};

})(ChemDoodle, ChemDoodle.ELEMENT, ChemDoodle.io, ChemDoodle.structures);

(function(c, io, structures, ELEMENT, m, undefined) {
	'use strict';
	function checkContained(residue, set, chainID, index, helix) {
		for ( let j = 0, jj = set.length; j < jj; j++) {
			let check = set[j];
			if (check.id === chainID && index >= check.start && index <= check.end) {
				if (helix) {
					residue.helix = true;
				} else {
					residue.sheet = true;
				}
				if (index === check.end) {
					residue.arrow = true;
				}
				return;
			}
		}
	}
	
	io.PDBInterpreter = function() {
	};
	let _ = io.PDBInterpreter.prototype = new io._Interpreter();
	_.calculateRibbonDistances = false;
	_.deduceResidueBonds = false;
	_.read = function(content, multiplier) {
		let molecule = new structures.Molecule();
		molecule.chains = [];
		if (!content) {
			return molecule;
		}
		let currentTagTokens = content.split('\n');
		if (!multiplier) {
			multiplier = 1;
		}
		let helices = [];
		let sheets = [];
		let lastC;
		let currentChain = [];
		let resatoms = [];
		let atomSerials = [];
		for ( let i = 0, ii = currentTagTokens.length; i < ii; i++) {
			let line = currentTagTokens[i];
			if (line.startsWith('HELIX')) {
				helices.push({
					id : line.substring(19, 20),
					start : parseInt(line.substring(21, 25)),
					end : parseInt(line.substring(33, 37))
				});
			} else if (line.startsWith('SHEET')) {
				sheets.push({
					id : line.substring(21, 22),
					start : parseInt(line.substring(22, 26)),
					end : parseInt(line.substring(33, 37))
				});
			} else if (line.startsWith('ATOM')) {
				let altLoc = line.substring(16, 17);
				if (altLoc === ' ' || altLoc === 'A') {
					let label = line.substring(76, 78).trim();
					if (label.length === 0) {
						let s = line.substring(12, 14).trim();
						if (s === 'HD') {
							label = 'H';
						} else if (s.length > 0) {
							if (s.length > 1) {
								label = s.charAt(0) + s.substring(1).toLowerCase();
							} else {
								label = s;
							}
						}
					}
					let a = new structures.Atom(label, parseFloat(line.substring(30, 38)) * multiplier, parseFloat(line.substring(38, 46)) * multiplier, parseFloat(line.substring(46, 54)) * multiplier);
					a.hetatm = false;
					resatoms.push(a);
					// set up residue
					let resSeq = parseInt(line.substring(22, 26));
					if (currentChain.length === 0) {
						for ( let j = 0; j < 3; j++) {
							let dummyFront = new structures.Residue(-1);
							dummyFront.cp1 = a;
							dummyFront.cp2 = a;
							currentChain.push(dummyFront);
						}
					}
					if (resSeq !== Number.NaN && currentChain[currentChain.length - 1].resSeq !== resSeq) {
						let r = new structures.Residue(resSeq);
						r.name = line.substring(17, 20).trim();
						if (r.name.length === 3) {
							r.name = r.name.substring(0, 1) + r.name.substring(1).toLowerCase();
						} else {
							if (r.name.length === 2 && r.name.charAt(0) === 'D') {
								r.name = r.name.substring(1);
							}
						}
						currentChain.push(r);
						let chainID = line.substring(21, 22);
						checkContained(r, helices, chainID, resSeq, true);
						checkContained(r, sheets, chainID, resSeq, false);
					}
					// end residue setup
					let atomName = line.substring(12, 16).trim();
					let currentResidue = currentChain[currentChain.length - 1];
					if (atomName === 'CA' || atomName === 'P' || atomName === 'O5\'') {
						if (!currentResidue.cp1) {
							currentResidue.cp1 = a;
						}
					} else if (atomName === 'N3' && (currentResidue.name === 'C' || currentResidue.name === 'U' || currentResidue.name === 'T') || atomName === 'N1' && (currentResidue.name === 'A' || currentResidue.name === 'G')) {
						// control points for base platform direction
						currentResidue.cp3 = a;
					} else if (atomName === 'C2') {
						// control points for base platform orientation
						currentResidue.cp4 = a;
					} else if (atomName === 'C4' && (currentResidue.name === 'C' || currentResidue.name === 'U' || currentResidue.name === 'T') || atomName === 'C6' && (currentResidue.name === 'A' || currentResidue.name === 'G')) {
						// control points for base platform orientation
						currentResidue.cp5 = a;
					} else if (atomName === 'O' || atomName === 'C6' && (currentResidue.name === 'C' || currentResidue.name === 'U' || currentResidue.name === 'T') || atomName === 'N9') {
						if (!currentChain[currentChain.length - 1].cp2) {
							if (atomName === 'C6' || atomName === 'N9') {
								lastC = a;
							}
							currentResidue.cp2 = a;
						}
					} else if (atomName === 'C') {
						lastC = a;
					}
				}
			} else if (line.startsWith('HETATM')) {
				let symbol = line.substring(76, 78).trim();
				if (symbol.length === 0) {
					// handle the case where an improperly formatted PDB
					// file states the element label in the atom name column
					symbol = line.substring(12, 16).trim();
				}
				if (symbol.length > 1) {
					symbol = symbol.substring(0, 1) + symbol.substring(1).toLowerCase();
				}
				let het = new structures.Atom(symbol, parseFloat(line.substring(30, 38)) * multiplier, parseFloat(line.substring(38, 46)) * multiplier, parseFloat(line.substring(46, 54)) * multiplier);
				het.hetatm = true;
				let residueName = line.substring(17, 20).trim();
				if (residueName === 'HOH') {
					het.isWater = true;
				}
				molecule.atoms.push(het);
				atomSerials[parseInt(line.substring(6, 11).trim())] = het;
			} else if (line.startsWith('CONECT')) {
				let oid = parseInt(line.substring(6, 11).trim());
				if (atomSerials[oid]) {
					let origin = atomSerials[oid];
					for ( let k = 0; k < 4; k++) {
						let next = line.substring(11 + k * 5, 16 + k * 5).trim();
						if (next.length !== 0) {
							let nid = parseInt(next);
							if (atomSerials[nid]) {
								let a2 = atomSerials[nid];
								let found = false;
								for ( let j = 0, jj = molecule.bonds.length; j < jj; j++) {
									let b = molecule.bonds[j];
									if (b.a1 === origin && b.a2 === a2 || b.a1 === a2 && b.a2 === origin) {
										found = true;
										break;
									}
								}
								if (!found) {
									molecule.bonds.push(new structures.Bond(origin, a2));
								}
							}
						}
					}
				}
			} else if (line.startsWith('TER')) {
				this.endChain(molecule, currentChain, lastC, resatoms);
				currentChain = [];
			} else if (line.startsWith('ENDMDL')) {
				break;
			}
		}
		this.endChain(molecule, currentChain, lastC, resatoms);
		if (molecule.bonds.length === 0) {
			new c.informatics.BondDeducer().deduceCovalentBonds(molecule, multiplier);
		}
		if (this.deduceResidueBonds) {
			for ( let i = 0, ii = resatoms.length; i < ii; i++) {
				let max = m.min(ii, i + 20);
				for ( let j = i + 1; j < max; j++) {
					let first = resatoms[i];
					let second = resatoms[j];
					if (first.distance3D(second) < (ELEMENT[first.label].covalentRadius + ELEMENT[second.label].covalentRadius) * 1.1) {
						molecule.bonds.push(new structures.Bond(first, second, 1));
					}
				}
			}
		}
		molecule.atoms = molecule.atoms.concat(resatoms);
		if (this.calculateRibbonDistances) {
			this.calculateDistances(molecule, resatoms);
		}
		return molecule;
	};
	_.endChain = function(molecule, chain, lastC, resatoms) {
		if (chain.length > 0) {
			let last = chain[chain.length - 1];
			if (!last.cp1) {
				last.cp1 = resatoms[resatoms.length - 2];
			}
			if (!last.cp2) {
				last.cp2 = resatoms[resatoms.length - 1];
			}
			for ( let i = 0; i < 4; i++) {
				let dummyEnd = new structures.Residue(-1);
				dummyEnd.cp1 = lastC;
				dummyEnd.cp2 = chain[chain.length - 1].cp2;
				chain.push(dummyEnd);
			}
			molecule.chains.push(chain);
		}
	};
	_.calculateDistances = function(molecule, resatoms) {
		let hetatm = [];
		for ( let i = 0, ii = molecule.atoms.length; i < ii; i++) {
			let a = molecule.atoms[i];
			if (a.hetatm) {
				if (!a.isWater) {
					hetatm.push(a);
				}
			}
		}
		for ( let i = 0, ii = resatoms.length; i < ii; i++) {
			let a = resatoms[i];
			a.closestDistance = Number.POSITIVE_INFINITY;
			if (hetatm.length === 0) {
				a.closestDistance = 0;
			} else {
				for ( let j = 0, jj = hetatm.length; j < jj; j++) {
					a.closestDistance = Math.min(a.closestDistance, a.distance3D(hetatm[j]));
				}
			}
		}
	};

	// shortcuts
	let interpreter = new io.PDBInterpreter();
	c.readPDB = function(content, multiplier) {
		return interpreter.read(content, multiplier);
	};

})(ChemDoodle, ChemDoodle.io, ChemDoodle.structures, ChemDoodle.ELEMENT, Math);

(function(c, io, structures, undefined) {
	'use strict';
	let SQZ_HASH = {
		'@' : 0,
		'A' : 1,
		'B' : 2,
		'C' : 3,
		'D' : 4,
		'E' : 5,
		'F' : 6,
		'G' : 7,
		'H' : 8,
		'I' : 9,
		'a' : -1,
		'b' : -2,
		'c' : -3,
		'd' : -4,
		'e' : -5,
		'f' : -6,
		'g' : -7,
		'h' : -8,
		'i' : -9
	}, DIF_HASH = {
		'%' : 0,
		'J' : 1,
		'K' : 2,
		'L' : 3,
		'M' : 4,
		'N' : 5,
		'O' : 6,
		'P' : 7,
		'Q' : 8,
		'R' : 9,
		'j' : -1,
		'k' : -2,
		'l' : -3,
		'm' : -4,
		'n' : -5,
		'o' : -6,
		'p' : -7,
		'q' : -8,
		'r' : -9
	}, DUP_HASH = {
		'S' : 1,
		'T' : 2,
		'U' : 3,
		'V' : 4,
		'W' : 5,
		'X' : 6,
		'Y' : 7,
		'Z' : 8,
		's' : 9
	};

	io.JCAMPInterpreter = function() {
	};
	let _ = io.JCAMPInterpreter.prototype = new io._Interpreter();
	_.convertHZ2PPM = false;
	_.read = function(content) {
		this.isBreak = function(c) {
			// some of these arrays may return zero, so check if undefined
			return SQZ_HASH[c] !== undefined || DIF_HASH[c] !== undefined || DUP_HASH[c] !== undefined || c === ' ' || c === '-' || c === '+';
		};
		this.getValue = function(decipher, lastDif) {
			let first = decipher.charAt(0);
			let rest = decipher.substring(1);
			// some of these arrays may return zero, so check if undefined
			if (SQZ_HASH[first] !== undefined) {
				return parseFloat(SQZ_HASH[first] + rest);
			} else if (DIF_HASH[first] !== undefined) {
				return parseFloat(DIF_HASH[first] + rest) + lastDif;
			}
			return parseFloat(rest);
		};
		let spectrum = new structures.Spectrum();
		if (content === undefined || content.length === 0) {
			return spectrum;
		}
		let lines = content.split('\n');
		let sb = [];
		let xLast, xFirst, yFirst, nPoints, xFactor = 1, yFactor = 1, observeFrequency = 1, deltaX = -1, shiftOffsetNum = -1, shiftOffsetVal = -1;
		let recordMeta = true, divideByFrequency = false;
		for ( let i = 0, ii = lines.length; i < ii; i++) {
			let use = lines[i].trim();
			let index = use.indexOf('$$');
			if (index !== -1) {
				use = use.substring(0, index);
			}
			if (sb.length === 0 || !lines[i].startsWith('##')) {
				let trimmed = use.trim();
				if (sb.length !== 0 && trimmed.length!==0) {
					sb.push('\n');
				}
				sb.push(trimmed);
			} else {
				let currentRecord = sb.join('');
				if (recordMeta && currentRecord.length < 100) {
					spectrum.metadata.push(currentRecord);
				}
				sb = [ use ];
				if (currentRecord.startsWith('##TITLE=')) {
					spectrum.title = currentRecord.substring(8).trim();
				} else if (currentRecord.startsWith('##XUNITS=')) {
					spectrum.xUnit = currentRecord.substring(9).trim();
					if (this.convertHZ2PPM && spectrum.xUnit.toUpperCase() === 'HZ') {
						spectrum.xUnit = 'PPM';
						divideByFrequency = true;
					}
				} else if (currentRecord.startsWith('##YUNITS=')) {
					spectrum.yUnit = currentRecord.substring(9).trim();
				} else if (currentRecord.startsWith('##XYPAIRS=')) {
					// spectrum.yUnit = currentRecord.substring(9).trim();
				} else if (currentRecord.startsWith('##FIRSTX=')) {
					xFirst = parseFloat(currentRecord.substring(9).trim());
				} else if (currentRecord.startsWith('##LASTX=')) {
					xLast = parseFloat(currentRecord.substring(8).trim());
				} else if (currentRecord.startsWith('##FIRSTY=')) {
					yFirst = parseFloat(currentRecord.substring(9).trim());
				} else if (currentRecord.startsWith('##NPOINTS=')) {
					nPoints = parseFloat(currentRecord.substring(10).trim());
				} else if (currentRecord.startsWith('##XFACTOR=')) {
					xFactor = parseFloat(currentRecord.substring(10).trim());
				} else if (currentRecord.startsWith('##YFACTOR=')) {
					yFactor = parseFloat(currentRecord.substring(10).trim());
				} else if (currentRecord.startsWith('##DELTAX=')) {
					deltaX = parseFloat(currentRecord.substring(9).trim());
				} else if (currentRecord.startsWith('##.OBSERVE FREQUENCY=')) {
					if (this.convertHZ2PPM) {
						observeFrequency = parseFloat(currentRecord.substring(21).trim());
					}
				} else if (currentRecord.startsWith('##.SHIFT REFERENCE=')) {
					if (this.convertHZ2PPM) {
						let parts = currentRecord.substring(19).split(',');
						shiftOffsetNum = parseInt(parts[2].trim());
						shiftOffsetVal = parseFloat(parts[3].trim());
					}
				} else if (currentRecord.startsWith('##XYDATA=')) {
					if (!divideByFrequency) {
						observeFrequency = 1;
					}
					recordMeta = false;
					let lastWasDif = false;
					let innerLines = currentRecord.split('\n');
					let abscissaSpacing = (xLast - xFirst) / (nPoints - 1);
					let lastX = xFirst - abscissaSpacing;
					let lastY = yFirst;
					let lastDif = 0;
					let lastOrdinate;
					for ( let j = 1, jj = innerLines.length; j < jj; j++) {
						let data = [];
						let read = innerLines[j].trim();
						let sb = [];
						for ( let k = 0, kk = read.length; k < kk; k++) {
							if (this.isBreak(read.charAt(k))) {
								if (sb.length > 0 && !(sb.length === 1 && sb[0] === ' ')) {
									data.push(sb.join(''));
								}
								sb = [ read.charAt(k) ];
							} else {
								sb.push(read.charAt(k));
							}
						}
						data.push(sb.join(''));
						lastX = parseFloat(data[0]) * xFactor - abscissaSpacing;
						for ( let k = 1, kk = data.length; k < kk; k++) {
							let decipher = data[k];
							// some of these arrays may return zero, so
							// check if undefined
							if (DUP_HASH[decipher.charAt(0)] !== undefined) {
								// be careful when reading this, to keep
								// spectra efficient, DUPS are actually
								// discarded, except the last y!
								let dup = parseInt(DUP_HASH[decipher.charAt(0)] + decipher.substring(1)) - 1;
								for ( let l = 0; l < dup; l++) {
									lastX += abscissaSpacing;
									lastDif = this.getValue(lastOrdinate, lastDif);
									lastY = lastDif * yFactor;
									spectrum.data[spectrum.data.length - 1] = new structures.Point(lastX / observeFrequency, lastY);
								}
							} else {
								// some of these arrays may return zero, so
								// check if undefined
								if (!(SQZ_HASH[decipher.charAt(0)] !== undefined && lastWasDif)) {
									lastWasDif = DIF_HASH[decipher.charAt(0)] !== undefined;
									lastOrdinate = decipher;
									lastX += abscissaSpacing;
									lastDif = this.getValue(decipher, lastDif);
									lastY = lastDif * yFactor;
									spectrum.data.push(new structures.Point(lastX / observeFrequency, lastY));
								} else {
									lastY = this.getValue(decipher, lastDif) * yFactor;
								}
							}
						}
					}
					if (shiftOffsetNum !== -1) {
						let dif = shiftOffsetVal - spectrum.data[shiftOffsetNum - 1].x;
						for ( let i = 0, ii = spectrum.data.length; i < ii; i++) {
							spectrum.data[i].x += dif;
						}
					}
				} else if (currentRecord.startsWith('##PEAK TABLE=')) {
					recordMeta = false;
					spectrum.continuous = false;
					let innerLines = currentRecord.split('\n');
					let reg = /[\s,]+/;
					for ( let j = 1, jj = innerLines.length; j < jj; j++) {
						let items = innerLines[j].split(reg);
						for ( let k = 0, kk = items.length; k + 1 < kk; k += 2) {
							spectrum.data.push(new structures.Point(parseFloat(items[k].trim()), parseFloat(items[k + 1].trim())));
						}
					}
				} else if (currentRecord.startsWith('##ATOMLIST=')) {
					spectrum.molecule = new structures.Molecule();
					let innerLines = currentRecord.split('\n');
					let reg = /[\s]+/;
					for ( let j = 1, jj = innerLines.length; j < jj; j++) {
						let items = innerLines[j].split(reg);
						spectrum.molecule.atoms.push(new structures.Atom(items[1]));
					}
				} else if (currentRecord.startsWith('##BONDLIST=')) {
					let innerLines = currentRecord.split('\n');
					let reg = /[\s]+/;
					for ( let j = 1, jj = innerLines.length; j < jj; j++) {
						let items = innerLines[j].split(reg);
						let order = 1;
						if(items[2]==='D'){
							order = 2;
						}else if(items[2]==='T'){
							order = 3;
						}
						spectrum.molecule.bonds.push(new structures.Bond(spectrum.molecule.atoms[parseInt(items[0])-1], spectrum.molecule.atoms[parseInt(items[1])-1], order));
					}
				} else if (spectrum.molecule && currentRecord.startsWith('##XY_RASTER=')) {
					let innerLines = currentRecord.split('\n');
					let reg = /[\s]+/;
					for ( let j = 1, jj = innerLines.length; j < jj; j++) {
						let items = innerLines[j].split(reg);
						let a = spectrum.molecule.atoms[parseInt(items[0])-1];
						a.x = parseInt(items[1]);
						a.y = parseInt(items[2]);
						if(items.length==4){
							a.z = parseInt(items[3]);
						}
					}
					spectrum.molecule.scaleToAverageBondLength(20);
				} else if (currentRecord.startsWith('##PEAK ASSIGNMENTS=')) {
					let innerLines = currentRecord.split('\n');
					let reg = /[\s,()<>]+/;
					spectrum.assignments = [];
					for ( let j = 1, jj = innerLines.length; j < jj; j++) {
						let items = innerLines[j].split(reg);
						let x = parseFloat(items[1]);
						let y = parseFloat(items[2]);
						let a = spectrum.molecule.atoms[parseInt(items[3])-1];
						let used = false;
						for(let k = 0, kk = spectrum.assignments.length; k<kk; k++){
							let assign = spectrum.assignments[k];
							if(assign.x === x){
								assign.as.push(a);
								a.assigned = assign;
								used = true;
								break;
							}
						}
						if(!used){
							let assign = {x:x, y:y, as:[a]};
							a.assigned = assign;
							spectrum.assignments.push(assign);
						}
					}
				}
			}
		}
		spectrum.setup();
		return spectrum;
	};
	_.makeStructureSpectrumSet = function(id, content) {
		this.convertHZ2PPM = true;
		let spectrum = this.read(content);
		let mcanvas = new c.ViewerCanvas(id+'_molecule', 200,200);
		mcanvas.styles.atoms_displayTerminalCarbonLabels_2D = true;
		mcanvas.styles.atoms_displayImplicitHydrogens_2D = true;
		mcanvas.mouseout = function(e){
			if(this.molecules.length!==0){
				for(let i = 0, ii = this.molecules[0].atoms.length; i<ii; i++){
					this.molecules[0].atoms[i].isHover = false;
				}
				spectrum.hovered = undefined;
				this.repaint();
				scanvas.repaint();
			}
		};
		mcanvas.touchend = mcanvas.mouseout;
		mcanvas.mousemove = function(e){
			if(this.molecules.length!==0){
				let closest=undefined;
				for(let i = 0, ii = this.molecules[0].atoms.length; i<ii; i++){
					let a = this.molecules[0].atoms[i];
					a.isHover = false;
					if(a.assigned && (closest===undefined || e.p.distance(a)<e.p.distance(closest))){
						closest = a;
					}
				}
				spectrum.hovered = undefined;
				if(e.p.distance(closest)<20){
					for(let i = 0, ii = closest.assigned.as.length; i<ii; i++){
						closest.assigned.as[i].isHover = true;
					}
					scanvas.spectrum.hovered = closest.assigned;
				}
				this.repaint();
				scanvas.repaint();
			}
		};
		mcanvas.touchmove = mcanvas.mousemove;
		mcanvas.drawChildExtras = function(ctx, styles){
			if(this.molecules.length!==0){
				for(let i = 0, ii = this.molecules[0].atoms.length; i<ii; i++){
					this.molecules[0].atoms[i].drawDecorations(ctx, styles);
				}
			}
		};
		let scanvas = new c.ObserverCanvas(id+'_spectrum', 400,200);
		scanvas.styles.plots_showYAxis = false;
		scanvas.styles.plots_flipXAxis = true;
		scanvas.mouseout = function(e){
			if(this.spectrum && this.spectrum.assignments){
				for(let i = 0, ii = mcanvas.molecules[0].atoms.length; i<ii; i++){
					mcanvas.molecules[0].atoms[i].isHover = false;
				}
				this.spectrum.hovered = undefined;
				mcanvas.repaint();
				this.repaint();
			}
		};
		scanvas.touchend = scanvas.mouseout;
		scanvas.mousemove = function(e){
			if(this.spectrum && this.spectrum.assignments){
				let closest=undefined;
				for(let i = 0, ii = mcanvas.molecules[0].atoms.length; i<ii; i++){
					mcanvas.molecules[0].atoms[i].isHover = false;
				}
				this.spectrum.hovered = undefined;
				for(let i = 0, ii = this.spectrum.assignments.length; i<ii; i++){
					let a = this.spectrum.assignments[i];
					if(closest===undefined || Math.abs(this.spectrum.getTransformedX(a.x, this.styles, this.spectrum.memory.width, this.spectrum.memory.offsetLeft)-e.p.x)<Math.abs(this.spectrum.getTransformedX(closest.x, this.styles, this.spectrum.memory.width, this.spectrum.memory.offsetLeft)-e.p.x)){
						closest = a;
					}
				}
				if(Math.abs(this.spectrum.getTransformedX(closest.x, this.styles, this.spectrum.memory.width, this.spectrum.memory.offsetLeft)-e.p.x)<20){
					for(let i = 0, ii = closest.as.length; i<ii; i++){
						closest.as[i].isHover = true;
					}
					this.spectrum.hovered = closest;
				}
				mcanvas.repaint();
				this.repaint();
			}
		};
		scanvas.touchmove = scanvas.mousemove;
		scanvas.drawChildExtras = function(ctx){
			if(this.spectrum && this.spectrum.hovered){
				let x = this.spectrum.getTransformedX(this.spectrum.hovered.x, scanvas.styles, this.spectrum.memory.width, this.spectrum.memory.offsetLeft);
				if (x >= this.spectrum.memory.offsetLeft && x < this.spectrum.memory.width) {
					ctx.save();
					ctx.strokeStyle='#885110';
					ctx.lineWidth = 3;
					ctx.beginPath();
					ctx.moveTo(x, this.spectrum.memory.height - this.spectrum.memory.offsetBottom);
					ctx.lineTo(x, this.spectrum.getTransformedY(this.spectrum.hovered.y, scanvas.styles, this.spectrum.memory.height, this.spectrum.memory.offsetBottom, this.spectrum.memory.offsetTop));
					ctx.stroke();
					ctx.restore();
				}
			}
		};
		if(spectrum){
			scanvas.loadSpectrum(spectrum);
			if(spectrum.molecule){
				mcanvas.loadMolecule(spectrum.molecule);
			}
		}
		return [mcanvas, scanvas];
	};

	// shortcuts
	let interpreter = new io.JCAMPInterpreter();
	interpreter.convertHZ2PPM = true;
	c.readJCAMP = function(content) {
		return interpreter.read(content);
	};
})(ChemDoodle, ChemDoodle.io, ChemDoodle.structures);
(function(c, io, structures, d2, d3, JSON, undefined) {
	'use strict';
	io.JSONInterpreter = function() {
	};
	let _ = io.JSONInterpreter.prototype;
	_.contentTo = function(mols, shapes) {
		if(!mols){mols = [];}
		if(!shapes){shapes = [];}
		let usePIDs = true;
		for ( let i = 0, ii = mols.length; i < ii; i++) {
			let mol = mols[i];
			for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
				if(mol.atoms[j].pid===undefined){
					usePIDs = false;
					break;
				}
			}
			if(usePIDs){
				for ( let j = 0, jj = mol.bonds.length; j < jj; j++) {
					if(mol.bonds[j].pid===undefined){
						usePIDs = false;
						break;
					}
				}
			}
		}
		let count1 = 0, count2 = 0, count3 = 0;
		for ( let i = 0, ii = mols.length; i < ii; i++) {
			let mol = mols[i];
			let mpid = undefined;
			for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
				let aj = mol.atoms[j];
				if(usePIDs){
					aj.tmpid = 'a' + aj.pid;
					if(mpid===undefined || mpid>aj.pid){
						// pick the lowest atom pid for the molecule
						mpid = aj.pid;
					}
				}else{
					aj.tmpid = 'a' + count1++;
				}
			}
			for ( let j = 0, jj = mol.bonds.length; j < jj; j++) {
				let bj = mol.bonds[j];
				if(usePIDs){
					bj.tmpid = 'b' + bj.pid;
				}else{
					bj.tmpid = 'b' + count2++;
				}
			}
			mol.tmpid = 'm' + (mpid===undefined?count3++:mpid);
		}
		count1 = 0;
		for ( let i = 0, ii = shapes.length; i < ii; i++) {
			shapes[i].tmpid = 's' + count1++;
		}
		let dummy = {};
		if (mols && mols.length > 0) {
			dummy.m = [];
			for ( let i = 0, ii = mols.length; i < ii; i++) {
				dummy.m.push(this.molTo(mols[i]));
			}
		}
		if (shapes && shapes.length > 0) {
			dummy.s = [];
			for ( let i = 0, ii = shapes.length; i < ii; i++) {
				dummy.s.push(this.shapeTo(shapes[i]));
			}
		}
		for ( let i = 0, ii = mols.length; i < ii; i++) {
			let mol = mols[i];
			for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
				mol.atoms[j].tmpid = undefined;
			}
			for ( let j = 0, jj = mol.bonds.length; j < jj; j++) {
				mol.bonds[j].tmpid = undefined;
			}
			mol.tmpid = undefined;
		}
		for ( let i = 0, ii = shapes.length; i < ii; i++) {
			shapes[i].tmpid = undefined;
		}
		return dummy;
	};
	_.contentFrom = function(dummy) {
		let obj = {
			molecules : [],
			shapes : []
		};
		if (dummy.m) {
			for ( let i = 0, ii = dummy.m.length; i < ii; i++) {
				obj.molecules.push(this.molFrom(dummy.m[i]));
			}
		}
		if (dummy.s) {
			for ( let i = 0, ii = dummy.s.length; i < ii; i++) {
				obj.shapes.push(this.shapeFrom(dummy.s[i], obj.molecules));
			}
		}
		for ( let i = 0, ii = obj.molecules.length; i < ii; i++) {
			let mol = obj.molecules[i];
			for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
				mol.atoms[j].tmpid = undefined;
			}
			for ( let j = 0, jj = mol.bonds.length; j < jj; j++) {
				mol.bonds[j].tmpid = undefined;
			}
		}
		for ( let i = 0, ii = obj.shapes.length; i < ii; i++) {
			obj.shapes[i].tmpid = undefined;
		}
		return obj;
	};
	_.queryTo = function(query) {
		let q = {};
		let appendProperty = function(q, p, name, isRange){
			if(p){
				q[name] = {v:isRange?query.outputRange(p.v):p.v, n:p.not};
			}
		};
		if(query.type===structures.Query.TYPE_ATOM){
			appendProperty(q, query.elements, 'as');
			appendProperty(q, query.chirality, '@');
			appendProperty(q, query.aromatic, 'A');
			appendProperty(q, query.charge, 'C', true);
			appendProperty(q, query.hydrogens, 'H', true);
			appendProperty(q, query.ringCount, 'R', true);
			appendProperty(q, query.saturation, 'S');
			appendProperty(q, query.connectivity, 'X', true);
			appendProperty(q, query.connectivityNoH, 'x', true);
		}else{
			appendProperty(q, query.orders, 'bs');
			appendProperty(q, query.stereo, '@');
			appendProperty(q, query.aromatic, 'A');
			appendProperty(q, query.ringCount, 'R', true);
		}
		return q;
	};
	_.molTo = function(mol) {
		let dummy = {
			a : []
		};
		if (mol.tmpid) {
			dummy.i = mol.tmpid;
		}
		for ( let i = 0, ii = mol.atoms.length; i < ii; i++) {
			let a = mol.atoms[i];
			let da = {
				x : a.x,
				y : a.y
			};
			if (a.tmpid) {
				da.i = a.tmpid;
			}
			if (a.label !== 'C') {
				da.l = a.label;
			}
			if (a.z !== 0) {
				da.z = a.z;
			}
			if (a.charge !== 0) {
				da.c = a.charge;
			}
			if (a.mass !== -1) {
				da.m = a.mass;
			}
			if (a.implicitH !== -1) {
				da.h = a.implicitH;
			}
			if (a.numRadical !== 0) {
				da.r = a.numRadical;
			}
			if (a.numLonePair !== 0) {
				da.p = a.numLonePair;
			}
			if (a.enhancedStereo && a.enhancedStereo.type!==structures.Atom.ESTEREO_ABSOLUTE) {
				da.s2 = {t:a.enhancedStereo.type};
				if(a.enhancedStereo.group>1){
					da.s2.g = a.enhancedStereo.group;
				}
			}
			if (a.query) {
				da.q = this.queryTo(a.query);
			}
			dummy.a.push(da);
		}
		if (mol.bonds.length > 0) {
			dummy.b = [];
			for ( let i = 0, ii = mol.bonds.length; i < ii; i++) {
				let b = mol.bonds[i];
				let db = {
					b : mol.atoms.indexOf(b.a1),
					e : mol.atoms.indexOf(b.a2)
				};
				if (b.tmpid) {
					db.i = b.tmpid;
				}
				if (b.bondOrder !== 1) {
					db.o = b.bondOrder;
				}
				if (b.stereo !== structures.Bond.STEREO_NONE) {
					db.s = b.stereo;
				}
				if (b.query) {
					db.q = this.queryTo(b.query);
				}
				dummy.b.push(db);
			}
		}
		return dummy;
	};
	_.queryFrom = function(json) {
		let query = new structures.Query(json.as?structures.Query.TYPE_ATOM:structures.Query.TYPE_BOND);
		let setupProperty = function(query, json, name, isRange){
			if(json){
				query[name] = {};
				query[name].v = isRange?query.parseRange(json.v):json.v;
				if(json.n){
					query[name].not = true;
				}
			}
		};
		if(query.type===structures.Query.TYPE_ATOM){
			setupProperty(query, json.as, 'elements');
			setupProperty(query, json['@'], 'chirality');
			setupProperty(query, json.A, 'aromatic');
			setupProperty(query, json.C, 'charge', true);
			setupProperty(query, json.H, 'hydrogens', true);
			setupProperty(query, json.R, 'ringCount', true);
			setupProperty(query, json.S, 'saturation');
			setupProperty(query, json.X, 'connectivity', true);
			setupProperty(query, json.x, 'connectivityNoH', true);
		}else{
			setupProperty(query, json.bs, 'orders');
			setupProperty(query, json['@'], 'stereo');
			setupProperty(query, json.A, 'aromatic');
			setupProperty(query, json.R, 'ringCount', true);
		}
		return query;
	};
	_.molFrom = function(json) {
		let molecule = new structures.Molecule();
		for ( let i = 0, ii = json.a.length; i < ii; i++) {
			let c = json.a[i];
			let a = new structures.Atom(c.l ? c.l : 'C', c.x, c.y);
			if (c.i) {
				a.tmpid = c.i;
			}
			if (c.z) {
				a.z = c.z;
			}
			if (c.c) {
				a.charge = c.c;
			}
			if (c.m) {
				a.mass = c.m;
			}
			if (c.h) {
				a.implicitH = c.h;
			}
			if (c.r) {
				a.numRadical = c.r;
			}
			if (c.p) {
				a.numLonePair = c.p;
			}
			if(c.s2){
				a.enhancedStereo = {
					type: c.s2.t,
					group: c.s2.g===undefined?1:c.s2.g
				};
			}
			if(c.q){
				a.query = this.queryFrom(c.q);
			}
			// these are booleans or numbers, so check if undefined
			if (c.p_h !== undefined) {
				a.hetatm = c.p_h;
			}
			if (c.p_w !== undefined) {
				a.isWater = c.p_w;
			}
			if (c.p_d !== undefined) {
				a.closestDistance = c.p_d;
			}
			molecule.atoms.push(a);
		}
		if (json.b) {
			for ( let i = 0, ii = json.b.length; i < ii; i++) {
				let c = json.b[i];
				// order can be 0, so check against undefined
				let b = new structures.Bond(molecule.atoms[c.b], molecule.atoms[c.e], c.o === undefined ? 1 : c.o);
				if (c.i) {
					b.tmpid = c.i;
				}
				if (c.s) {
					b.stereo = c.s;
				}
				if(c.q){
					b.query = this.queryFrom(c.q);
				}
				molecule.bonds.push(b);
			}
		}
		return molecule;
	};
	_.shapeTo = function(shape) {
		let dummy = {};
		if (shape.tmpid) {
			dummy.i = shape.tmpid;
		}
		if (shape instanceof d2.Line) {
			dummy.t = 'Line';
			dummy.x1 = shape.p1.x;
			dummy.y1 = shape.p1.y;
			dummy.x2 = shape.p2.x;
			dummy.y2 = shape.p2.y;
			dummy.a = shape.arrowType;
			if(shape.reactants !== undefined && shape.reactants.length>0){
				dummy.rs = [];
				for(let i = 0, ii = shape.reactants.length; i<ii; i++){
					dummy.rs[i] = shape.reactants[i].tmpid;
				}
			}
			if(shape.products !== undefined && shape.products.length>0){
				dummy.ps = [];
				for(let i = 0, ii = shape.products.length; i<ii; i++){
					dummy.ps[i] = shape.products[i].tmpid;
				}
			}
		} else if (shape instanceof d2.Pusher) {
			dummy.t = 'Pusher';
			dummy.o1 = shape.o1.tmpid;
			dummy.o2 = shape.o2.tmpid;
			if (shape.numElectron !== 1) {
				dummy.e = shape.numElectron;
			}
		} else if (shape instanceof d2.AtomMapping) {
			dummy.t = 'AtomMapping';
			dummy.a1 = shape.o1.tmpid;
			dummy.a2 = shape.o2.tmpid;
			dummy.n = shape.label;
		} else if (shape instanceof d2.Bracket) {
			dummy.t = 'Bracket';
			dummy.x1 = shape.p1.x;
			dummy.y1 = shape.p1.y;
			dummy.x2 = shape.p2.x;
			dummy.y2 = shape.p2.y;
			if (shape.charge !== 0) {
				dummy.c = shape.charge;
			}
			if (shape.mult !== 0) {
				dummy.m = shape.mult;
			}
			if (shape.repeat !== 0) {
				dummy.r = shape.repeat;
			}
		} else if (shape instanceof d2.RepeatUnit) {
			dummy.t = 'RepeatUnit';
			dummy.b1 = shape.b1.tmpid;
			dummy.b2 = shape.b2.tmpid;
			dummy.n1 = shape.n1;
			dummy.n2 = shape.n2;
			if(shape.flip===true){
				dummy.f = true;
			}
		} else if (shape instanceof d2.VAP) {
			dummy.t = 'VAP';
			dummy.x = shape.asterisk.x;
			dummy.y = shape.asterisk.y;
			if(shape.bondType!==1){
				dummy.o = shape.bondType;
			}
			if(shape.substituent){
				dummy.s = shape.substituent.tmpid;
			}
			dummy.a = [];
			for(let i = 0, ii=shape.attachments.length; i<ii; i++){
				dummy.a.push(shape.attachments[i].tmpid);
			}
		} else if (shape instanceof d3.Distance) {
			dummy.t = 'Distance';
			dummy.a1 = shape.a1.tmpid;
			dummy.a2 = shape.a2.tmpid;
			if (shape.node) {
				dummy.n = shape.node;
				dummy.o = shape.offset;
			}
		} else if (shape instanceof d3.Angle) {
			dummy.t = 'Angle';
			dummy.a1 = shape.a1.tmpid;
			dummy.a2 = shape.a2.tmpid;
			dummy.a3 = shape.a3.tmpid;
		} else if (shape instanceof d3.Torsion) {
			dummy.t = 'Torsion';
			dummy.a1 = shape.a1.tmpid;
			dummy.a2 = shape.a2.tmpid;
			dummy.a3 = shape.a3.tmpid;
			dummy.a4 = shape.a4.tmpid;
		} else if (shape instanceof d3._Surface) {
			dummy.t = 'Surface';
			dummy.a = [];
			for(let i = 0, ii=shape.atoms.length; i<ii; i++){
				dummy.a.push(shape.atoms[i].tmpid);
			}
			if(!(shape instanceof d3.VDWSurface)){
				dummy.p = shape.probeRadius;
			}
			dummy.r = shape.resolution;
			let type = 'vdw';
			if(shape instanceof d3.SASSurface){
				type = 'sas';
			}else if(d3.SESSurface && shape instanceof d3.SESSurface){
				type = 'ses';
			}
			dummy.f = type;
		} else if (shape instanceof d3.UnitCell) {
			dummy.t = 'UnitCell';
			dummy.ls = shape.lengths;
			dummy.as = shape.angles;
			dummy.os = shape.offset;
		}
		return dummy;
	};
	_.shapeFrom = function(dummy, mols) {
		let shape;
		if (dummy.t === 'Line') {
			shape = new d2.Line(new structures.Point(dummy.x1, dummy.y1), new structures.Point(dummy.x2, dummy.y2));
			shape.arrowType = dummy.a;
			if(dummy.rs !== undefined){
				shape.reactants = [];
				for(let i = 0, ii = dummy.rs.length; i<ii; i++){
					let check = dummy.rs[i];
					search: for ( let k = 0, kk = mols.length; k < kk; k++) {
						let mol = mols[k];
						for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
							let a = mol.atoms[j];
							if (a.tmpid === check) {
								shape.reactants.push(a);
								break search;
							}
						}
					}
				}
			}
			if(dummy.ps !== undefined){
				shape.products = [];
				for(let i = 0, ii = dummy.ps.length; i<ii; i++){
					let check = dummy.ps[i];
					search: for ( let k = 0, kk = mols.length; k < kk; k++) {
						let mol = mols[k];
						for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
							let a = mol.atoms[j];
							if (a.tmpid === check) {
								shape.products.push(a);
								break search;
							}
						}
					}
				}
			}
		} else if (dummy.t === 'Pusher') {
			let o1, o2;
			for ( let i = 0, ii = mols.length; i < ii; i++) {
				let mol = mols[i];
				for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
					let a = mol.atoms[j];
					if (a.tmpid === dummy.o1) {
						o1 = a;
					} else if (a.tmpid === dummy.o2) {
						o2 = a;
					}
				}
				for ( let j = 0, jj = mol.bonds.length; j < jj; j++) {
					let b = mol.bonds[j];
					if (b.tmpid === dummy.o1) {
						o1 = b;
					} else if (b.tmpid === dummy.o2) {
						o2 = b;
					}
				}
			}
			shape = new d2.Pusher(o1, o2);
			if (dummy.e) {
				shape.numElectron = dummy.e;
			}
		} else if (dummy.t === 'AtomMapping') {
			let a1, a2;
			for ( let i = 0, ii = mols.length; i < ii; i++) {
				let mol = mols[i];
				for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
					let a = mol.atoms[j];
					if (a.tmpid === dummy.a1) {
						a1 = a;
					} else if (a.tmpid === dummy.a2) {
						a2 = a;
					}
				}
			}
			shape = new d2.AtomMapping(a1, a2);
			if(dummy.n !== undefined){
				shape.label = dummy.n;
			}
		} else if (dummy.t === 'Bracket') {
			shape = new d2.Bracket(new structures.Point(dummy.x1, dummy.y1), new structures.Point(dummy.x2, dummy.y2));
			if (dummy.c !== undefined) {
				// have to check against undefined as it is an integer that can be 0
				shape.charge = dummy.c;
			}
			if (dummy.m !== undefined) {
				// have to check against undefined as it is an integer that can be 0
				shape.mult = dummy.m;
			}
			if (dummy.r !== undefined) {
				// have to check against undefined as it is an integer that can be 0
				shape.repeat = dummy.r;
			}
		} else if (dummy.t === 'RepeatUnit' || dummy.t === 'DynamicBracket') {
			// this used to be called "DynamicBracket" but was changed to "RepeatUnit" once expansion support was added
			let b1, b2;
			for ( let i = 0, ii = mols.length; i < ii; i++) {
				let mol = mols[i];
				for ( let j = 0, jj = mol.bonds.length; j < jj; j++) {
					let b = mol.bonds[j];
					if (b.tmpid === dummy.b1) {
						b1 = b;
					} else if (b.tmpid === dummy.b2) {
						b2 = b;
					}
				}
			}
			shape = new d2.RepeatUnit(b1, b2);
			shape.n1 = dummy.n1;
			shape.n2 = dummy.n2;
			if(dummy.f){
				shape.flip = true;
			}
		} else if (dummy.t === 'VAP') {
			shape = new d2.VAP(dummy.x, dummy.y);
			if(dummy.o){
				shape.bondType = dummy.o;
			}
			for ( let i = 0, ii = mols.length; i < ii; i++) {
				let mol = mols[i];
				for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
					let a = mol.atoms[j];
					if (a.tmpid === dummy.s) {
						shape.substituent = a;
					} else {
						for(let k = 0, kk = dummy.a.length; k<kk; k++){
							if(a.tmpid === dummy.a[k]){
								shape.attachments.push(a);
							}
						}
					}
				}
			}
		} else if (dummy.t === 'Distance') {
			let a1, a2;
			for ( let i = 0, ii = mols.length; i < ii; i++) {
				let mol = mols[i];
				for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
					let a = mol.atoms[j];
					if (a.tmpid === dummy.a1) {
						a1 = a;
					} else if (a.tmpid === dummy.a2) {
						a2 = a;
					}
				}
			}
			shape = new d3.Distance(a1, a2, dummy.n, dummy.o);
		} else if (dummy.t === 'Angle') {
			let a1, a2, a3;
			for ( let i = 0, ii = mols.length; i < ii; i++) {
				let mol = mols[i];
				for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
					let a = mol.atoms[j];
					if (a.tmpid === dummy.a1) {
						a1 = a;
					} else if (a.tmpid === dummy.a2) {
						a2 = a;
					} else if (a.tmpid === dummy.a3) {
						a3 = a;
					}
				}
			}
			shape = new d3.Angle(a1, a2, a3);
		} else if (dummy.t === 'Torsion') {
			let a1, a2, a3, a4;
			for ( let i = 0, ii = mols.length; i < ii; i++) {
				let mol = mols[i];
				for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
					let a = mol.atoms[j];
					if (a.tmpid === dummy.a1) {
						a1 = a;
					} else if (a.tmpid === dummy.a2) {
						a2 = a;
					} else if (a.tmpid === dummy.a3) {
						a3 = a;
					} else if (a.tmpid === dummy.a4) {
						a4 = a;
					}
				}
			}
			shape = new d3.Torsion(a1, a2, a3, a4);
		} else if (dummy.t === 'Surface') {
			let atoms = [];
			for ( let i = 0, ii = mols.length; i < ii; i++) {
				let mol = mols[i];
				for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
					let a = mol.atoms[j];
					for(let k = 0, kk = dummy.a.length; k<kk; k++){
						if(a.tmpid === dummy.a[k]){
							atoms.push(a);
						}
					}
				}
			}
			let probeRadius = dummy.p?dummy.p:1.4;
			let resolution = dummy.r?dummy.r:30;
			if(dummy.f==='vdw'){
				shape = new d3.VDWSurface(atoms, resolution);
			}else if(dummy.f==='sas'){
				shape = new d3.SASSurface(atoms, probeRadius, resolution);
			}else if(dummy.f==='ses'){
				shape = new d3.SESSurface(atoms, probeRadius, resolution);
			}
		} else if (dummy.t === 'UnitCell') {
			shape = new d3.UnitCell(dummy.ls, dummy.as, dummy.os);
		}
		return shape;
	};
	_.pdbFrom = function(content) {
		let mol = this.molFrom(content.mol);
		mol.findRings = false;
		// mark from JSON to note to algorithms that atoms in chain are not
		// same
		// objects as in atom array
		mol.fromJSON = true;
		mol.chains = this.chainsFrom(content.ribbons);
		return mol;
	};
	_.chainsFrom = function(content) {
		let chains = [];
		for ( let i = 0, ii = content.cs.length; i < ii; i++) {
			let chain = content.cs[i];
			let c = [];
			for ( let j = 0, jj = chain.length; j < jj; j++) {
				let convert = chain[j];
				let r = new structures.Residue();
				r.name = convert.n;
				r.cp1 = new structures.Atom('', convert.x1, convert.y1, convert.z1);
				r.cp2 = new structures.Atom('', convert.x2, convert.y2, convert.z2);
				if (convert.x3) {
					r.cp3 = new structures.Atom('', convert.x3, convert.y3, convert.z3);
					r.cp4 = new structures.Atom('', convert.x4, convert.y4, convert.z4);
					r.cp5 = new structures.Atom('', convert.x5, convert.y5, convert.z5);
				}
				r.helix = convert.h;
				r.sheet = convert.s;
				r.arrow = j > 0 && chain[j - 1].a;
				c.push(r);
			}
			chains.push(c);
		}
		return chains;
	};

	// shortcuts
	let interpreter = new io.JSONInterpreter();
	c.readJSON = function(string) {
		let obj;
		try {
			obj = JSON.parse(string);
		} catch (e) {
			// not json
			return undefined;
		}
		if (obj) {
			if (obj.m || obj.s) {
				return interpreter.contentFrom(obj);
			} else if (obj.a) {
				return obj = {
					molecules : [ interpreter.molFrom(obj) ],
					shapes : []
				};
			} else {
				return obj = {
					molecules : [],
					shapes : []
				};
			}
		}
		return undefined;
	};
	c.writeJSON = function(mols, shapes) {
		return JSON.stringify(interpreter.contentTo(mols, shapes));
	};

})(ChemDoodle, ChemDoodle.io, ChemDoodle.structures, ChemDoodle.structures.d2, ChemDoodle.structures.d3, JSON);
(function(c, io, structures, undefined) {
	'use strict';
	io.RXNInterpreter = function() {
	};
	let _ = io.RXNInterpreter.prototype = new io._Interpreter();
	_.read = function(content, multiplier) {
		if (!multiplier) {
			multiplier = c.DEFAULT_STYLES.bondLength_2D;
		}
		let molecules = [];
		let line;
		if (!content) {
			molecules.push(new structures.Molecule());
			line = new structures.d2.Line(new structures.Point(-20, 0), new structures.Point(20, 0));
		} else {
			let contentTokens = content.split('$MOL\n');
			let headerTokens = contentTokens[0].split('\n');
			let counts = headerTokens[4];
			let numReactants = parseInt(counts.substring(0, 3));
			let numProducts = parseInt(counts.substring(3, 6));
			let currentMolecule = 1;
			let start = 0;
			for ( let i = 0, ii = numReactants + numProducts; i < ii; i++) {
				molecules[i] = c.readMOL(contentTokens[currentMolecule], multiplier);
				let b = molecules[i].getBounds();
				let width = b.maxX - b.minX;
				start -= width + 40;
				currentMolecule++;
			}
			for ( let i = 0, ii = numReactants; i < ii; i++) {
				let b = molecules[i].getBounds();
				let width = b.maxX - b.minX;
				let center = molecules[i].getCenter();
				for ( let j = 0, jj = molecules[i].atoms.length; j < jj; j++) {
					let a = molecules[i].atoms[j];
					a.x += start + (width / 2) - center.x;
					a.y -= center.y;
				}
				start += width + 40;
			}
			line = new structures.d2.Line(new structures.Point(start, 0), new structures.Point(start + 40, 0));
			start += 80;
			for ( let i = numReactants, ii = numReactants + numProducts; i < ii; i++) {
				let b = molecules[i].getBounds();
				let width = b.maxX - b.minX;
				let center = molecules[i].getCenter();
				for ( let j = 0; j < molecules[i].atoms.length; j++) {
					let a = molecules[i].atoms[j];
					a.x += start + (width / 2) - center.x;
					a.y -= center.y;
				}
				start += width + 40;
			}
		}
		line.arrowType = structures.d2.Line.ARROW_SYNTHETIC;
		return {
			'molecules' : molecules,
			'shapes' : [ line ]
		};
	};
	_.write = function(mols, shapes) {
		let arrow = undefined;
		if (!mols || !shapes) {
			return;
		}
		for (let i = 0, ii = shapes.length; i < ii; i++) {
			if (shapes[i] instanceof structures.d2.Line) {
				arrow = shapes[i];
				break;
			}
		}
		if (!arrow) {
			return '';
		}
		let reaction = new structures.Reaction().resolve(arrow, mols);
		let sb = [];
		sb.push('$RXN\nReaction from ChemDoodle Web Components\n\nhttp://www.ichemlabs.com\n');
		sb.push(this.fit(reaction.reactants.length.toString(), 3));
		sb.push(this.fit(reaction.products.length.toString(), 3));
		sb.push('\n');
		for ( let j = 0, jj = reaction.reactants.length; j < jj; j++) {
			sb.push('$MOL\n');
			sb.push(c.writeMOL(reaction.reactants[j]));
			sb.push('\n');
		}
		for ( let j = 0, jj = reaction.products.length; j < jj; j++) {
			sb.push('$MOL\n');
			sb.push(c.writeMOL(reaction.products[j]));
			sb.push('\n');
		}
		return sb.join('');
	};

	// shortcuts
	let interpreter = new io.RXNInterpreter();
	c.readRXN = function(content, multiplier) {
		return interpreter.read(content, multiplier);
	};
	c.writeRXN = function(mols, shapes) {
		return interpreter.write(mols, shapes);
	};

})(ChemDoodle, ChemDoodle.io, ChemDoodle.structures);

(function(c, ELEMENT, SYMBOLS, io, structures, undefined) {
	'use strict';
	io.XYZInterpreter = function() {
	};
	let _ = io.XYZInterpreter.prototype = new io._Interpreter();
	_.deduceCovalentBonds = true;
	_.read = function(content) {
		let molecule = new structures.Molecule();
		if (!content) {
			return molecule;
		}
		let lines = content.split('\n');

		let numAtoms = parseInt(lines[0].trim());

		for ( let i = 0; i < numAtoms; i++) {
			let line = lines[i + 2];
			let tokens = line.split(/\s+/g);
			molecule.atoms[i] = new structures.Atom(isNaN(tokens[0]) ? tokens[0] : SYMBOLS[parseInt(tokens[0]) - 1], parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
		}
		if (this.deduceCovalentBonds) {
			new c.informatics.BondDeducer().deduceCovalentBonds(molecule, 1);
		}
		return molecule;
	};

	// shortcuts
	let interpreter = new io.XYZInterpreter();
	c.readXYZ = function(content) {
		return interpreter.read(content);
	};

})(ChemDoodle, ChemDoodle.ELEMENT, ChemDoodle.SYMBOLS, ChemDoodle.io, ChemDoodle.structures);

ChemDoodle.monitor = (function(featureDetection, document, undefined) {
	'use strict';
	let m = {};

	m.CANVAS_DRAGGING = undefined;
	m.CANVAS_OVER = undefined;
	m.ALT = false;
	m.SHIFT = false;
	m.META = false;

	if (!featureDetection.supports_touch()) {
		document.addEventListener('DOMContentLoaded', function() {
			// handles dragging beyond the canvas bounds
			document.addEventListener('mousemove', function(e) {
				if (m.CANVAS_DRAGGING && m.CANVAS_DRAGGING.drag) {
					m.CANVAS_DRAGGING.prehandleEvent(e);
					m.CANVAS_DRAGGING.drag(e);
				}
			});
			document.addEventListener('mouseup', function(e) {
				if (m.CANVAS_DRAGGING && m.CANVAS_DRAGGING !== m.CANVAS_OVER && m.CANVAS_DRAGGING.mouseup) {
					m.CANVAS_DRAGGING.prehandleEvent(e);
					m.CANVAS_DRAGGING.mouseup(e);
				}
				m.CANVAS_DRAGGING = undefined;
			});
			// handles modifier keys from a single keyboard
			document.addEventListener('keydown', function(e) {
				m.SHIFT = e.shiftKey;
				m.ALT = e.altKey;
				m.META = e.metaKey || e.ctrlKey;
				let affecting = m.CANVAS_OVER;
				if (m.CANVAS_DRAGGING) {
					affecting = m.CANVAS_DRAGGING;
				}
				if (affecting && affecting.keydown) {
					affecting.prehandleEvent(e);
					affecting.keydown(e);
				}
			});
			document.addEventListener('keypress', function(e) {
				let affecting = m.CANVAS_OVER;
				if (m.CANVAS_DRAGGING) {
					affecting = m.CANVAS_DRAGGING;
				}
				if (affecting && affecting.keypress) {
					affecting.prehandleEvent(e);
					affecting.keypress(e);
				}
			});
			document.addEventListener('keyup', function(e) {
				m.SHIFT = e.shiftKey;
				m.ALT = e.altKey;
				m.META = e.metaKey || e.ctrlKey;
				let affecting = m.CANVAS_OVER;
				if (m.CANVAS_DRAGGING) {
					affecting = m.CANVAS_DRAGGING;
				}
				if (affecting && affecting.keyup) {
					affecting.prehandleEvent(e);
					affecting.keyup(e);
				}
			});
		});
	}

	return m;

})(ChemDoodle.featureDetection, document);

(function(c, featureDetection, math, monitor, structures, m, document, window, userAgent, undefined) {
	'use strict';
	c._Canvas = function() {
	};
	let _ = c._Canvas.prototype;
	_.molecules = undefined;
	_.shapes = undefined;
	_.emptyMessage = undefined;
	_.image = undefined;
	_.repaint = function() {
		if (this.test) {
			return;
		}
		let canvas = document.getElementById(this.id);
		if (canvas.getContext) {
			let ctx = canvas.getContext('2d');
			if (this.pixelRatio !== 1 && canvas.width === this.width) {
				canvas.width = this.width * this.pixelRatio;
				canvas.height = this.height * this.pixelRatio;
				ctx.scale(this.pixelRatio, this.pixelRatio);
			}
			if (!this.image) {
				// 'transparent' is a keyword for canvas background fills
				// we can't actually use undefined, as the default css will be black, so use 'transparent'
				let colorUse = this.styles.backgroundColor?this.styles.backgroundColor:'transparent';
				// we always have to clearRect() as a rgba color or any color with alpha may be used
				ctx.clearRect(0, 0, this.width, this.height);
				if(this.bgCache !== colorUse) {
					canvas.style.backgroundColor = colorUse;
					this.bgCache = canvas.style.backgroundColor;
				}
				// it is probably more efficient not to paint over only if it is not undefined/'transparent'
				// but we still need to always paint over to make sure there is a background in exported images
				// set background to undefined/'transparent' if no background is desired in output images
				if(colorUse!=='transparent'){
					ctx.fillStyle = colorUse;
					ctx.fillRect(0, 0, this.width, this.height);
				}
			} else {
				ctx.drawImage(this.image, 0, 0);
			}
			if (this.innerRepaint) {
				this.innerRepaint(ctx);
			} else {
				if (this.molecules.length !== 0 || this.shapes.length !== 0) {
					ctx.save();
					ctx.translate(this.width / 2, this.height / 2);
					ctx.rotate(this.styles.rotateAngle);
					ctx.scale(this.styles.scale, this.styles.scale);
					ctx.translate(-this.width / 2, -this.height / 2);
					for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
						this.molecules[i].check(true);
						this.molecules[i].draw(ctx, this.styles);
					}
					if(this.checksOnAction){
						// checksOnAction() must be called after checking molecules, as it depends on molecules being correct
						// this function is only used by the uis
						this.checksOnAction(true);
					}
					for ( let i = 0, ii = this.shapes.length; i < ii; i++) {
						this.shapes[i].draw(ctx, this.styles);
					}
					ctx.restore();
				} else if (this.emptyMessage) {
					ctx.fillStyle = '#737683';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.font = '18px Helvetica, Verdana, Arial, Sans-serif';
					ctx.fillText(this.emptyMessage, this.width / 2, this.height / 2);
				}
			}
			if (this.drawChildExtras) {
				this.drawChildExtras(ctx, this.styles);
			}
		}
	};
	_.resize = function(w, h) {
		let cap = q('#' + this.id);
		cap.attr({
			width : w,
			height : h
		});
		cap.css('width', w);
		cap.css('height', h);
		this.width = w;
		this.height = h;
		if (c._Canvas3D && this instanceof c._Canvas3D) {
			let wu = w;
			let hu = h;
			if (this.pixelRatio !== 1) {
				wu *= this.pixelRatio;
				hu *= this.pixelRatio;
				this.gl.canvas.width = wu;
				this.gl.canvas.height = hu;
			}
			this.gl.viewport(0, 0, wu, hu);
			this.afterLoadContent();
		} else if (this.molecules.length > 0) {
			this.center();
			for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
				this.molecules[i].check();
			}
		}
		this.repaint();
	};
	_.setBackgroundImage = function(path) {
		this.image = new Image(); // Create new Image object
		let me = this;
		this.image.onload = function() {
			me.repaint();
		};
		this.image.src = path; // Set source path
	};
	_.loadMolecule = function(molecule) {
		this.clear();
		this.molecules.push(molecule);
		// do this twice to center based on atom labels, which must be first rendered to be considered in bounds
		for(let i = 0; i<2; i++){
			this.center();
			if (!(c._Canvas3D && this instanceof c._Canvas3D)) {
				molecule.check();
			}
			if (this.afterLoadContent) {
				this.afterLoadContent();
			}
			this.repaint();
		}
	};
	_.loadContent = function(mols, shapes) {
		this.molecules = mols?mols:[];
		this.shapes = shapes?shapes:[];
		// do this twice to center based on atom labels, which must be first rendered to be considered in bounds
		for(let i = 0; i<2; i++){
			this.center();
			if (!(c._Canvas3D && this instanceof c._Canvas3D)) {
				for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
					this.molecules[i].check();
				}
			}
			if (this.afterLoadContent) {
				this.afterLoadContent();
			}
			this.repaint();
		}
	};
	_.addMolecule = function(molecule) {
		this.molecules.push(molecule);
		if (!(c._Canvas3D && this instanceof c._Canvas3D)) {
			molecule.check();
		}
		this.repaint();
	};
	_.removeMolecule = function(mol) {
		this.molecules = this.molecules.filter(function(value) {
			return value !== mol;
		});
		this.repaint();
	};
	_.getMolecule = function() {
		return this.molecules.length > 0 ? this.molecules[0] : undefined;
	};
	_.getMolecules = function() {
		return this.molecules;
	};
	_.addShape = function(shape) {
		this.shapes.push(shape);
		this.repaint();
	};
	_.removeShape = function(shape) {
		this.shapes = this.shapes.filter(function(value) {
			return value !== shape;
		});
		this.repaint();
	};
	_.getShapes = function() {
		return this.shapes;
	};
	_.clear = function() {
		this.molecules = [];
		this.shapes = [];
		this.styles.scale = 1;
		this.repaint();
	};
	_.center = function() {
		let bounds = this.getContentBounds();
		let center = new structures.Point((this.width - bounds.minX - bounds.maxX) / 2, (this.height - bounds.minY - bounds.maxY) / 2);
		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			let mol = this.molecules[i];
			for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
				mol.atoms[j].add(center);
			}
		}
		for ( let i = 0, ii = this.shapes.length; i < ii; i++) {
			let sps = this.shapes[i].getPoints();
			for ( let j = 0, jj = sps.length; j < jj; j++) {
				sps[j].add(center);
			}
		}
		this.styles.scale = 1;
		let difX = bounds.maxX - bounds.minX;
		let difY = bounds.maxY - bounds.minY;
		if (difX > this.width-20 || difY > this.height-20) {
			this.styles.scale = m.min(this.width / difX, this.height / difY) * .85;
		}
	};
	_.bondExists = function(a1, a2) {
		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			let mol = this.molecules[i];
			for ( let j = 0, jj = mol.bonds.length; j < jj; j++) {
				let b = mol.bonds[j];
				if (b.contains(a1) && b.contains(a2)) {
					return true;
				}
			}
		}
		return false;
	};
	_.getBond = function(a1, a2) {
		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			let mol = this.molecules[i];
			for ( let j = 0, jj = mol.bonds.length; j < jj; j++) {
				let b = mol.bonds[j];
				if (b.contains(a1) && b.contains(a2)) {
					return b;
				}
			}
		}
		return undefined;
	};
	_.getMoleculeByAtom = function(a) {
		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			let mol = this.molecules[i];
			if (mol.atoms.indexOf(a) !== -1) {
				return mol;
			}
		}
		// using window.undefined stops Google Closure compiler from breaking this function, I don't know why...
		// I definitely want to just use undefined, but for now...
		return window.undefined;
	};
	_.getAllAtoms = function() {
		let as = [];
		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			as = as.concat(this.molecules[i].atoms);
		}
		return as;
	};
	_.getAllBonds = function() {
		let bs = [];
		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			bs = bs.concat(this.molecules[i].bonds);
		}
		return bs;
	};
	_.getAllPoints = function() {
		let ps = [];
		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			ps = ps.concat(this.molecules[i].atoms);
		}
		for ( let i = 0, ii = this.shapes.length; i < ii; i++) {
			ps = ps.concat(this.shapes[i].getPoints());
		}
		return ps;
	};
	_.getContentBounds = function() {
		let bounds = new math.Bounds();
		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			bounds.expand(this.molecules[i].getBounds());
		}
		for ( let i = 0, ii = this.shapes.length; i < ii; i++) {
			bounds.expand(this.shapes[i].getBounds());
		}
		return bounds;
	};
	_.create = function(id, width, height) {
		this.id = id;
		this.width = width;
		this.height = height;
		this.molecules = [];
		this.shapes = [];
		if (document.getElementById(id)) {
			let canvas = document.getElementById(id);
			if (!width) {
				this.width = parseInt(canvas.getAttribute('width'));
			} else {
				canvas.setAttribute('width', width);
			}
			if (!height) {
				this.height = parseInt(canvas.getAttribute('height'));
			} else {
				canvas.setAttribute('height', height);
			}
			// If the canvas is pre-created, make sure that the class attribute is specified.
			canvas.setAttribute('class', 'ChemDoodleWebComponent');
		} else if (!c.featureDetection.supports_canvas_text() && userAgent.indexOf("MSIE") != -1) {
			// Install Google Chrome Frame
			document.writeln('<div style="border: 1px solid black;" width="' + width + '" height="' + height + '">Please install <a href="http://code.google.com/chrome/chromeframe/">Google Chrome Frame</a>, then restart Internet Explorer.</div>');
			return;
		} else {
			document.writeln('<canvas class="ChemDoodleWebComponent" id="' + id + '" width="' + width + '" height="' + height + '" alt="ChemDoodle Web Component">This browser does not support HTML5/Canvas.</canvas>');
		}
		let element = document.getElementById(id);
		element.style.width = this.width+'px';
		element.style.height = this.height+'px';
		this.pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
		this.styles = new structures.Styles();
		// setup input events
		// make sure prehandle events are only in if statements if handled, so
		// as not to block browser events
		let me = this;
		if (featureDetection.supports_touch()) {
			// for iPhone OS and Android devices (and other mobile browsers that support mobile events)
			element.addEventListener('touchstart', function(e) {
				let time = new Date().getTime();
				if (!featureDetection.supports_gesture() && e.touches.length === 2) {
					// on some platforms, like Android, there is no gesture support, so we have to implement it
					let ts = e.touches;
					let p1 = new structures.Point(ts[0].pageX, ts[0].pageY);
					let p2 = new structures.Point(ts[1].pageX, ts[1].pageY);
					me.implementedGestureDist = p1.distance(p2);
					me.implementedGestureAngle = p1.angle(p2);
					if (me.gesturestart) {
						me.prehandleEvent(e);
						me.gesturestart(e);
					}
				}
				if (me.lastTouch && e.touches.length === 1 && (time - me.lastTouch) < 500) {
					if (me.dbltap) {
						me.prehandleEvent(e);
						me.dbltap(e);
					} else if (me.dblclick) {
						me.prehandleEvent(e);
						me.dblclick(e);
					} else if (me.touchstart) {
						me.prehandleEvent(e);
						me.touchstart(e);
					} else if (me.mousedown) {
						me.prehandleEvent(e);
						me.mousedown(e);
					}
				} else if (me.touchstart) {
					me.prehandleEvent(e);
					me.touchstart(e);
					if (me.hold) {
						clearTimeout(me.hold);
					}
					if (me.touchhold) {
						me.hold = setTimeout(function() {
							me.touchhold(e);
						}, 1000);
					}
				} else if (me.mousedown) {
					me.prehandleEvent(e);
					me.mousedown(e);
				}
				me.lastTouch = time;
			});
			element.addEventListener('touchmove', function(e) {
				if (me.hold) {
					clearTimeout(me.hold);
					me.hold = undefined;
				}
				if (!featureDetection.supports_gesture() && e.touches.length === 2) {
					// on some platforms, like Android, there is no gesture support, so we have to implement it
					if (me.gesturechange) {
						let ts = e.touches;
						let p1 = new structures.Point(ts[0].pageX, ts[0].pageY);
						let p2 = new structures.Point(ts[1].pageX, ts[1].pageY);
						let newDist = p1.distance(p2);
						let newAngle = p1.angle(p2);
						e.scale = newDist / me.implementedGestureDist;
						e.rotation = 180 * (me.implementedGestureAngle - newAngle) / m.PI;
						me.prehandleEvent(e);
						me.gesturechange(e);
					}
				}
				if (e.touches.length > 1 && me.multitouchmove) {
					let numFingers = e.touches.length;
					me.prehandleEvent(e);
					let center = new structures.Point(-e.offset.left * numFingers, -e.offset.top * numFingers);
					for ( let i = 0; i < numFingers; i++) {
						center.x += e.touches[i].pageX;
						center.y += e.touches[i].pageY;
					}
					center.x /= numFingers;
					center.y /= numFingers;
					e.p = center;
					me.multitouchmove(e, numFingers);
				} else if (me.touchmove) {
					me.prehandleEvent(e);
					me.touchmove(e);
				} else if (me.drag) {
					me.prehandleEvent(e);
					me.drag(e);
				}
			});
			element.addEventListener('touchend', function(e) {
				if (me.hold) {
					clearTimeout(me.hold);
					me.hold = undefined;
				}
				if (!featureDetection.supports_gesture() && me.implementedGestureDist) {
					// on some platforms, like Android, there is no gesture support, so we have to implement it
					me.implementedGestureDist = undefined;
					me.implementedGestureAngle = undefined;
					if (me.gestureend) {
						me.prehandleEvent(e);
						me.gestureend(e);
					}
				}
				if (me.touchend) {
					me.prehandleEvent(e);
					me.touchend(e);
				} else if (me.mouseup) {
					me.prehandleEvent(e);
					me.mouseup(e);
				}
				if ((new Date().getTime() - me.lastTouch) < 250) {
					if (me.tap) {
						me.prehandleEvent(e);
						me.tap(e);
					} else if (me.click) {
						me.prehandleEvent(e);
						me.click(e);
					}
				}
			});
			element.addEventListener('gesturestart', function(e) {
				if (me.gesturestart) {
					me.prehandleEvent(e);
					me.gesturestart(e);
				}
			});
			element.addEventListener('gesturechange', function(e) {
				if (me.gesturechange) {
					me.prehandleEvent(e);
					me.gesturechange(e);
				}
			});
			element.addEventListener('gestureend', function(e) {
				if (me.gestureend) {
					me.prehandleEvent(e);
					me.gestureend(e);
				}
			});
		} else {
			// normal events
			// some mobile browsers will simulate mouse events, so do not set these
			// events if mobile, or it will interfere with the handling of touch events
			element.addEventListener('click', function(e) {
			    switch (e.button) {
			        case 0:
			            // left mouse button pressed
			            if (me.click) {
			                me.prehandleEvent(e);
			                me.click(e);
			            }
			            break;
			        case 1:
			            // middle mouse button pressed
			            if (me.middleclick) {
			                me.prehandleEvent(e);
			                me.middleclick(e);
			            }
			            break;
			        case 2:
			            // right mouse button pressed
			            if (me.rightclick) {
			                me.prehandleEvent(e);
			                me.rightclick(e);
			            }
			            break;
			    }
			});
			element.addEventListener('dblclick', function(e) {
			    if (me.dblclick) {
			        me.prehandleEvent(e);
			        me.dblclick(e);
			    }
			});
			element.addEventListener('mousedown', function(e) {
				switch (e.button) {
				case 0:
					// left mouse button pressed
					monitor.CANVAS_DRAGGING = me;
					if (me.mousedown) {
						me.prehandleEvent(e);
						me.mousedown(e);
					}
					break;
				case 1:
					// middle mouse button pressed
					if (me.middlemousedown) {
						me.prehandleEvent(e);
						me.middlemousedown(e);
					}
					break;
				case 2:
					// right mouse button pressed
					if (me.rightmousedown) {
						me.prehandleEvent(e);
						me.rightmousedown(e);
					}
					break;
				}
			});
			element.addEventListener('mousemove', function(e) {
				if (!monitor.CANVAS_DRAGGING && me.mousemove) {
					me.prehandleEvent(e);
					me.mousemove(e);
				}
			});
			element.addEventListener('mouseout', function(e) {
				monitor.CANVAS_OVER = undefined;
				if (me.mouseout) {
					me.prehandleEvent(e);
					me.mouseout(e);
				}
			});
			element.addEventListener('mouseover', function(e) {
				monitor.CANVAS_OVER = me;
				if (me.mouseover) {
					me.prehandleEvent(e);
					me.mouseover(e);
				}
			});
			element.addEventListener('mouseup', function(e) {
				switch (e.button) {
				case 0:
					// left mouse button pressed
					if (me.mouseup) {
						me.prehandleEvent(e);
						me.mouseup(e);
					}
					break;
				case 1:
					// middle mouse button pressed
					if (me.middlemouseup) {
						me.prehandleEvent(e);
						me.middlemouseup(e);
					}
					break;
				case 2:
					// right mouse button pressed
					if (me.rightmouseup) {
						me.prehandleEvent(e);
						me.rightmouseup(e);
					}
					break;
				}
			});
			element.addEventListener('contextmenu', function(e) {
				if (me.contextmenu) {
					me.prehandleEvent(e);
					me.contextmenu(e);
				}
			});
			element.addEventListener('wheel', function(e) {
				if (me.mousewheel) {
					me.prehandleEvent(e);
					me.mousewheel(e, -e.deltaY);
				}
			});
		}
		if (this.subCreate) {
			this.subCreate();
		}
	};
	_.prehandleEvent = function(e) {
		if(e.pageX === undefined && e.changedTouches){
			// Chrome on Android does not define pageX or pageY, so take it from the first changedTouches
			e.pageX = e.changedTouches[0].pageX;
			e.pageY = e.changedTouches[0].pageY;
		}
		let element = document.getElementById(this.id);
	    let offset = element.getBoundingClientRect();
	    e.offset = { left: offset.x + window.scrollX, top: offset.y + window.scrollY };
	    e.p = new structures.Point(e.pageX - e.offset.left, e.pageY - e.offset.top);
	    if (!this.doEventDefault) {
	        e.preventDefault();
	        e.returnValue = false;
	    }
	};
	
})(ChemDoodle, ChemDoodle.featureDetection, ChemDoodle.math, ChemDoodle.monitor, ChemDoodle.structures, Math, document, window, navigator.userAgent);

(function(c, animations, undefined) {
	'use strict';
	c._AnimatorCanvas = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	let _ = c._AnimatorCanvas.prototype = new c._Canvas();
	_.timeout = 33;
	_.startAnimation = function() {
		this.stopAnimation();
		this.lastTime = new Date().getTime();
		let me = this;
		if (this.nextFrame) {
			this.handle = animations.requestInterval(function() {
				// advance clock
				let timeNow = new Date().getTime();
				// update and repaint
				me.nextFrame(timeNow - me.lastTime);
				me.repaint();
				me.lastTime = timeNow;
			}, this.timeout);
		}
	};
	_.stopAnimation = function() {
		if (this.handle) {
			animations.clearRequestInterval(this.handle);
			this.handle = undefined;
		}
	};
	_.isRunning = function() {
		// must compare to undefined here to return a boolean
		return this.handle !== undefined;
	};

})(ChemDoodle, ChemDoodle.animations);

(function(c, document, undefined) {
	'use strict';
	c.FileCanvas = function(id, width, height, action) {
		if (id) {
			this.create(id, width, height);
		}
		let form = '<br><form name="FileForm" enctype="multipart/form-data" method="POST" action="' + action + '" target="HiddenFileFrame"><input type="file" name="f" /><input type="submit" name="submitbutton" value="Show File" /></form><iframe id="HFF-' + id + '" name="HiddenFileFrame" height="0" width="0" style="display:none;" onLoad="GetMolFromFrame(\'HFF-' + id + '\', ' + id + ')"></iframe>';
		document.writeln(form);
		this.emptyMessage = 'Click below to load file';
		this.repaint();
	};
	c.FileCanvas.prototype = new c._Canvas();

})(ChemDoodle, document);

(function(c, undefined) {
	'use strict';
	c.HyperlinkCanvas = function(id, width, height, urlOrFunction, color, size) {
		if (id) {
			this.create(id, width, height);
		}
		this.urlOrFunction = urlOrFunction;
		this.color = color ? color : 'blue';
		this.size = size ? size : 2;
	};
	let _ = c.HyperlinkCanvas.prototype = new c._Canvas();
	_.openInNewWindow = true;
	_.hoverImage = undefined;
	_.drawChildExtras = function(ctx) {
		if (this.e) {
			if (this.hoverImage) {
				ctx.drawImage(this.hoverImage, 0, 0);
			} else {
				ctx.strokeStyle = this.color;
				ctx.lineWidth = this.size * 2;
				ctx.strokeRect(0, 0, this.width, this.height);
			}
		}
	};
	_.setHoverImage = function(url) {
		this.hoverImage = new Image();
		this.hoverImage.src = url;
	};
	_.click = function(p) {
		this.e = undefined;
		this.repaint();
		if (this.urlOrFunction instanceof Function) {
			this.urlOrFunction();
		} else {
			if (this.openInNewWindow) {
				window.open(this.urlOrFunction);
			} else {
				location.href = this.urlOrFunction;
			}
		}
	};
	_.mouseout = function(e) {
		this.e = undefined;
		this.repaint();
	};
	_.mouseover = function(e) {
		this.e = e;
		this.repaint();
	};

})(ChemDoodle);

(function(c, iChemLabs, document, undefined) {
	'use strict';
	c.MolGrabberCanvas = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
		let sb = [];
		sb.push('<br><input type="text" id="');
		sb.push(id);
		sb.push('_query" size="32" value="" />');
		sb.push(this.getInputFields());

		// Don't use document.writeln here, it breaks the whole page after
		// document is closed.
		let canvas = document.getElementById(id);
		canvas.insertAdjacentHTML('afterend', sb.join(''));

		let self = this;
		document.getElementById(id + '_submit').addEventListener('click', function() {
				self.search();
		});
		document.getElementById(id + '_query').addEventListener('keypress', function(e) {
				if (e.key === 'Enter' || e.keyCode === 13) {
					self.search();
				}
		});
		this.emptyMessage = 'Enter search term below';
		this.repaint();
	};
	let _ = c.MolGrabberCanvas.prototype = new c._Canvas();
	_.setSearchTerm = function(term) {
		document.getElementById(this.id + '_query').value = term;
		this.search();
	};
	_.getInputFields = function(){
		let sb = [];
		sb.push('<br><nobr>');
		sb.push('<select id="');
		sb.push(this.id);
		sb.push('_select">');
		sb.push('<option value="chemexper">ChemExper');
		sb.push('<option value="chemspider">ChemSpider');
		sb.push('<option value="pubchem" selected>PubChem');
		sb.push('</select>');
		sb.push('<button type="button" id="');
		sb.push(this.id);
		sb.push('_submit">Show Molecule</button>');
		sb.push('</nobr>');
		return sb.join('');
	};
	_.search = function() {
		this.emptyMessage = 'Searching...';
		this.clear();
		let self = this;
		iChemLabs.getMoleculeFromDatabase(document.getElementById(this.id + '_query').value, {
			database : document.getElementById(this.id + '_select').value
		}, function(mol) {
			self.loadMolecule(mol);
		});
	};

})(ChemDoodle, ChemDoodle.iChemLabs, document);

(function(c, m, m4, undefined) {
	'use strict';
	// keep these declaration outside the loop to avoid overhead
	let matrix = [];
	let xAxis = [ 1, 0, 0 ];
	let yAxis = [ 0, 1, 0 ];
	let zAxis = [ 0, 0, 1 ];

	c.RotatorCanvas = function(id, width, height, rotate3D) {
		if (id) {
			this.create(id, width, height);
		}
		this.rotate3D = rotate3D;
	};
	let _ = c.RotatorCanvas.prototype = new c._AnimatorCanvas();
	let increment = m.PI / 15;
	_.xIncrement = increment;
	_.yIncrement = increment;
	_.zIncrement = increment;
	_.nextFrame = function(delta) {
		if (this.molecules.length === 0 && this.shapes.length === 0) {
			this.stopAnimation();
			return;
		}
		let change = delta / 1000;
		if (this.rotate3D) {
			m4.identity(matrix);
			m4.rotate(matrix, this.xIncrement * change, xAxis);
			m4.rotate(matrix, this.yIncrement * change, yAxis);
			m4.rotate(matrix, this.zIncrement * change, zAxis);
			for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
				let m = this.molecules[i];
				for ( let j = 0, jj = m.atoms.length; j < jj; j++) {
					let a = m.atoms[j];
					let p = [ a.x - this.width / 2, a.y - this.height / 2, a.z ];
					m4.multiplyVec3(matrix, p);
					a.x = p[0] + this.width / 2;
					a.y = p[1] + this.height / 2;
					a.z = p[2];
				}
				for ( let j = 0, jj = m.rings.length; j < jj; j++) {
					m.rings[j].center = m.rings[j].getCenter();
				}
				if (this.styles.atoms_display && this.styles.atoms_circles_2D) {
					m.sortAtomsByZ();
				}
				if (this.styles.bonds_display && this.styles.bonds_clearOverlaps_2D) {
					m.sortBondsByZ();
				}
			}
			for ( let i = 0, ii = this.shapes.length; i < ii; i++) {
				let sps = this.shapes[i].getPoints();
				for ( let j = 0, jj = sps.length; j < jj; j++) {
					let a = sps[j];
					let p = [ a.x - this.width / 2, a.y - this.height / 2, 0 ];
					m4.multiplyVec3(matrix, p);
					a.x = p[0] + this.width / 2;
					a.y = p[1] + this.height / 2;
				}
			}
		} else {
			this.styles.rotateAngle += this.zIncrement * change;
		}
	};
	_.dblclick = function(e) {
		if (this.isRunning()) {
			this.stopAnimation();
		} else {
			this.startAnimation();
		}
	};

})(ChemDoodle, Math, ChemDoodle.lib.mat4);

(function(c, animations, math, undefined) {
	'use strict';
	c.SlideshowCanvas = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	let _ = c.SlideshowCanvas.prototype = new c._AnimatorCanvas();
	_.frames = [];
	_.curIndex = 0;
	_.timeout = 5000;
	_.alpha = 0;
	_.innerHandle = undefined;
	_.phase = 0;
	_.drawChildExtras = function(ctx) {
		let rgb = math.getRGB(this.styles.backgroundColor, 255);
		ctx.fillStyle = 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + this.alpha + ')';
		ctx.fillRect(0, 0, this.width, this.height);
	};
	_.nextFrame = function(delta) {
		if (this.frames.length === 0) {
			this.stopAnimation();
			return;
		}
		this.phase = 0;
		let me = this;
		let count = 1;
		this.innerHandle = setInterval(function() {
			me.alpha = count / 15;
			me.repaint();
			if (count === 15) {
				me.breakInnerHandle();
			}
			count++;
		}, 33);
	};
	_.breakInnerHandle = function() {
		if (this.innerHandle) {
			clearInterval(this.innerHandle);
			this.innerHandle = undefined;
		}
		if (this.phase === 0) {
			this.curIndex++;
			if (this.curIndex > this.frames.length - 1) {
				this.curIndex = 0;
			}
			this.alpha = 1;
			let f = this.frames[this.curIndex];
			this.loadContent(f.mols, f.shapes);
			this.phase = 1;
			let me = this;
			let count = 1;
			this.innerHandle = setInterval(function() {
				me.alpha = (15 - count) / 15;
				me.repaint();
				if (count === 15) {
					me.breakInnerHandle();
				}
				count++;
			}, 33);
		} else if (this.phase === 1) {
			this.alpha = 0;
			this.repaint();
		}
	};
	_.addFrame = function(molecules, shapes) {
		if (this.frames.length === 0) {
			this.loadContent(molecules, shapes);
		}
		this.frames.push({
			mols : molecules,
			shapes : shapes
		});
	};

})(ChemDoodle, ChemDoodle.animations, ChemDoodle.math);

(function(c, monitor, structures, m, m4, undefined) {
	'use strict';
	c.TransformCanvas = function(id, width, height, rotate3D) {
		if (id) {
			this.create(id, width, height);
		}
		this.rotate3D = rotate3D;
	};
	let _ = c.TransformCanvas.prototype = new c._Canvas();
	_.lastPoint = undefined;
	_.rotationMultMod = 1.3;
	_.lastPinchScale = 1;
	_.lastGestureRotate = 0;
	_.mousedown = function(e) {
		this.lastPoint = e.p;
	};
	_.dblclick = function(e) {
		// center structure
		this.center();
		this.repaint();
	};
	_.drag = function(e) {
		if (!this.lastPoint.multi) {
			if (monitor.ALT) {
				let t = new structures.Point(e.p.x, e.p.y);
				t.sub(this.lastPoint);
				for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
					let mol = this.molecules[i];
					for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
						mol.atoms[j].add(t);
					}
					mol.check();
				}
				for ( let i = 0, ii = this.shapes.length; i < ii; i++) {
					let sps = this.shapes[i].getPoints();
					for ( let j = 0, jj = sps.length; j < jj; j++) {
						sps[j].add(t);
					}
				}
				this.lastPoint = e.p;
				this.repaint();
			} else {
				if (this.rotate3D === true) {
					let diameter = m.max(this.width / 4, this.height / 4);
					let difx = e.p.x - this.lastPoint.x;
					let dify = e.p.y - this.lastPoint.y;
					let yIncrement = difx / diameter * this.rotationMultMod;
					let xIncrement = -dify / diameter * this.rotationMultMod;
					let matrix = [];
					m4.identity(matrix);
					m4.rotate(matrix, xIncrement, [ 1, 0, 0 ]);
					m4.rotate(matrix, yIncrement, [ 0, 1, 0 ]);
					for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
						let mol = this.molecules[i];
						for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
							let a = mol.atoms[j];
							let p = [ a.x - this.width / 2, a.y - this.height / 2, a.z ];
							m4.multiplyVec3(matrix, p);
							a.x = p[0] + this.width / 2;
							a.y = p[1] + this.height / 2;
							a.z = p[2];
						}
						for ( let i = 0, ii = mol.rings.length; i < ii; i++) {
							mol.rings[i].center = mol.rings[i].getCenter();
						}
						this.lastPoint = e.p;
						if (this.styles.atoms_display && this.styles.atoms_circles_2D) {
							mol.sortAtomsByZ();
						}
						if (this.styles.bonds_display && this.styles.bonds_clearOverlaps_2D) {
							mol.sortBondsByZ();
						}
					}
					this.repaint();
				} else {
					let center = new structures.Point(this.width / 2, this.height / 2);
					let before = center.angle(this.lastPoint);
					let after = center.angle(e.p);
					this.styles.rotateAngle -= (after - before);
					this.lastPoint = e.p;
					this.repaint();
				}
			}
		}
	};
	_.mousewheel = function(e, delta) {
		this.styles.scale += delta / 50;
		if (this.styles.scale < .01) {
			this.styles.scale = .01;
		}
		this.repaint();
	};
	_.multitouchmove = function(e, numFingers) {
		if (numFingers === 2) {
			if (this.lastPoint.multi) {
				let t = new structures.Point(e.p.x, e.p.y);
				t.sub(this.lastPoint);
				for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
					let m = this.molecules[i];
					for ( let j = 0, jj = m.atoms.length; j < jj; j++) {
						m.atoms[j].add(t);
					}
					m.check();
				}
				for ( let i = 0, ii = this.shapes.length; i < ii; i++) {
					let sps = this.shapes[i].getPoints();
					for ( let j = 0, jj = sps.length; j < jj; j++) {
						sps[j].add(t);
					}
				}
				this.lastPoint = e.p;
				this.lastPoint.multi = true;
				this.repaint();
			} else {
				this.lastPoint = e.p;
				this.lastPoint.multi = true;
			}
		}
	};
	_.gesturechange = function(e) {
		if (e.scale - this.lastPinchScale !== 0) {
			this.styles.scale *= e.scale / this.lastPinchScale;
			if (this.styles.scale < .01) {
				this.styles.scale = .01;
			}
			this.lastPinchScale = e.scale;
		}
		if (this.lastGestureRotate - e.rotation !== 0) {
			let rot = (this.lastGestureRotate - e.rotation) / 180 * m.PI;
			let center = new structures.Point(this.width / 2, this.height / 2);
			for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
				let mol = this.molecules[i];
				for ( let j = 0, jj = mol.atoms.length; j < jj; j++) {
					let a = mol.atoms[j];
					let dist = center.distance(a);
					let angle = center.angle(a) + rot;
					a.x = center.x + dist * m.cos(angle);
					a.y = center.y - dist * m.sin(angle);
				}
				mol.check();
			}
			this.lastGestureRotate = e.rotation;
		}
		this.repaint();
	};
	_.gestureend = function(e) {
		this.lastPinchScale = 1;
		this.lastGestureRotate = 0;
	};

})(ChemDoodle, ChemDoodle.monitor, ChemDoodle.structures, Math, ChemDoodle.lib.mat4);

(function(c, undefined) {
	'use strict';
	c.ViewerCanvas = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	c.ViewerCanvas.prototype = new c._Canvas();

})(ChemDoodle);

(function(c, document, undefined) {
	'use strict';
	c._SpectrumCanvas = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	let _ = c._SpectrumCanvas.prototype = new c._Canvas();
	_.spectrum = undefined;
	_.emptyMessage = 'No Spectrum Loaded or Recognized';
	_.loadMolecule = undefined;
	_.getMolecule = undefined;
	_.innerRepaint = function(ctx) {
		if (this.spectrum && this.spectrum.data.length > 0) {
			this.spectrum.draw(ctx, this.styles, this.width, this.height);
		} else if (this.emptyMessage) {
			ctx.fillStyle = '#737683';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = '18px Helvetica, Verdana, Arial, Sans-serif';
			ctx.fillText(this.emptyMessage, this.width / 2, this.height / 2);
		}
	};
	_.loadSpectrum = function(spectrum) {
		this.spectrum = spectrum;
		this.repaint();
	};
	_.getSpectrum = function() {
		return this.spectrum;
	};
	_.getSpectrumCoordinates = function(x, y) {
		return spectrum.getInternalCoordinates(x, y, this.width, this.height);
	};

})(ChemDoodle, document);

(function(c, undefined) {
	'use strict';
	c.ObserverCanvas = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	c.ObserverCanvas.prototype = new c._SpectrumCanvas();

})(ChemDoodle);

(function(c, undefined) {
	'use strict';
	c.OverlayCanvas = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	let _ = c.OverlayCanvas.prototype = new c._SpectrumCanvas();
	_.overlaySpectra = [];
	_.superRepaint = _.innerRepaint;
	_.innerRepaint = function(ctx) {
		this.superRepaint(ctx);
		if (this.spectrum && this.spectrum.data.length > 0) {
			for ( let i = 0, ii = this.overlaySpectra.length; i < ii; i++) {
				let s = this.overlaySpectra[i];
				if (s && s.data.length > 0) {
					s.minX = this.spectrum.minX;
					s.maxX = this.spectrum.maxX;
					s.drawPlot(ctx, this.styles, this.width, this.height, this.spectrum.memory.offsetTop, this.spectrum.memory.offsetLeft, this.spectrum.memory.offsetBottom);
				}
			}
		}
	};
	_.addSpectrum = function(spectrum) {
		if (!this.spectrum) {
			this.spectrum = spectrum;
		} else {
			this.overlaySpectra.push(spectrum);
		}
	};

})(ChemDoodle);

(function(c, monitor, m, undefined) {
	'use strict';
	c.PerspectiveCanvas = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	let _ = c.PerspectiveCanvas.prototype = new c._SpectrumCanvas();
	_.dragRange = undefined;
	_.rescaleYAxisOnZoom = true;
	_.lastPinchScale = 1;
	_.mousedown = function(e) {
		this.dragRange = new c.structures.Point(e.p.x, e.p.x);
	};
	_.mouseup = function(e) {
		if (this.dragRange && this.dragRange.x !== this.dragRange.y) {
			if (!this.dragRange.multi) {
				let newScale = this.spectrum.zoom(this.dragRange.x, e.p.x, this.width, this.rescaleYAxisOnZoom);
				if (this.rescaleYAxisOnZoom) {
					this.styles.scale = newScale;
				}
			}
			this.dragRange = undefined;
			this.repaint();
		}
	};
	_.drag = function(e) {
		if (this.dragRange) {
			if (this.dragRange.multi) {
				this.dragRange = undefined;
			} else if (monitor.SHIFT) {
				this.spectrum.translate(e.p.x - this.dragRange.x, this.width);
				this.dragRange.x = e.p.x;
				this.dragRange.y = e.p.x;
			} else {
				this.dragRange.y = e.p.x;
			}
			this.repaint();
		}
	};
	_.drawChildExtras = function(ctx) {
		if (this.dragRange) {
			let xs = m.min(this.dragRange.x, this.dragRange.y);
			let xe = m.max(this.dragRange.x, this.dragRange.y);
			ctx.strokeStyle = 'gray';
			ctx.lineStyle = 1;
			ctx.beginPath();
			ctx.moveTo(xs, this.height / 2);
			for ( let i = xs; i <= xe; i++) {
				if (i % 10 < 5) {
					ctx.lineTo(i, m.round(this.height / 2));
				} else {
					ctx.moveTo(i, m.round(this.height / 2));
				}
			}
			ctx.stroke();
		}
	};
	_.mousewheel = function(e, delta) {
		this.styles.scale -= delta / 10;
		if (this.styles.scale < .01) {
			this.styles.scale = .01;
		}
		this.repaint();
	};
	_.dblclick = function(e) {
		this.spectrum.setup();
		this.styles.scale = 1;
		this.repaint();
	};
	_.multitouchmove = function(e, numFingers) {
		if (numFingers === 2) {
			if (!this.dragRange || !this.dragRange.multi) {
				this.dragRange = new c.structures.Point(e.p.x, e.p.x);
				this.dragRange.multi = true;
			} else {
				this.spectrum.translate(e.p.x - this.dragRange.x, this.width);
				this.dragRange.x = e.p.x;
				this.dragRange.y = e.p.x;
				this.repaint();
			}
		}
	};
	_.gesturechange = function(e) {
		this.styles.scale *= e.scale / this.lastPinchScale;
		if (this.styles.scale < .01) {
			this.styles.scale = .01;
		}
		this.lastPinchScale = e.scale;
		this.repaint();
	};
	_.gestureend = function(e) {
		this.lastPinchScale = 1;
	};

})(ChemDoodle, ChemDoodle.monitor, Math);

(function(c, extensions, m, undefined) {
	'use strict';
	c.SeekerCanvas = function(id, width, height, seekType) {
		if (id) {
			this.create(id, width, height);
		}
		this.seekType = seekType;
	};
	let _ = c.SeekerCanvas.prototype = new c._SpectrumCanvas();
	_.superRepaint = _.innerRepaint;
	_.innerRepaint = function(ctx) {
		this.superRepaint(ctx);
		if (this.spectrum && this.spectrum.data.length > 0 && this.p) {
			// set up coords
			let renderP;
			let internalP;
			if (this.seekType === c.SeekerCanvas.SEEK_POINTER) {
				renderP = this.p;
				internalP = this.spectrum.getInternalCoordinates(renderP.x, renderP.y);
			} else if (this.seekType === c.SeekerCanvas.SEEK_PLOT || this.seekType === c.SeekerCanvas.SEEK_PEAK) {
				internalP = this.seekType === c.SeekerCanvas.SEEK_PLOT ? this.spectrum.getClosestPlotInternalCoordinates(this.p.x) : this.spectrum.getClosestPeakInternalCoordinates(this.p.x);
				if (!internalP) {
					return;
				}
				renderP = {
					x : this.spectrum.getTransformedX(internalP.x, this.styles, this.width, this.spectrum.memory.offsetLeft),
					y : this.spectrum.getTransformedY(internalP.y / 100, this.styles, this.height, this.spectrum.memory.offsetBottom, this.spectrum.memory.offsetTop)
				};
			}
			// draw point
			ctx.fillStyle = 'white';
			ctx.strokeStyle = this.styles.plots_color;
			ctx.lineWidth = this.styles.plots_width;
			ctx.beginPath();
			ctx.arc(renderP.x, renderP.y, 3, 0, m.PI * 2, false);
			ctx.fill();
			ctx.stroke();
			// draw internal coordinates
			ctx.font = extensions.getFontString(this.styles.text_font_size, this.styles.text_font_families);
			ctx.textAlign = 'left';
			ctx.textBaseline = 'bottom';
			let s = 'x:' + internalP.x.toFixed(3) + ', y:' + internalP.y.toFixed(3);
			let x = renderP.x + 3;
			let w = ctx.measureText(s).width;
			if (x + w > this.width - 2) {
				x -= 6 + w;
			}
			let y = renderP.y;
			if (y - this.styles.text_font_size - 2 < 0) {
				y += this.styles.text_font_size;
			}
			ctx.fillRect(x, y - this.styles.text_font_size, w, this.styles.text_font_size);
			ctx.fillStyle = 'black';
			ctx.fillText(s, x, y);
		}
	};
	_.mouseout = function(e) {
		this.p = undefined;
		this.repaint();
	};
	_.mousemove = function(e) {
		this.p = {
			x : e.p.x - 2,
			y : e.p.y - 3
		};
		this.repaint();
	};
	_.touchstart = function(e) {
		this.mousemove(e);
	};
	_.touchmove = function(e) {
		this.mousemove(e);
	};
	_.touchend = function(e) {
		this.mouseout(e);
	};
	c.SeekerCanvas.SEEK_POINTER = 'pointer';
	c.SeekerCanvas.SEEK_PLOT = 'plot';
	c.SeekerCanvas.SEEK_PEAK = 'peak';

})(ChemDoodle, ChemDoodle.extensions, Math);

(function(c, extensions, math, structures, d3, RESIDUE, m, document, m4, m3, v3, window, undefined) {
	'use strict';
	c._Canvas3D = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	c._Canvas3D.PRESERVE_DRAWING_BUFFER = false;
	let _ = c._Canvas3D.prototype = new c._Canvas();
	let _super = c._Canvas.prototype;
	_.rotationMatrix = undefined;
	_.contentCenter = undefined;
	_.lastPoint = undefined;
	_.emptyMessage = 'WebGL is Unavailable!';
	_.lastPinchScale = 1;
	_.lastGestureRotate = 0;
	_.afterLoadContent = function() {
		let bounds = new math.Bounds();
		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			bounds.expand(this.molecules[i].getBounds3D());
		}
		// build fog parameter
		let maxDimension3D = v3.dist([ bounds.maxX, bounds.maxY, bounds.maxZ ], [ bounds.minX, bounds.minY, bounds.minZ ]) / 2 + 1.5;
		if(maxDimension3D===Infinity){
			// there is no content
			maxDimension3D = 10;
		}
		
		this.maxDimension = m.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);

		let fov         = m.min(179.9, m.max(this.styles.projectionPerspectiveVerticalFieldOfView_3D, 0.1));
		let theta       = fov / 360 * m.PI;
		let tanTheta    = m.tan(theta) / 0.8;
		let top         = maxDimension3D;
		let focalLength = top / tanTheta;
		let near        = focalLength - top;
		let far         = focalLength + top;
		let aspect      = this.width / this.height;

		this.camera.fieldOfView = fov;
		this.camera.near = near;
		this.camera.far = far;
		this.camera.aspect = aspect;
		m4.translate(m4.identity(this.camera.viewMatrix), [ 0, 0, -focalLength]);

		let lightFocalLength = top / m.tan(theta);
		
		this.lighting.camera.fieldOfView = fov;
		this.lighting.camera.near = lightFocalLength - top;
		this.lighting.camera.far = lightFocalLength + top;
		this.lighting.updateView();

		this.setupScene();
	};
	_.renderDepthMap = function() {
		if (this.styles.shadow_3D && d3.DepthShader) {

			let cullFaceEnabled = this.gl.isEnabled(this.gl.CULL_FACE);
			if(!cullFaceEnabled) { this.gl.enable(this.gl.CULL_FACE); }

			this.depthShader.useShaderProgram(this.gl);

			// current clear color
			let cs = this.gl.getParameter(this.gl.COLOR_CLEAR_VALUE);

			this.gl.clearColor(1.0, 1.0, 1.0, 0.0);

			this.lightDepthMapFramebuffer.bind(this.gl, this.shadowTextureSize, this.shadowTextureSize);

			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

			// use light projection matrix to draw the molecule
			this.depthShader.setProjectionMatrix(this.gl, this.lighting.camera.projectionMatrix);

			this.depthShader.enableAttribsArray(this.gl);

			for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
				this.molecules[i].render(this.gl, this.styles);
			}

			this.gl.flush();

			this.depthShader.disableAttribsArray(this.gl);

			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

			// set back the clear color
			this.gl.clearColor(cs[0], cs[1], cs[2], cs[3]);

			if(!cullFaceEnabled) { this.gl.disable(this.gl.CULL_FACE); }
		}
	};// draw anything those not molecules, example compass, shapes, text etc.
	_.renderExtras = function() {

		this.phongShader.useShaderProgram(this.gl);

		this.phongShader.enableAttribsArray(this.gl);

		let transparentShapes = [];
		for ( let i = 0, ii = this.shapes.length; i < ii; i++) {
			let s = this.shapes[i];
			if(s instanceof d3._Surface && (!s.styles && this.styles.surfaces_alpha!==1 || s.styles && s.styles.surfaces_alpha!==1)){
				transparentShapes.push(s);
			}else{
				s.render(this.gl, this.styles);
			}
		}
		
		// transparent shapes
		if(transparentShapes.length!==0){
			//this.gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
			this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
			this.gl.enable(this.gl.BLEND);
			this.gl.depthMask(false);
			for ( let i = 0, ii = transparentShapes.length; i < ii; i++) {
				let s = transparentShapes[i];
				s.render(this.gl, this.styles);
			}
			this.gl.depthMask(true);
			this.gl.disable(this.gl.BLEND);
			this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);		
		}
		

		this.phongShader.setShadow(this.gl, false);
		this.phongShader.setFogMode(this.gl, 0);
		this.phongShader.setFlatColor(this.gl, false);

		// compass use its own model view and projection matrix
		// so it need to use back the default matrix for other
		// rendering process (ex. render arbitrary text).
		if (this.styles.compass_display) {
			this.phongShader.setLightDirection(this.gl, [0, 0, -1]);
			this.compass.render(this.gl, this.styles);
		}

		this.phongShader.disableAttribsArray(this.gl);

		this.gl.flush();

		// enable blend and depth mask set to false
		this.gl.enable(this.gl.BLEND);
		this.gl.depthMask(false);
		this.labelShader.useShaderProgram(this.gl);
		// use back the default model view matrix
		this.labelShader.setMatrixUniforms(this.gl, this.gl.modelViewMatrix);
		// use back the default projection matrix
		this.labelShader.setProjectionMatrix(this.gl, this.camera.projectionMatrix);
		this.labelShader.setDimension(this.gl, this.gl.canvas.clientWidth, this.gl.canvas.clientHeight);

		// enable vertex for draw text
		this.labelShader.enableAttribsArray(this.gl);

		// draw label molecule
		if (this.styles.atoms_displayLabels_3D) {
			this.label3D.render(this.gl, this.styles, this.getMolecules());
		}
		// draw measurement text
		if(this.styles.measurement_displayText_3D) {
			for ( let i = 0, ii = this.shapes.length; i < ii; i++) {
				let s = this.shapes[i];
				if(s.renderText){
					s.renderText(this.gl, this.styles);
				}
			}
		}
		// draw compass X Y Z text
		if (this.styles.compass_display && this.styles.compass_displayText_3D) {
			this.compass.renderAxis(this.gl);
		}
		// disable vertex for draw text
		this.labelShader.disableAttribsArray(this.gl);

		// disable blend and depth mask set to true
		this.gl.disable(this.gl.BLEND);
		this.gl.depthMask(true);
		this.gl.flush();
		
		if (this.drawChildExtras) {
			this.drawChildExtras(this.gl);
		}

		this.gl.flush();
	};
	// molecule colors rendeing will both use on forward and deferred rendering
	_.renderColor = function() {
		this.phongShader.useShaderProgram(this.gl);

		this.gl.uniform1i(this.phongShader.shadowDepthSampleUniform, 0);

		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.lightDepthMapTexture.texture);

		this.phongShader.setProjectionMatrix(this.gl, this.camera.projectionMatrix);
		this.phongShader.setShadow(this.gl, this.styles.shadow_3D);
		this.phongShader.setFlatColor(this.gl, this.styles.flat_color_3D);
		this.phongShader.setGammaCorrection(this.gl, this.styles.gammaCorrection_3D);

		this.phongShader.setShadowTextureSize(this.gl, this.shadowTextureSize, this.shadowTextureSize);
		this.phongShader.setShadowIntensity(this.gl, this.styles.shadow_intensity_3D);

		this.phongShader.setFogMode(this.gl, this.styles.fog_mode_3D);
		this.phongShader.setFogColor(this.gl, this.fogging.colorRGB);
		this.phongShader.setFogStart(this.gl, this.fogging.fogStart);
		this.phongShader.setFogEnd(this.gl, this.fogging.fogEnd);
		this.phongShader.setFogDensity(this.gl, this.fogging.density);

		this.phongShader.setLightProjectionMatrix(this.gl, this.lighting.camera.projectionMatrix);
		this.phongShader.setLightDiffuseColor(this.gl, this.lighting.diffuseRGB);
		this.phongShader.setLightSpecularColor(this.gl, this.lighting.specularRGB);
		this.phongShader.setLightDirection(this.gl, this.lighting.direction);
		
		this.phongShader.enableAttribsArray(this.gl);

		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			this.molecules[i].render(this.gl, this.styles);
		}

		this.phongShader.disableAttribsArray(this.gl);

		this.gl.flush();
	};
	_.renderPosition = function() {
		this.positionShader.useShaderProgram(this.gl);

		this.positionShader.setProjectionMatrix(this.gl, this.camera.projectionMatrix);

		this.positionShader.enableAttribsArray(this.gl);

		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			this.molecules[i].render(this.gl, this.styles);
		}

		this.positionShader.disableAttribsArray(this.gl);

		this.gl.flush();
	};
	_.renderNormal = function() {
		this.normalShader.useShaderProgram(this.gl);
		this.normalShader.setProjectionMatrix(this.gl, this.camera.projectionMatrix);

		this.normalShader.enableAttribsArray(this.gl);

		for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
			this.molecules[i].render(this.gl, this.styles);
		}

		this.normalShader.disableAttribsArray(this.gl);

		this.gl.flush();
	};
	_.renderSSAO = function() {
		this.ssaoShader.useShaderProgram(this.gl);

		this.ssaoShader.setProjectionMatrix(this.gl, this.camera.projectionMatrix);

		this.ssaoShader.setSampleKernel(this.gl, this.ssao.sampleKernel);

		this.ssaoShader.setKernelRadius(this.gl, this.styles.ssao_kernel_radius);

		this.ssaoShader.setPower(this.gl, this.styles.ssao_power);

		this.ssaoShader.setGbufferTextureSize(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

		this.gl.uniform1i(this.ssaoShader.positionSampleUniform, 0);
		this.gl.uniform1i(this.ssaoShader.normalSampleUniform, 1);
		this.gl.uniform1i(this.ssaoShader.noiseSampleUniform, 2);

		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.positionTexture.texture);

		this.gl.activeTexture(this.gl.TEXTURE1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.normalTexture.texture);

		this.gl.activeTexture(this.gl.TEXTURE2);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.ssao.noiseTexture);

		this.gl.activeTexture(this.gl.TEXTURE0);

		this.ssaoShader.enableAttribsArray(this.gl);

		this.gl.quadBuffer.bindBuffers(this.gl);

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.gl.quadBuffer.vertexPositionBuffer.numItems);

		this.ssaoShader.disableAttribsArray(this.gl);

		this.gl.flush();

		// render ssao blur shader
		this.ssaoFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		this.ssaoBlurShader.useShaderProgram(this.gl);

		this.ssaoBlurShader.setGbufferTextureSize(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

		this.gl.uniform1i(this.ssaoBlurShader.aoSampleUniform, 0);
		this.gl.uniform1i(this.ssaoBlurShader.depthSampleUniform, 1);

		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.imageTexture.texture);
		this.gl.activeTexture(this.gl.TEXTURE1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture.texture);
		this.gl.activeTexture(this.gl.TEXTURE0);


		this.ssaoBlurShader.enableAttribsArray(this.gl);

		this.gl.quadBuffer.bindBuffers(this.gl);

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.gl.quadBuffer.vertexPositionBuffer.numItems);

		this.ssaoBlurShader.disableAttribsArray(this.gl);

		this.gl.activeTexture(this.gl.TEXTURE0);

		this.gl.flush();
	};
	_.renderOutline = function() {
		this.outlineShader.useShaderProgram(this.gl);

		this.outlineShader.setGbufferTextureSize(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

		this.outlineShader.setNormalThreshold(this.gl, this.styles.outline_normal_threshold);
		this.outlineShader.setDepthThreshold(this.gl, this.styles.outline_depth_threshold);
		this.outlineShader.setThickness(this.gl, this.styles.outline_thickness);

		this.gl.uniform1i(this.outlineShader.normalSampleUniform, 0);
		this.gl.uniform1i(this.outlineShader.depthSampleUniform, 1);

		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.normalTexture.texture);

		this.gl.activeTexture(this.gl.TEXTURE1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture.texture);

		this.gl.activeTexture(this.gl.TEXTURE0);

		this.outlineShader.enableAttribsArray(this.gl);

		this.gl.quadBuffer.bindBuffers(this.gl);

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.gl.quadBuffer.vertexPositionBuffer.numItems);

		this.outlineShader.disableAttribsArray(this.gl);

		this.gl.flush();
	};
	_.deferredRender = function() {
		// get backdground color
		let bgColor = this.gl.getParameter(this.gl.COLOR_CLEAR_VALUE);
		// set background to black
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);

		// render color
		this.colorFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.renderColor();

		// render position
		this.positionFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.renderPosition();

		// render normals
		this.normalFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.renderNormal();

		// render ssao
		if(this.styles.ssao_3D && d3.SSAOShader) {
			// render ssao shading
			this.quadFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			this.renderSSAO();
		} else {
			this.ssaoFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
			this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		}

		// render outline
		this.outlineFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
		this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		if(this.styles.outline_3D) {
			this.renderOutline();
		}

		// set back background color
		this.gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
		// composite render
		this.quadFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		
		this.lightingShader.useShaderProgram(this.gl);

		this.gl.uniform1i(this.lightingShader.positionSampleUniform, 0);
		this.gl.uniform1i(this.lightingShader.colorSampleUniform, 1);
		this.gl.uniform1i(this.lightingShader.ssaoSampleUniform, 2);
		this.gl.uniform1i(this.lightingShader.outlineSampleUniform, 3);

		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.positionTexture.texture);

		this.gl.activeTexture(this.gl.TEXTURE1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorTexture.texture);

		this.gl.activeTexture(this.gl.TEXTURE2);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.ssaoTexture.texture);

		this.gl.activeTexture(this.gl.TEXTURE3);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.outlineTexture.texture);

		this.gl.activeTexture(this.gl.TEXTURE0);

		this.lightingShader.enableAttribsArray(this.gl);

		this.gl.quadBuffer.bindBuffers(this.gl);

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.gl.quadBuffer.vertexPositionBuffer.numItems);

		this.lightingShader.disableAttribsArray(this.gl);

		this.gl.flush();

		// final render
		this.fxaaFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		// setup viewport
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

		this.gl.bindTexture(this.gl.TEXTURE_2D, this.imageTexture.texture);

		this.fxaaShader.useShaderProgram(this.gl);

		this.fxaaShader.setBuffersize(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
		this.fxaaShader.setAntialias(this.gl, this.styles.antialias_3D);

		this.fxaaShader.setEdgeThreshold(this.gl, this.styles.fxaa_edgeThreshold);
		this.fxaaShader.setEdgeThresholdMin(this.gl, this.styles.fxaa_edgeThresholdMin);
		this.fxaaShader.setSearchSteps(this.gl, this.styles.fxaa_searchSteps);
		this.fxaaShader.setSearchThreshold(this.gl, this.styles.fxaa_searchThreshold);
		this.fxaaShader.setSubpixCap(this.gl, this.styles.fxaa_subpixCap);
		this.fxaaShader.setSubpixTrim(this.gl, this.styles.fxaa_subpixTrim);

		this.fxaaShader.enableAttribsArray(this.gl);

		this.gl.quadBuffer.bindBuffers(this.gl);

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.gl.quadBuffer.vertexPositionBuffer.numItems);

		this.fxaaShader.disableAttribsArray(this.gl);

		this.gl.flush();


		// final render
		this.finalFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
		this.renderExtras();

		// set back background color
		this.gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);

		// last render
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		// setup viewport
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

		this.gl.bindTexture(this.gl.TEXTURE_2D, this.fxaaTexture.texture);

		this.quadShader.useShaderProgram(this.gl);

		this.quadShader.enableAttribsArray(this.gl);

		this.gl.quadBuffer.bindBuffers(this.gl);

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.gl.quadBuffer.vertexPositionBuffer.numItems);

		this.quadShader.disableAttribsArray(this.gl);

		this.gl.flush();
	};
	_.forwardRender = function() {
		// last render
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		// setup viewport
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

		this.renderColor();

		this.renderExtras();
	};
	_.repaint = function() {
		if (this.gl) {
			// set up the model view matrix to the specified transformations
			this.gl.lightViewMatrix = m4.multiply(this.lighting.camera.viewMatrix, this.rotationMatrix, []);
			this.gl.rotationMatrix = this.rotationMatrix;
			this.gl.modelViewMatrix = this.gl.lightViewMatrix;

			this.renderDepthMap();

			this.gl.modelViewMatrix = m4.multiply(this.camera.viewMatrix, this.rotationMatrix, []);
			m4.translate(this.gl.modelViewMatrix, this.contentCenter);

			if(this.isSupportDeferred() && (this.styles.ssao_3D || this.styles.outline_3D)) {
				this.deferredRender();
			} else {
				this.forwardRender();
			}
		}
	};
	_.pick = function(x, y, includeAtoms, includeBonds) {
		if (this.gl) {
			// draw with pick framebuffer
			let xu = x;
			let yu = this.height - y;
			if (this.pixelRatio !== 1) {
				xu *= this.pixelRatio;
				yu *= this.pixelRatio;
			}

			// set up the model view matrix to the specified transformations
			m4.multiply(this.camera.viewMatrix, this.rotationMatrix, this.gl.modelViewMatrix);
			m4.translate(this.gl.modelViewMatrix, this.contentCenter);
			this.gl.rotationMatrix = this.rotationMatrix;

			this.pickShader.useShaderProgram(this.gl);
			
			// current clear color
			let cs = this.gl.getParameter(this.gl.COLOR_CLEAR_VALUE);

			this.gl.clearColor(1.0, 1.0, 1.0, 0.0);
			this.pickerFramebuffer.bind(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

			// use default projection matrix to draw the molecule
			this.pickShader.setProjectionMatrix(this.gl, this.camera.projectionMatrix);

			// not need the normal for diffuse light, we need flat color
			this.pickShader.enableAttribsArray(this.gl);

			let objects = [];

			for ( let i = 0, ii = this.molecules.length; i < ii; i++) {
				this.molecules[i].renderPickFrame(this.gl, this.styles, objects, includeAtoms, includeBonds);
			}

			this.pickShader.disableAttribsArray(this.gl);

			this.gl.flush();

			let rgba = new Uint8Array(4);
			this.gl.readPixels(xu - 2, yu + 2, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, rgba);

			let object = undefined;
			let idxMolecule = rgba[3];
			if (idxMolecule > 0) {
				let idxAtom = rgba[2] | (rgba[1] << 8) | (rgba[0] << 16);
				object = objects[idxAtom];
			}

			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
			// set back the clear color
			this.gl.clearColor(cs[0], cs[1], cs[2], cs[3]);
			return object;
		}
		return undefined;
	};
	_.center = function() {
		let p = new structures.Atom();
		let n = this.molecules.length;
		for ( let k = 0, kk = n; k < kk; k++) {
			let m = this.molecules[k];
			p.add3D(m.getCenter3D());
		}
		p.x /= n;
		p.y /= n;
		p.z /= n;
		this.contentCenter = [-p.x, -p.y, -p.z];
	};
	_.isSupportDeferred = function() {
		return this.gl.textureFloatExt && this.gl.depthTextureExt;
	};
	_.create = function(id, width, height) {
		_super.create.call(this, id, width, height);
		// setup gl object
		try {
			let canvas = document.getElementById(this.id);
			this.gl = canvas.getContext('webgl', {preserveDrawingBuffer: c._Canvas3D.PRESERVE_DRAWING_BUFFER});
			if (!this.gl) {
				this.gl = canvas.getContext('experimental-webgl');
			}
		} catch (e) {
		}
		if (this.gl) {
		
			if (this.pixelRatio !== 1 && this.gl.canvas.width === this.width) {
				this.gl.canvas.style.width = this.width + 'px';
				this.gl.canvas.style.height = this.height + 'px';
				this.gl.canvas.width = this.width * this.pixelRatio;
				this.gl.canvas.height = this.height * this.pixelRatio;
			}

			this.gl.enable(this.gl.DEPTH_TEST);
			this.gl.depthFunc(this.gl.LEQUAL);
			this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
			this.gl.clearDepth(1.0);

			// size of texture for render depth map from light view
			this.shadowTextureSize = 1024;
			// setup matrices
			this.rotationMatrix = m4.identity([]);
			this.contentCenter = [0,0,0];
			// set up camera
			this.camera = new d3.Camera();

			this.label3D = new d3.Label();

			this.lighting = new d3.Light(this.styles.lightDiffuseColor_3D, this.styles.lightSpecularColor_3D, this.styles.lightDirection_3D);
			
			this.fogging = new d3.Fog(this.styles.fog_color_3D || this.styles.backgroundColor, this.styles.fog_start_3D, this.styles.fog_end_3D, this.styles.fog_density_3D);
			
			
			// uncomment this line to see shadow without depth texture extension
			this.gl.depthTextureExt = this.gl.getExtension('WEBGL_depth_texture') || this.gl.getExtension('WEBKIT_WEBGL_depth_texture') || this.gl.getExtension('MOZ_WEBGL_depth_texture');
			this.gl.textureFloatExt = this.gl.getExtension('OES_texture_float') || this.gl.getExtension('WEBKIT_OES_texture_float') || this.gl.getExtension('MOZ_OES_texture_float');
			// this.gl.shaderTextureLodExt = this.gl.getExtension('EXT_shader_texture_lod') || this.gl.getExtension('WEBKIT_EXT_shader_texture_lod') || this.gl.getExtension('MOZ_EXT_shader_texture_lod');
			// this.gl.drawBuffersExt = this.gl.getExtension('WEBGL_draw_buffers');

			this.ssao = new d3.SSAO();

			// set picker color attachment
			this.pickerColorTexture = new d3.Texture();
			this.pickerColorTexture.init(this.gl, this.gl.UNSIGNED_BYTE, this.gl.RGBA, this.gl.RGBA);

			// set picker depth attachment 
			this.pickerDepthRenderbuffer = new d3.Renderbuffer();
			this.pickerDepthRenderbuffer.init(this.gl, this.gl.DEPTH_COMPONENT16);

			// set picker framebuffer
			this.pickerFramebuffer = new d3.Framebuffer();
			this.pickerFramebuffer.init(this.gl);
			this.pickerFramebuffer.setColorTexture(this.gl, this.pickerColorTexture.texture);
			this.pickerFramebuffer.setDepthRenderbuffer(this.gl, this.pickerDepthRenderbuffer.renderbuffer);

			// depth map for shadowing
			this.lightDepthMapTexture = new d3.Texture();
			this.lightDepthMapRenderbuffer = new d3.Renderbuffer();
			this.lightDepthMapFramebuffer = new d3.Framebuffer();
			this.lightDepthMapFramebuffer.init(this.gl);
			
			if(this.gl.depthTextureExt) {
				this.lightDepthMapTexture.init(this.gl, this.gl.UNSIGNED_SHORT, this.gl.DEPTH_COMPONENT);
				this.lightDepthMapRenderbuffer.init(this.gl, this.gl.RGBA4);
				this.lightDepthMapFramebuffer.setColorRenderbuffer(this.gl, this.lightDepthMapRenderbuffer.renderbuffer);
				this.lightDepthMapFramebuffer.setDepthTexture(this.gl, this.lightDepthMapTexture.texture);
			} else {
				this.lightDepthMapTexture.init(this.gl, this.gl.UNSIGNED_BYTE, this.gl.RGBA, this.gl.RGBA);
				this.lightDepthMapRenderbuffer.init(this.gl, this.gl.DEPTH_COMPONENT16);
				this.lightDepthMapFramebuffer.setColorTexture(this.gl, this.lightDepthMapTexture.texture);
				this.lightDepthMapFramebuffer.setDepthRenderbuffer(this.gl, this.lightDepthMapRenderbuffer.renderbuffer);
			}

			// deferred shading textures, renderbuffers, framebuffers and shaders
			if(this.isSupportDeferred()) {
				// g-buffer
				this.depthTexture = new d3.Texture();
				this.depthTexture.init(this.gl, this.gl.UNSIGNED_SHORT, this.gl.DEPTH_COMPONENT);

				this.colorTexture = new d3.Texture();
				this.colorTexture.init(this.gl, this.gl.UNSIGNED_BYTE, this.gl.RGBA);

				this.positionTexture = new d3.Texture();
				this.positionTexture.init(this.gl, this.gl.FLOAT, this.gl.RGBA);

				this.normalTexture = new d3.Texture();
				this.normalTexture.init(this.gl, this.gl.FLOAT, this.gl.RGBA);

				// postprocesing effect
				// ssao
				this.ssaoTexture = new d3.Texture();
				this.ssaoTexture.init(this.gl, this.gl.FLOAT, this.gl.RGBA);

				// outline
				this.outlineTexture = new d3.Texture();
				this.outlineTexture.init(this.gl, this.gl.UNSIGNED_BYTE, this.gl.RGBA);

				this.fxaaTexture = new d3.Texture();
				this.fxaaTexture.init(this.gl, this.gl.FLOAT, this.gl.RGBA);

				// temp texture
				this.imageTexture = new d3.Texture();
				this.imageTexture.init(this.gl, this.gl.FLOAT, this.gl.RGBA);

				// framebuffer
				this.colorFramebuffer = new d3.Framebuffer();
				this.colorFramebuffer.init(this.gl);
				this.colorFramebuffer.setColorTexture(this.gl, this.colorTexture.texture);
				this.colorFramebuffer.setDepthTexture(this.gl, this.depthTexture.texture);

				this.normalFramebuffer = new d3.Framebuffer();
				this.normalFramebuffer.init(this.gl);
				this.normalFramebuffer.setColorTexture(this.gl, this.normalTexture.texture);
				this.normalFramebuffer.setDepthTexture(this.gl, this.depthTexture.texture);

				this.positionFramebuffer = new d3.Framebuffer();
				this.positionFramebuffer.init(this.gl);
				this.positionFramebuffer.setColorTexture(this.gl, this.positionTexture.texture);
				this.positionFramebuffer.setDepthTexture(this.gl, this.depthTexture.texture);

				this.ssaoFramebuffer = new d3.Framebuffer();
				this.ssaoFramebuffer.init(this.gl);
				this.ssaoFramebuffer.setColorTexture(this.gl, this.ssaoTexture.texture);

				this.outlineFramebuffer = new d3.Framebuffer();
				this.outlineFramebuffer.init(this.gl);
				this.outlineFramebuffer.setColorTexture(this.gl, this.outlineTexture.texture);

				this.fxaaFramebuffer = new d3.Framebuffer();
				this.fxaaFramebuffer.init(this.gl);
				this.fxaaFramebuffer.setColorTexture(this.gl, this.fxaaTexture.texture);

				this.quadFramebuffer = new d3.Framebuffer();
				this.quadFramebuffer.init(this.gl);
				this.quadFramebuffer.setColorTexture(this.gl, this.imageTexture.texture);

				this.finalFramebuffer = new d3.Framebuffer();
				this.finalFramebuffer.init(this.gl);
				this.finalFramebuffer.setColorTexture(this.gl, this.fxaaTexture.texture);
				this.finalFramebuffer.setDepthTexture(this.gl, this.depthTexture.texture);

				this.normalShader = new d3.NormalShader();
				this.normalShader.init(this.gl);

				this.positionShader = new d3.PositionShader();
				this.positionShader.init(this.gl);

				if(d3.SSAOShader){
					this.ssaoShader = new d3.SSAOShader();
					this.ssaoShader.init(this.gl);
	
					this.ssaoBlurShader = new d3.SSAOBlurShader();
					this.ssaoBlurShader.init(this.gl);
				}

				this.outlineShader = new d3.OutlineShader();
				this.outlineShader.init(this.gl);

				this.lightingShader = new d3.LightingShader();
				this.lightingShader.init(this.gl);

				this.fxaaShader = new d3.FXAAShader();
				this.fxaaShader.init(this.gl);

				this.quadShader = new d3.QuadShader();
				this.quadShader.init(this.gl);
			}

			// this is the shaders
			this.labelShader = new d3.LabelShader();
			this.labelShader.init(this.gl);

			this.pickShader = new d3.PickShader();
			this.pickShader.init(this.gl);

			this.phongShader = new d3.PhongShader();
			this.phongShader.init(this.gl);

			if(d3.DepthShader){
				this.depthShader = new d3.DepthShader();
				this.depthShader.init(this.gl);
			}

			this.textTextImage = new d3.TextImage();
			this.textTextImage.init(this.gl);

			this.gl.textImage = new d3.TextImage();
			this.gl.textImage.init(this.gl);

			this.gl.textMesh = new d3.TextMesh();
			this.gl.textMesh.init(this.gl);

			// set up material
			this.gl.material = new d3.Material();

			this.setupScene();
		} else {
			this.displayMessage();
		}
	};
	_.displayMessage = function() {
		let canvas = document.getElementById(this.id);
		if (canvas.getContext) {
			let ctx = canvas.getContext('2d');
			if (this.styles.backgroundColor) {
				ctx.fillStyle = this.styles.backgroundColor;
				ctx.fillRect(0, 0, this.width, this.height);
			}
			if (this.emptyMessage) {
				ctx.fillStyle = '#737683';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.font = '18px Helvetica, Verdana, Arial, Sans-serif';
				ctx.fillText(this.emptyMessage, this.width / 2, this.height / 2);
			}
		}
	};
	_.renderText = function(text, position) {
		let vertexData = {
			position : [],
			texCoord : [],
			translation : []
		};
		this.textTextImage.pushVertexData(text, position, 0, vertexData);
		this.gl.textMesh.storeData(this.gl, vertexData.position, vertexData.texCoord, vertexData.translation);
		
		this.textTextImage.useTexture(this.gl);
		this.gl.textMesh.render(this.gl);
	};
	_.setupScene = function() {
		if (this.gl) {
			// clear the canvas
			// set background color for IE's sake, seems like an IE bug where half the repaints don't render a background
			let backgroundString = this.styles.backgroundColor?this.styles.backgroundColor:'transparent';
			document.getElementById(this.id).style.backgroundColor = backgroundString;
			let cs = backgroundString==='transparent'?[0.0,0.0,0.0,0.0]:math.getRGB(backgroundString, 1);
			this.gl.clearColor(cs[0], cs[1], cs[2], cs.length==4?cs[3]:1.0);
			this.styles.cullBackFace_3D ? this.gl.enable(this.gl.CULL_FACE) : this.gl.disable(this.gl.CULL_FACE);
			// here is the sphere buffer to be drawn, make it once, then scale
			// and translate to draw atoms
			this.gl.sphereBuffer = new d3.Sphere(1, this.styles.atoms_resolution_3D, this.styles.atoms_resolution_3D);
			this.gl.starBuffer = new d3.Star();
			this.gl.cylinderBuffer = new d3.Cylinder(1, 1, this.styles.bonds_resolution_3D);
			this.gl.cylinderClosedBuffer = new d3.Cylinder(1, 1, this.styles.bonds_resolution_3D, true);
			this.gl.boxBuffer = new d3.Box(1, 1, 1);
			this.gl.pillBuffer = new d3.Pill(this.styles.bonds_pillDiameter_3D / 2, this.styles.bonds_pillHeight_3D, this.styles.bonds_pillLatitudeResolution_3D, this.styles.bonds_pillLongitudeResolution_3D);
			this.gl.lineBuffer = new d3.Line();
			this.gl.lineArrowBuffer = new d3.LineArrow();
			this.gl.arrowBuffer = new d3.Arrow(0.3, this.styles.compass_resolution_3D);
			this.gl.quadBuffer = new d3.Quad();
			// texture for rendering text
			this.gl.textImage.updateFont(this.gl, this.styles.text_font_size, this.styles.text_font_families, this.styles.text_font_bold, this.styles.text_font_italic, this.styles.text_font_stroke_3D);
			// set up lighting
			this.lighting.lightScene(this.styles.lightDiffuseColor_3D, this.styles.lightSpecularColor_3D, this.styles.lightDirection_3D);
			// set up fogging
			this.fogging.fogScene(this.styles.fog_color_3D || this.styles.backgroundColor, this.styles.fog_start_3D, this.styles.fog_end_3D, this.styles.fog_density_3D);
			// set up compass
			this.compass = new d3.Compass(this.gl, this.styles);

			// set texture and renderbuffer parameter
			this.lightDepthMapTexture.setParameter(this.gl, this.shadowTextureSize, this.shadowTextureSize);
			this.lightDepthMapRenderbuffer.setParameter(this.gl, this.shadowTextureSize, this.shadowTextureSize);

			this.pickerColorTexture.setParameter(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
			this.pickerDepthRenderbuffer.setParameter(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
			
			if(this.isSupportDeferred()) {
				this.depthTexture.setParameter(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

				this.colorTexture.setParameter(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

				this.imageTexture.setParameter(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

				this.positionTexture.setParameter(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

				this.normalTexture.setParameter(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

				this.ssaoTexture.setParameter(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

				this.outlineTexture.setParameter(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

				this.fxaaTexture.setParameter(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

				// set SSAO parameter
				this.ssao.initSampleKernel(this.styles.ssao_kernel_samples);

				this.ssao.initNoiseTexture(this.gl);
			}

			this.camera.updateProjectionMatrix(this.styles.projectionPerspective_3D);

			for ( let k = 0, kk = this.molecules.length; k < kk; k++) {
				let mol = this.molecules[k];
				if (!(mol.labelMesh instanceof d3.TextMesh)) {
					mol.labelMesh = new d3.TextMesh();
					mol.labelMesh.init(this.gl);
				}
				if (mol.chains) {
					mol.ribbons = [];
					mol.cartoons = [];
					mol.tubes = [];
					mol.pipePlanks = [];
					// set up ribbon diagram if available and not already setup
					for ( let j = 0, jj = mol.chains.length; j < jj; j++) {
						let rs = mol.chains[j];
						for ( let i = 0, ii = rs.length - 1; i < ii; i++) {
							rs[i].Test =i;
						}
						let isNucleotide = rs.length > 3 && RESIDUE[rs[3].name] && RESIDUE[rs[3].name].aminoColor === '#BEA06E';
						if (rs.length > 0 && !rs[0].lineSegments) {
							for ( let i = 0, ii = rs.length - 1; i < ii; i++) {
								rs[i].setup(rs[i + 1].cp1, isNucleotide ? 1 : this.styles.proteins_horizontalResolution);
							}
							if (!isNucleotide) {
								for ( let i = 1, ii = rs.length - 1; i < ii; i++) {
									// reverse guide points if carbonyl
									// orientation flips
									if (extensions.vec3AngleFrom(rs[i - 1].D, rs[i].D) > m.PI / 2) {
										rs[i].guidePointsSmall.reverse();
										rs[i].guidePointsLarge.reverse();
										v3.scale(rs[i].D, -1);
									}
								}
							}
							for ( let i = 2, ii = rs.length - 3; i < ii; i++) {
								// compute line segments
								rs[i].computeLineSegments(rs[i - 2], rs[i - 1], rs[i + 1], !isNucleotide, isNucleotide ? this.styles.nucleics_verticalResolution : this.styles.proteins_verticalResolution);
							}
							// remove unneeded dummies
							rs.pop();
							rs.pop();
							rs.pop();
							rs.shift();
							rs.shift();
						}
						// create the hsl color for the chain
						let rgb = math.hsl2rgb(jj === 1 ? .5 : j / jj, 1, .5);
						let chainColor = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
						rs.chainColor = chainColor;
						if (isNucleotide) {
							let t = new d3.Tube(rs, this.styles.nucleics_tubeThickness, this.styles.nucleics_tubeResolution_3D);
							t.chainColor = chainColor;
							mol.tubes.push(t);
						} else {
							let t = new d3.PipePlank(rs, this.styles);
							mol.pipePlanks.push(t);
							let res = rs.shift();
							let r = {
								front : new d3.Ribbon(rs, this.styles.proteins_ribbonThickness, false),
								back : new d3.Ribbon(rs, -this.styles.proteins_ribbonThickness, false)
							};
							r.front.chainColor = chainColor;
							r.back.chainColor = chainColor;
							mol.ribbons.push(r);
							let d = {
								front : new d3.Ribbon(rs, this.styles.proteins_ribbonThickness, true),
								back : new d3.Ribbon(rs, -this.styles.proteins_ribbonThickness, true)
							};
							d.front.chainColor = chainColor;
							d.back.chainColor = chainColor;
							mol.cartoons.push(d);
							rs.unshift(res);
						}
					}
				}
			}
			this.label3D.updateVerticesBuffer(this.gl, this.getMolecules(), this.styles);
			// the molecules in frame of MovieCanvas3D must be handled
			if (this instanceof c.MovieCanvas3D && this.frames) {
				for ( let i = 0, ii = this.frames.length; i < ii; i++) {
					let f = this.frames[i];
					for ( let j = 0, jj = f.mols.length; j < jj; j++) {
						let mol = f.mols[j];
						if (!(mol.labelMesh instanceof structures.d3.TextMesh)) {
							mol.labelMesh = new structures.d3.TextMesh();
							mol.labelMesh.init(this.gl);
						}
					}
					this.label3D.updateVerticesBuffer(this.gl, f.mols, this.styles);
				}
			}
		}
	};
	_.updateScene = function() {
		this.camera.updateProjectionMatrix(this.styles.projectionPerspective_3D);

		this.lighting.lightScene(this.styles.lightDiffuseColor_3D, this.styles.lightSpecularColor_3D, this.styles.lightDirection_3D);
		
		this.fogging.fogScene(this.styles.fog_color_3D || this.styles.backgroundColor, this.styles.fog_start_3D, this.styles.fog_end_3D, this.styles.fog_density_3D);
		
		this.repaint();
	};
	_.mousedown = function(e) {
		this.lastPoint = e.p;
	};
	_.mouseup = function(e) {
		this.lastPoint = undefined;
	};
	_.rightmousedown = function(e) {
		this.lastPoint = e.p;
	};
	_.drag = function(e) {
		if(this.lastPoint){
			if (c.monitor.ALT) {
				let t = new structures.Point(e.p.x, e.p.y);
				t.sub(this.lastPoint);
				let theta = this.camera.fieldOfView / 360 * m.PI;
				let tanTheta = m.tan(theta);
				let topScreen = this.height / 2 / this.camera.zoom;
				let nearScreen = topScreen / tanTheta;
				let nearRatio = this.camera.focalLength() / nearScreen;
				m4.translate(this.camera.viewMatrix, [ t.x * nearRatio, -t.y * nearRatio, 0 ]);
			} else {
				let difx = e.p.x - this.lastPoint.x;
				let dify = e.p.y - this.lastPoint.y;
				let rotation = m4.rotate(m4.identity([]), difx * m.PI / 180.0, [ 0, 1, 0 ]);
				m4.rotate(rotation, dify * m.PI / 180.0, [ 1, 0, 0 ]);
				this.rotationMatrix = m4.multiply(rotation, this.rotationMatrix);
			}
			this.lastPoint = e.p;
			this.repaint();
		}
	};
	_.mousewheel = function(e, delta) {
    	delta > 0 ? this.camera.zoomIn() : this.camera.zoomOut();
		this.updateScene();
	};
	_.multitouchmove = function(e, numFingers) {
		if (numFingers === 2) {
			if (this.lastPoint && this.lastPoint.multi) {
				let t = new structures.Point(e.p.x, e.p.y);
				t.sub(this.lastPoint);
				let theta = this.camera.fieldOfView / 360 * m.PI;
				let tanTheta = m.tan(theta);
				let topScreen = this.height / 2 / this.camera.zoom;
				let nearScreen = topScreen / tanTheta;
				let nearRatio = this.camera.focalLength() / nearScreen;
				m4.translate(this.camera.viewMatrix, [ t.x * nearRatio, -t.y * nearRatio, 0 ]);
				this.lastPoint = e.p;
				this.repaint();
			} else {
				this.lastPoint = e.p;
				this.lastPoint.multi = true;
			}
		}
	};
	_.gesturechange = function(e) {
		if (e.scale - this.lastPinchScale !== 0) {
			//let minFov = 0.1;
			//let maxFov = 179.9;
			let dz = -(e.scale / this.lastPinchScale - 1) * 30;
			if(isNaN(dz)){
				// this seems to happen on Android when using multiple fingers
				return;
			}
    		dz > 0 ? this.camera.zoomOut() : this.camera.zoomIn();
			this.updateScene();
			this.lastPinchScale = e.scale;
		}
		this.repaint();
	};
	_.gestureend = function(e) {
		this.lastPinchScale = 1;
		this.lastGestureRotate = 0;
	};

})(ChemDoodle, ChemDoodle.extensions, ChemDoodle.math, ChemDoodle.structures, ChemDoodle.structures.d3, ChemDoodle.RESIDUE, Math, document, ChemDoodle.lib.mat4, ChemDoodle.lib.mat3, ChemDoodle.lib.vec3, window);

(function(c, iChemLabs, document, undefined) {
	'use strict';
	c.MolGrabberCanvas3D = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
		let sb = [];
		sb.push('<br><input type="text" id="');
		sb.push(id);
		sb.push('_query" size="32" value="" />');
		sb.push('<br><nobr>');
		sb.push('<select id="');
		sb.push(id);
		sb.push('_select">');
		// sb.push('<option value="chemexper">ChemExper');
		// sb.push('<option value="chemspider">ChemSpider');
		sb.push('<option value="pubchem" selected>PubChem');
		sb.push('</select>');
		sb.push('<button type="button" id="');
		sb.push(id);
		sb.push('_submit">Show Molecule</button>');
		sb.push('</nobr>');
		let canvas = document.getElementById(id);
		canvas.insertAdjacentHTML('afterend', sb.join(''));
		
		let self = this;
		document.getElementById(id + '_submit').addEventListener('click', function() {
				self.search();
		});
		document.getElementById(id + '_query').addEventListener('keypress', function(e) {
				if (e.key === 'Enter' || e.keyCode === 13) {
					self.search();
				}
		});
	};
	let _ = c.MolGrabberCanvas3D.prototype = new c._Canvas3D();
	_.setSearchTerm = function(term) {
		document.getElementById(this.id + '_query').value = term;
		this.search();
	};
	_.search = function() {
		let self = this;
		iChemLabs.getMoleculeFromDatabase(document.getElementById(this.id + '_query').value, {
			database : document.getElementById(this.id + '_select').value,
			dimension : 3
		}, function(mol) {
			self.loadMolecule(mol);
		});
	};

})(ChemDoodle, ChemDoodle.iChemLabs, document);
(function(c, structures, undefined) {
	'use strict';
	c.MovieCanvas3D = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
		this.frames = [];
	};
	c.MovieCanvas3D.PLAY_ONCE = 0;
	c.MovieCanvas3D.PLAY_LOOP = 1;
	c.MovieCanvas3D.PLAY_SPRING = 2;
	let _ = c.MovieCanvas3D.prototype = new c._Canvas3D();
	_.timeout = 50;
	_.frameNumber = 0;
	_.playMode = 2;
	_.reverse = false;
	_.startAnimation = c._AnimatorCanvas.prototype.startAnimation;
	_.stopAnimation = c._AnimatorCanvas.prototype.stopAnimation;
	_.isRunning = c._AnimatorCanvas.prototype.isRunning;
	_.dblclick = c.RotatorCanvas.prototype.dblclick;
	_.nextFrame = function(delta) {
		let f = this.frames[this.frameNumber];
		this.molecules = f.mols;
		this.shapes = f.shapes;
		if (this.playMode === 2 && this.reverse) {
			this.frameNumber--;
			if (this.frameNumber < 0) {
				this.frameNumber = 1;
				this.reverse = false;
			}
		} else {
			this.frameNumber++;
			if (this.frameNumber >= this.frames.length) {
				if (this.playMode === 2) {
					this.frameNumber -= 2;
					this.reverse = true;
				} else {
					this.frameNumber = 0;
					if (this.playMode === 0) {
						this.stopAnimation();
					}
				}
			}
		}
	};
	_.center = function() {
		// override this function to center the entire movie
		let p = new structures.Atom();
		let first = this.frames[0];
		for ( let j = 0, jj = first.mols.length; j < jj; j++) {
			p.add3D(first.mols[j].getCenter3D());
		}
		p.x /= first.mols.length;
		p.y /= first.mols.length;
		let center = new structures.Atom();
		center.sub3D(p);
		for ( let i = 0, ii = this.frames.length; i < ii; i++) {
			let f = this.frames[i];
			for ( let j = 0, jj = f.mols.length; j < jj; j++) {
				let mol = f.mols[j];
				for ( let k = 0, kk = mol.atoms.length; k < kk; k++) {
					mol.atoms[k].add3D(center);
				}
			}
		}
	};
	_.addFrame = function(molecules, shapes) {
		this.frames.push({
			mols : molecules,
			shapes : shapes
		});
	};

})(ChemDoodle, ChemDoodle.structures);

(function(c, m, m4, undefined) {
	'use strict';
	// keep these declaration outside the loop to avoid overhead
	let matrix = [];
	let xAxis = [ 1, 0, 0 ];
	let yAxis = [ 0, 1, 0 ];
	let zAxis = [ 0, 0, 1 ];

	c.RotatorCanvas3D = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	let _ = c.RotatorCanvas3D.prototype = new c._Canvas3D();
	_.timeout = 33;
	let increment = m.PI / 15;
	_.xIncrement = increment;
	_.yIncrement = increment;
	_.zIncrement = increment;
	_.startAnimation = c._AnimatorCanvas.prototype.startAnimation;
	_.stopAnimation = c._AnimatorCanvas.prototype.stopAnimation;
	_.isRunning = c._AnimatorCanvas.prototype.isRunning;
	_.dblclick = c.RotatorCanvas.prototype.dblclick;
	_.mousedown = undefined;
	_.rightmousedown = undefined;
	_.drag = undefined;
	_.mousewheel = undefined;
	_.nextFrame = function(delta) {
		if (this.molecules.length === 0 && this.shapes.length === 0) {
			this.stopAnimation();
			return;
		}
		m4.identity(matrix);
		let change = delta / 1000;
		m4.rotate(matrix, this.xIncrement * change, xAxis);
		m4.rotate(matrix, this.yIncrement * change, yAxis);
		m4.rotate(matrix, this.zIncrement * change, zAxis);
		m4.multiply(this.rotationMatrix, matrix);
	};

})(ChemDoodle, Math, ChemDoodle.lib.mat4);
(function(c, undefined) {
	'use strict';
	c.TransformCanvas3D = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	c.TransformCanvas3D.prototype = new c._Canvas3D();

})(ChemDoodle);
(function(c, undefined) {
	'use strict';
	c.ViewerCanvas3D = function(id, width, height) {
		if (id) {
			this.create(id, width, height);
		}
	};
	let _ = c.ViewerCanvas3D.prototype = new c._Canvas3D();
	_.mousedown = undefined;
	_.rightmousedown = undefined;
	_.drag = undefined;
	_.mousewheel = undefined;

})(ChemDoodle);

(function(c, extensions, math, document, undefined) {
	'use strict';
	function PeriodicCell(element, x, y, dimension) {
		this.element = element;
		this.x = x;
		this.y = y;
		this.dimension = dimension;
		this.allowMultipleSelections = false;
	}

	c.PeriodicTableCanvas = function(id, cellDimension) {
		this.padding = 5;
		if (id) {
			this.create(id, cellDimension * 18 + this.padding * 2, cellDimension * 10 + this.padding * 2);
		}
		this.cellDimension = cellDimension ? cellDimension : 20;
		this.setupTable();
		this.repaint();
	};
	let _ = c.PeriodicTableCanvas.prototype = new c._Canvas();
	_.loadMolecule = undefined;
	_.getMolecule = undefined;
	_.getHoveredElement = function() {
		if (this.hovered) {
			return this.hovered.element;
		}
		return undefined;
	};
	_.innerRepaint = function(ctx) {
		for ( let i = 0, ii = this.cells.length; i < ii; i++) {
			this.drawCell(ctx, this.styles, this.cells[i]);
		}
		if (this.hovered) {
			this.drawCell(ctx, this.styles, this.hovered);
		}
		if (this.selected) {
			this.drawCell(ctx, this.styles, this.selected);
		}
	};
	_.setupTable = function() {
		this.cells = [];
		let x = this.padding;
		let y = this.padding;
		let count = 0;
		for ( let i = 0, ii = c.SYMBOLS.length; i < ii; i++) {
			if (count === 18) {
				count = 0;
				y += this.cellDimension;
				x = this.padding;
			}
			let e = c.ELEMENT[c.SYMBOLS[i]];
			if (e.atomicNumber === 2) {
				x += 16 * this.cellDimension;
				count += 16;
			} else if (e.atomicNumber === 5 || e.atomicNumber === 13) {
				x += 10 * this.cellDimension;
				count += 10;
			}
			if ((e.atomicNumber < 58 || e.atomicNumber > 71 && e.atomicNumber < 90 || e.atomicNumber > 103) && e.atomicNumber <= 118) {
				this.cells.push(new PeriodicCell(e, x, y, this.cellDimension));
				x += this.cellDimension;
				count++;
			}
		}
		y += 2 * this.cellDimension;
		x = 3 * this.cellDimension + this.padding;
		for ( let i = 57; i < 104; i++) {
			let e = c.ELEMENT[c.SYMBOLS[i]];
			if (e.atomicNumber === 90) {
				y += this.cellDimension;
				x = 3 * this.cellDimension + this.padding;
			}
			if (e.atomicNumber >= 58 && e.atomicNumber <= 71 || e.atomicNumber >= 90 && e.atomicNumber <= 103) {
				this.cells.push(new PeriodicCell(e, x, y, this.cellDimension));
				x += this.cellDimension;
			}
		}
	};
	_.drawCell = function(ctx, styles, cell) {
		let radgrad = ctx.createRadialGradient(cell.x + cell.dimension / 3, cell.y + cell.dimension / 3, cell.dimension * 1.5, cell.x + cell.dimension / 3, cell.y + cell.dimension / 3, cell.dimension / 10);
		radgrad.addColorStop(0, '#000000');
		radgrad.addColorStop(.7, cell.element.jmolColor);
		radgrad.addColorStop(1, '#FFFFFF');
		ctx.fillStyle = radgrad;
		extensions.contextRoundRect(ctx, cell.x, cell.y, cell.dimension, cell.dimension, cell.dimension / 8);
		if (cell === this.hovered || cell === this.selected || cell.selected) {
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#c10000';
			ctx.stroke();
			ctx.fillStyle = 'white';
		}
		ctx.fill();
		ctx.font = extensions.getFontString(styles.text_font_size, styles.text_font_families);
		ctx.fillStyle = styles.text_color;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(cell.element.symbol, cell.x + cell.dimension / 2, cell.y + cell.dimension / 2);
	};
	_.click = function(e) {
		if (this.hovered) {
			if(this.allowMultipleSelections){
				this.hovered.selected = !this.hovered.selected;
			}else{
				this.selected = this.hovered;
			}
			this.repaint();
		}
	};
	_.touchstart = function(e){
		// try to hover an element
		this.mousemove(e);
	};
	_.mousemove = function(e) {
		let x = e.p.x;
		let y = e.p.y;
		this.hovered = undefined;
		for ( let i = 0, ii = this.cells.length; i < ii; i++) {
			let c = this.cells[i];
			if (math.isBetween(x, c.x, c.x + c.dimension) && math.isBetween(y, c.y, c.y + c.dimension)) {
				this.hovered = c;
				break;
			}
		}
		this.repaint();
	};
	_.mouseout = function(e) {
		this.hovered = undefined;
		this.repaint();
	};

})(ChemDoodle, ChemDoodle.extensions, ChemDoodle.math, document);

(function(c, io, document, window, undefined) {
	'use strict';
	io.png = {};

	io.png.string = function(canvas) {
		if(canvas instanceof c._Canvas3D && !canvas.gl.getContextAttributes().preserveDrawingBuffer){
			throw Error('PNG data cannot be created from a Canvas3D component unless the ChemDoodle._Canvas3D.PRESERVE_DRAWING_BUFFER boolean is set to true before the Canvas3D component is initialized.');
		}
		// this will not work for WebGL canvases in some browsers
		// to fix that you need to set the "preserveDrawingBuffer" to true when
		// creating the WebGL context
		// note that this will cause performance issues on some platforms and is
		// therefore not done by default
		return document.getElementById(canvas.id).toDataURL('image/png');
	};

	io.png.download = function(canvas, name) {
		if(name===undefined){
			 name = 'unnamed';
		}
		let a = document.createElement("a");
		a.href = this.string(canvas);
		a.download = name;
		a.click();
	};

	io.png.open = function(canvas) {
		let w = window.open();
		w.document.open();
	    w.document.write('<iframe src="' + this.string(canvas)  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
	    w.document.close();
	};

})(ChemDoodle, ChemDoodle.io, document, window);

(function(io, undefined) {
	'use strict';
	io.file = {};

	// this function will only work with files from the same origin it is being
	// called from, unless the receiving server supports XHR2
	io.file.content = function(url, callback) {
		fetch(url)
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.text();
		})
		.then(data => {
			callback(data);
		});
		//.catch(error => {
		//});
	};

})(ChemDoodle.io);

(function(c, iChemLabs, io, structures, location, undefined) {
	'use strict';
	iChemLabs.SERVER_URL = 'https://ichemlabs.cloud.chemdoodle.com/icl_cdc_v090000/WebHQ';

	iChemLabs.inRelay = false;

	iChemLabs.INFO = {
		userAgent : navigator.userAgent,
		platform : navigator.platform,
		v_cwc : c.getVersion(),
		// jQuery UI is not installed at this point, as it is linked after ChemDoodle.js, so this variable is set at that time (Sketcher-Package.js)
		v_jQuery : 'N/A',
		v_jQuery_ui : 'N/A'
	};

	let JSON_INTERPRETER = new io.JSONInterpreter();
	let queue = new structures.Queue();

	iChemLabs._contactServer = function(call, content, options, callback, errorback) {
	    if (this.inRelay) {
	        queue.enqueue({
	            'call' : call,
	            'content' : content,
	            'options' : options,
	            'callback' : callback,
	            'errorback' : errorback
	        });
	    } else {
	        iChemLabs.inRelay = true;
	        let isFormData = content instanceof FormData;
	        let jsonData = JSON.stringify({
	            'call' : call,
	            'content' : isFormData ? {} : content,
	            'options' : options,
	            'info' : ChemDoodle.iChemLabs.INFO
	        });
	        let data = jsonData;
	        if (isFormData) {
	            content.append('jsonData', JSON.stringify(jsonData));
	            data = content;
	        }
	        let fetchOptions = {
	            method: 'POST',
	            headers: {
	                'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
	                'X-Requested-With': 'XMLHttpRequest',
	            },
	            body: data,
	            credentials: 'include'
	        };
			if(isFormData){
				// Content-Type needs to be undeclared to be set by the browser for multipart/form-data
				delete fetchOptions.headers['Content-Type'];
			}
	
	        fetch(this.SERVER_URL, fetchOptions)
	            .then(response => {
	                if (!response.ok) {
	                    throw new Error('Network response was not ok');
	                }
	                return response.json();
	            })
	            .then(data => {
	                if (data.message) {
	                    alert(data.message);
	                }
	                iChemLabs.inRelay = false;
	                if (callback && data.content && !data.stop) {
	                    callback(data.content);
	                }
	                if (data.stop && errorback) {
	                    errorback();
	                }
	                if (!queue.isEmpty()) {
	                    let next = queue.dequeue();
	                    iChemLabs._contactServer(next.call, next.content, next.options, next.callback, next.errorback);
	                }
	            })
	            .catch(error => {
	                if (call !== 'checkForUpdates') {
	                    //alert('Call failed. Please try again. If you continue to see this message, please contact iChemLabs customer support.');
	                }
	                iChemLabs.inRelay = false;
	                if (errorback) {
	                    errorback();
	                }
	                if (!queue.isEmpty()) {
	                    let next = queue.dequeue();
	                    iChemLabs._contactServer(next.call, next.content, next.options, next.callback, next.errorback);
	                }
	            });
	    }
	};
	
	/*iChemLabs._contactServer = function(call, content, options, callback, errorback) {
	    if (this.inRelay) {
	        queue.enqueue({
	            'call' : call,
	            'content' : content,
	            'options' : options,
	            'callback' : callback,
	            'errorback' : errorback
	        });
	    } else {
	        iChemLabs.inRelay = true;
	        let isFormData = content instanceof FormData;
	        let jsonData = JSON.stringify({
	            'call' : call,
	            'content' : isFormData ? {} : content,
	            'options' : options,
	            'info' : ChemDoodle.iChemLabs.INFO
	        });
	        if (isFormData) {
	            content.append('jsonData', JSON.stringify(jsonData));
	        }
	        let data = isFormData ? content : jsonData;
	        let xhr = new XMLHttpRequest();
	        xhr.open('POST', this.SERVER_URL, true);
	        xhr.onreadystatechange = function() {
	            if (xhr.readyState === XMLHttpRequest.DONE) {
	                if (xhr.status === 200) {
	                    let o = JSON.parse(xhr.responseText);
	                    if (o.message) {
	                        alert(o.message);
	                    }
	                    iChemLabs.inRelay = false;
	                    if (callback && o.content && !o.stop) {
	                        callback(o.content);
	                    }
	                    if (o.stop && errorback) {
	                        errorback();
	                    }
	                    if (!queue.isEmpty()) {
	                        let next = queue.dequeue();
	                        iChemLabs._contactServer(next.call, next.content, next.options, next.callback, next.errorback);
	                    }
	                } else {
	                    if (call !== 'checkForUpdates') {
	                        //alert('Call failed. Please try again. If you continue to see this message, please contact iChemLabs customer support.');
	                    }
	                    iChemLabs.inRelay = false;
	                    if (errorback) {
	                        errorback();
	                    }
	                    if (!queue.isEmpty()) {
	                        let next = queue.dequeue();
	                        iChemLabs._contactServer(next.call, next.content, next.options, next.callback, next.errorback);
	                    }
	                }
	            }
	        };
	        xhr.withCredentials = true;
	        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	        if (isFormData) {
			    // These two properties are required for sending up multipart form data
			    // xhr.setRequestHeader('Content-Type', 'multipart/form-data');
			    xhr.send(content);
			} else {
			    xhr.setRequestHeader('Content-Type', 'application/json');
			    xhr.send(jsonData);
			}
	    }
	};*/

	// undocumented, this call is for clients that have licensed cloud for their
	// own servers
	iChemLabs.authenticate = function(credential, options, callback, errorback) {
		this._contactServer('authenticate', {
			'credential' : credential
		}, options, function(content) {
			callback(content);
		}, errorback);
	};

	iChemLabs.balanceReaction = function(toBeBalanced, options, callback, errorback) {
		let input = {};
		if(typeof(toBeBalanced) === 'string' || toBeBalanced instanceof String){
			input.equation = toBeBalanced;
		}else{
			input.reaction = JSON_INTERPRETER.contentTo(toBeBalanced.molecules, toBeBalanced.shapes);
		}
		this._contactServer('balanceReaction', input, options, function(content) {
			callback(content.result, content.message);
		}, errorback);
	};

	iChemLabs.calculate = function(mol, options, callback, errorback) {
		this._contactServer('calculate', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			callback(content);
		}, errorback);
	};

	iChemLabs.createLewisDotStructure = function(mol, options, callback, errorback) {
		this._contactServer('createLewisDot', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			callback(JSON_INTERPRETER.molFrom(content.mol));
		}, errorback);
	};
	
	iChemLabs.cir = function(formData, options, callback, errorback) {
    	this._contactServer('cir', formData, options, function(content) {
	        callback(JSON_INTERPRETER.contentFrom(content.data), content.preview);
	    }, errorback);
	};
	
	iChemLabs.elementalAnalysis = function(mol, options, callback, errorback) {
        this._contactServer('elementalAnalysis', {
            'mol' : new ChemDoodle.io.JSONInterpreter().molTo(mol)
        }, options, function(content) {
            callback(content);
        }, errorback);
    };
	
	iChemLabs.fileToImage = function(formData, options, callback, errorback) {
	   	this._contactServer('fileToImage', formData, options, function(content) {
	        callback(content.imgsrc, content.width, content.height);
	    }, errorback);
	};

	iChemLabs.generateImage = function(mol, options, callback, errorback) {
		this._contactServer('generateImage', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			callback(content.link);
		}, errorback);
	};

	iChemLabs.generateIUPACName = function(mol, options, callback, errorback) {
		this._contactServer('generateIUPACName', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			callback(content.iupac, content.attemptedPIN);
		}, errorback);
	};

	iChemLabs.getMoleculeFromContent = function(input, options, callback, errorback) {
		this._contactServer('getMoleculeFromContent', {
			'content' : input
		}, options, function(content) {
			let z = false;
			for ( let i = 0, ii = content.mol.a.length; i < ii; i++) {
				if (content.mol.a[i].z !== 0) {
					z = true;
					break;
				}
			}
			if (z) {
				for ( let i = 0, ii = content.mol.a.length; i < ii; i++) {
					content.mol.a[i].x /= 20;
					content.mol.a[i].y /= 20;
					content.mol.a[i].z /= 20;
				}
			}
			callback(JSON_INTERPRETER.molFrom(content.mol));
		}, errorback);
	};

	iChemLabs.getMoleculeFromDatabase = function(query, options, callback, errorback) {
		this._contactServer('getMoleculeFromDatabase', {
			'query' : query
		}, options, function(content) {
			if (options.dimension === 3) {
				for ( let i = 0, ii = content.mol.a.length; i < ii; i++) {
					content.mol.a[i].x /= 20;
					content.mol.a[i].y /= -20;
					content.mol.a[i].z /= 20;
				}
			}
			callback(JSON_INTERPRETER.molFrom(content.mol));
		}, errorback);
	};

	iChemLabs.getOptimizedPDBStructure = function(id, options, callback, errorback) {
		this._contactServer('getOptimizedPDBStructure', {
			'id' : id
		}, options, function(content) {
			let mol;
			if (content.mol) {
				mol = JSON_INTERPRETER.molFrom(content.mol);
			} else {
				mol = new structures.Molecule();
			}
			mol.chains = JSON_INTERPRETER.chainsFrom(content.ribbons);
			// adjust chain arrows for new desktop API
			for(let i = 0, ii = mol.chains.length; i<ii; i++){
				let c = mol.chains[i];
				for(let j = 0, jj = c.length-1; j<jj; j++){
					let r = c[j];
					if(c[j+1].arrow){
						c[j+1].arrow = false;
						c[j].arrow = true;
					}
				}
			}
			mol.fromJSON = true;
			callback(mol);
		}, errorback);
	};

	iChemLabs.getZeoliteFromIZA = function(query, options, callback, errorback) {
		this._contactServer('getZeoliteFromIZA', {
			'query' : query
		}, options, function(content) {
			callback(ChemDoodle.readCIF(content.cif, options.xSuper, options.ySuper, options.zSuper));
		}, errorback);
	};

	iChemLabs.isGraphIsomorphism = function(arrow, target, options, callback, errorback) {
		this._contactServer('isGraphIsomorphism', {
			'arrow' : JSON_INTERPRETER.molTo(arrow),
			'target' : JSON_INTERPRETER.molTo(target)
		}, options, function(content) {
			callback(content.value);
		}, errorback);
	};

	iChemLabs.isSubgraphIsomorphism = function(arrow, target, options, callback, errorback) {
		this._contactServer('isSubgraphIsomorphism', {
			'arrow' : JSON_INTERPRETER.molTo(arrow),
			'target' : JSON_INTERPRETER.molTo(target)
		}, options, function(content) {
			callback(content.value);
		}, errorback);
	};

	iChemLabs.isSupergraphIsomorphism = function(arrow, target, options, callback, errorback) {
		this._contactServer('isSupergraphIsomorphism', {
			'arrow' : JSON_INTERPRETER.molTo(arrow),
			'target' : JSON_INTERPRETER.molTo(target)
		}, options, function(content) {
			callback(content.value);
		}, errorback);
	};

	iChemLabs.getSimilarityMeasure = function(first, second, options, callback, errorback) {
		this._contactServer('getSimilarityMeasure', {
			'first' : JSON_INTERPRETER.molTo(first),
			'second' : JSON_INTERPRETER.molTo(second)
		}, options, function(content) {
			callback(content.value);
		}, errorback);
	};

	iChemLabs.kekulize = function(mol, options, callback, errorback) {
		this._contactServer('kekulize', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			callback(JSON_INTERPRETER.molFrom(content.mol));
		}, errorback);
	};

	iChemLabs.maximumCommonSubstructure = function(m1, m2, options, callback, errorback) {
		this._contactServer('maximumCommonSubstructure', {
			'm1' : JSON_INTERPRETER.molTo(m1),
			'm2' : JSON_INTERPRETER.molTo(m2)
		}, options, function(content) {
			callback(content.map);
		}, errorback);
	};
	
	iChemLabs.mechanismMatch = function(arrow, targets, options, callback, errorback) {
		this._contactServer('matchMechanism', {
			'arrow' : arrow,
			'targets' : targets
		}, options, function(content) {
			callback(content);
		}, errorback);
	};

	iChemLabs.optimize = function(mol, options, callback, errorback) {
		this._contactServer('optimize', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			let optimized = JSON_INTERPRETER.molFrom(content.mol);
			if (options.dimension === 2) {
				for ( let i = 0, ii = optimized.atoms.length; i < ii; i++) {
					mol.atoms[i].x = optimized.atoms[i].x;
					mol.atoms[i].y = optimized.atoms[i].y;
				}
				callback();
			} else if (options.dimension === 3) {
				for ( let i = 0, ii = optimized.atoms.length; i < ii; i++) {
					optimized.atoms[i].x /= 20;
					optimized.atoms[i].y /= -20;
					optimized.atoms[i].z /= 20;
				}
				callback(optimized);
			}
		}, errorback);
	};

	iChemLabs.readIUPACName = function(iupac, options, callback, errorback) {
		this._contactServer('readIUPACName', {
			'iupac' : iupac
		}, options, function(content) {
			let converted = [];
			for(let j = 0, jj=content.mols.length; j<jj; j++){
				converted.push(JSON_INTERPRETER.molFrom(content.mols[j]));
			}
			callback(converted, content.warning);
		}, errorback);
	};

	iChemLabs.readSMILES = function(smiles, options, callback, errorback) {
		this._contactServer('readSMILES', {
			'smiles' : smiles
		}, options, function(content) {
			callback(JSON_INTERPRETER.contentFrom(content.content));
		}, errorback);
	};

	iChemLabs.readWLN = function(wln, options, callback, errorback) {
		this._contactServer('readWLN', {
			'wln' : wln
		}, options, function(content) {
			callback(JSON_INTERPRETER.contentFrom(content.content));
		}, errorback);
	};

	iChemLabs.resolveCIP = function(mol, options, callback, errorback) {
		this._contactServer('resolveCIP', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			callback(content.atoms, content.bonds);
		}, errorback);
	};

	iChemLabs.saveFile = function(mol, options, callback, errorback) {
		this._contactServer('saveFile', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			callback(content.link);
		}, errorback);
	};

	iChemLabs.simulate13CNMR = function(mol, options, callback, errorback) {
		options.nucleus = 'C';
		options.isotope = 13;
		this._contactServer('simulateNMR', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			callback(c.readJCAMP(content.jcamp));
		}, errorback);
	};

	iChemLabs.simulate1HNMR = function(mol, options, callback, errorback) {
		options.nucleus = 'H';
		options.isotope = 1;
		this._contactServer('simulateNMR', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			callback(c.readJCAMP(content.jcamp));
		}, errorback);
	};

	iChemLabs.simulateMassParentPeak = function(mol, options, callback, errorback) {
		this._contactServer('simulateMassParentPeak', {
			'mol' : JSON_INTERPRETER.molTo(mol)
		}, options, function(content) {
			callback(c.readJCAMP(content.jcamp));
		}, errorback);
	};

	iChemLabs.stoichiometry = function(providedInformation, options, callback, errorback) {
		let input = {};
        if(typeof(providedInformation) === 'string' || providedInformation instanceof String){
            input.equation = providedInformation;
        }else if(providedInformation.molecules!==undefined){
            input.reaction = JSON_INTERPRETER.contentTo(providedInformation.molecules, providedInformation.shapes);
        }else if(providedInformation.table!==undefined){
            input.table = providedInformation.table;
        }
        this._contactServer('stoichiometry', input, options, function(content) {
            callback(content.table, content.message);
        }, errorback);
	};

	iChemLabs.writeSMILES = function(mols, shapes, options, callback, errorback) {
		this._contactServer('writeSMILES', {
			'content' : JSON_INTERPRETER.contentTo(mols, shapes)
		}, options, function(content) {
			callback(content.smiles);
		}, errorback);
	};

	iChemLabs.version = function(options, callback, errorback) {
		this._contactServer('version', {}, options, function(content) {
			callback(content.value);
		}, errorback);
	};

	iChemLabs.checkForUpdates = function(options) {
		this._contactServer('checkForUpdates', {
			'value' : location.href
		}, options, function(content) {}, function(){});
	};

})(ChemDoodle, ChemDoodle.iChemLabs, ChemDoodle.io, ChemDoodle.structures, location);

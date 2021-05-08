"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCurves = exports.loadRunes = void 0;
const fs = require("fs");
const path = require("path");
const util_1 = require("util");
/* FIXME FIXME FIXME
 *
 * This is done so we can share the webGLgraphics.js between webGLcurve.js and webGLrune.js
 *
 * ... because these libraries are written to be included as <script> tags,
 * which obviously doesn't adapt well to a NodeJS environment.
 */
function loadGraphicsLibrary(...filenames) {
    return __awaiter(this, void 0, void 0, function* () {
        const libraries = yield Promise.all(['webGLgraphics.js', ...filenames].map(filename => util_1.promisify(fs.readFile)(path.join(__dirname, 'graphics', filename), 'utf8')));
        const libFn = new Function('module', 'exports', 'require', libraries.join('\n\n'));
        const module = {
            exports: {}
        };
        libFn(module, module.exports, require);
        return module.exports;
    });
}
function loadRunes() {
    return loadGraphicsLibrary('webGLrune.js');
}
exports.loadRunes = loadRunes;
function loadCurves() {
    return loadGraphicsLibrary('webGLhi_graph_ce.js', 'webGLcurve.js');
}
exports.loadCurves = loadCurves;

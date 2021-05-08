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
exports.setupLambdaXvfb = void 0;
const util_1 = require("util");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const chmodAsync = util_1.promisify(fs_1.chmod);
const copyAsync = util_1.promisify(fs_1.copyFile);
const sleep = util_1.promisify(setTimeout);
const statAsync = util_1.promisify(fs_1.stat);
const IS_LAMBDA = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DISPLAY_NUMBER = '99';
function setupLambdaXvfb() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!IS_LAMBDA) {
            return null;
        }
        process.env.LIBGL_DRIVERS_PATH = '/opt/lib/dri';
        process.env.DISPLAY = `:${DISPLAY_NUMBER}`;
        if (yield x11Alive()) {
            return;
        }
        yield Promise.all([
            copyBinary('/opt/bin/xkbcomp', '/tmp/xkbcomp'),
            copyBinary('/opt/bin/Xvfb', '/tmp/Xvfb')
        ]);
        const xvfb = child_process_1.spawn('/tmp/Xvfb', [`:${DISPLAY_NUMBER}`, '-screen', '0', '1024x768x24', '-ac'], {
            stdio: 'ignore'
        });
        while (!(yield x11Alive())) {
            yield sleep(100);
        }
        if (xvfb.exitCode !== null) {
            throw new Error('xvfb exited early');
        }
        return;
    });
}
exports.setupLambdaXvfb = setupLambdaXvfb;
function x11Alive() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stat = yield statAsync(`/tmp/.X11-unix/X${DISPLAY_NUMBER}`);
            return stat.isSocket();
        }
        catch (_a) { }
        return false;
    });
}
function copyBinary(from, to) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield copyAsync(from, to);
            yield chmodAsync(to, 0o755);
        }
        catch (_a) { }
    });
}

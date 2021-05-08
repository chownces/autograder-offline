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
exports.run = exports.runAll = void 0;
const js_slang_1 = require("js-slang");
const stringify_1 = require("js-slang/dist/utils/stringify");
const createContext_1 = require("js-slang/dist/createContext");
const setupXvfb_1 = require("./setupXvfb");
const graphicsLoader_1 = require("./graphicsLoader");
const externals = {};
Object.assign(externals, require('./tree.js'));
const TIMEOUT_DURATION = process.env.TIMEOUT ? parseInt(process.env.TIMEOUT, 10) : 3000; // in milliseconds
/**
 * Runs all the unit tests provided by the @param event
 * @param event the AwsEvent from the Backend
 */
exports.runAll = (event) => __awaiter(void 0, void 0, void 0, function* () {
    if (event.library && event.library.external) {
        switch (event.library.external.name) {
            case 'RUNES': {
                yield setupXvfb_1.setupLambdaXvfb();
                Object.assign(externals, yield graphicsLoader_1.loadRunes());
                externals.getReadyWebGLForCanvas('3d');
                externals.getReadyStringifyForRunes(stringify_1.stringify);
                break;
            }
            case 'CURVES': {
                yield setupXvfb_1.setupLambdaXvfb();
                Object.assign(externals, yield graphicsLoader_1.loadCurves());
                externals.getReadyWebGLForCanvas('curve');
                break;
            }
        }
    }
    evaluateGlobals(event.library.globals);
    const promises = event.testcases.map((testcase) => exports.run({
        library: event.library,
        prependProgram: event.prependProgram || '',
        studentProgram: event.studentProgram,
        postpendProgram: event.postpendProgram || '',
        testcase: testcase
    }));
    const results = yield Promise.all(promises);
    const totalScore = results.reduce((total, result) => (result.resultType === 'pass' ? total + result.score : total), 0);
    return {
        totalScore: totalScore,
        results: results
    };
});
/**
 * Runs individual unit tests
 * @param unitTest the individual unit tests composed from runAll()
 */
exports.run = (unitTest) => __awaiter(void 0, void 0, void 0, function* () {
    const context = js_slang_1.createContext(unitTest.library.chapter, 'default', []);
    for (const name of unitTest.library.external.symbols) {
        createContext_1.defineSymbol(context, name, externals[name]);
    }
    // Run prepend
    const [prependResult, elevatedBase] = yield runInElevatedContext(context, () => catchTimeouts(js_slang_1.runInContext(unitTest.prependProgram, context, {
        executionMethod: 'native',
        originalMaxExecTime: TIMEOUT_DURATION
    })));
    if (prependResult.status !== 'finished') {
        return handleResult(prependResult, context, unitTest.prependProgram, 'prepend');
    }
    // Run student program
    const studentResult = yield catchTimeouts(js_slang_1.runInContext(unitTest.studentProgram, context, {
        executionMethod: 'native',
        originalMaxExecTime: TIMEOUT_DURATION
    }));
    if (studentResult.status !== 'finished') {
        return handleResult(studentResult, context, unitTest.studentProgram, 'student');
    }
    // Run postpend
    const [postpendResult] = yield runInElevatedContext(context, () => catchTimeouts(js_slang_1.runInContext(unitTest.postpendProgram, context, {
        executionMethod: 'native',
        originalMaxExecTime: TIMEOUT_DURATION
    })), elevatedBase);
    if (postpendResult.status !== 'finished') {
        return handleResult(postpendResult, context, unitTest.postpendProgram, 'postpend');
    }
    const [testcaseResult] = yield runInElevatedContext(context, () => catchTimeouts(js_slang_1.runInContext(unitTest.testcase.program, context, {
        executionMethod: 'native',
        originalMaxExecTime: TIMEOUT_DURATION
    })), elevatedBase);
    if (testcaseResult.status !== 'finished') {
        return handleResult(testcaseResult, context, unitTest.testcase.program, 'testcase');
    }
    const resultValue = stringify_1.stringify(testcaseResult.value);
    return resultValue === unitTest.testcase.answer
        ? {
            resultType: 'pass',
            score: unitTest.testcase.score
        }
        : {
            resultType: 'fail',
            expected: unitTest.testcase.answer,
            actual: resultValue
        };
});
/**
 * Given an array of pairs, where the first element is an identifier, and the
 * second is a string representation of a javascript value, evaluate the value
 * and bind it to the identifier, in the global frame. Used for Library.globals
 */
const evaluateGlobals = (nameValuePairs) => {
    for (const [name, value] of nameValuePairs) {
        ;
        (() => {
            externals[name] = eval(value);
        })();
    }
};
const slangDisplay = (value, str) => {
    console.log((str === undefined ? '' : str + ' ') + value.toString());
    return value;
};
function runInElevatedContext(context, fn, base) {
    return __awaiter(this, void 0, void 0, function* () {
        createContext_1.ensureGlobalEnvironmentExist(context);
        const originalChapter = context.chapter;
        const originalFrame = context.runtime.environments[0].head;
        const overrideFrame = base || Object.create(originalFrame);
        context.chapter = 4;
        context.runtime.environments[0].head = overrideFrame;
        if (!base) {
            createContext_1.importBuiltins(context, {
                rawDisplay: slangDisplay,
                prompt: slangDisplay,
                alert: slangDisplay,
                visualiseList: (v) => {
                    throw new Error('List visualizer is not enabled');
                }
            });
            for (const [name, value] of Object.entries(externals)) {
                if (!Object.prototype.hasOwnProperty.call(overrideFrame, name)) {
                    createContext_1.defineSymbol(context, name, value);
                }
            }
        }
        const result = yield Promise.resolve(fn());
        context.chapter = originalChapter;
        context.runtime.environments[0].head = originalFrame;
        return [result, overrideFrame];
    });
}
/**
 * Takes in the promise that js-slang's runInContext returns. Races it against a
 * timeout. Returns a @type{SourceResult} if the former resolves first,
 * otherwise a @type{TimeoutResult}.
 */
const catchTimeouts = (slangPromise) => {
    return Promise.race([slangPromise, timeout(TIMEOUT_DURATION)]);
};
const timeout = (msDuration) => new Promise(resolve => setTimeout(resolve, msDuration, { status: 'timeout' }));
const handleResult = (result, context, program, location) => {
    switch (result.status) {
        case 'error': {
            const errors = context.errors.map((err) => {
                switch (err.constructor.name) {
                    case 'PotentialInfiniteLoopError':
                    case 'PotentialInfiniteRecursionError':
                        return {
                            errorType: 'timeout'
                        };
                }
                const line = err.location.end.line > 0 ? err.location.end.line : err.location.start.line;
                if (line <= 0) {
                    return {
                        errorType: err.type.toLowerCase(),
                        line: 0,
                        location: 'unknown',
                        errorLine: '',
                        errorExplanation: err.explain()
                    };
                }
                const lines = program.split('\n');
                const errorLine = (lines[line - 1] || '(unknown)').trim();
                return {
                    errorType: err.type.toLowerCase(),
                    line,
                    location,
                    errorLine,
                    errorExplanation: err.explain()
                };
            });
            return {
                resultType: 'error',
                errors: errors
            };
        }
        case 'timeout':
            return {
                resultType: 'error',
                errors: [{ errorType: 'timeout' }]
            };
        default:
            return {
                resultType: 'error',
                errors: [
                    {
                        errorType: 'runtime',
                        line: 0,
                        location: 'unknown',
                        errorLine: '',
                        errorExplanation: `Unexpected result status ${result.status}`
                    }
                ]
            };
    }
};

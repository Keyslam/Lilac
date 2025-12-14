"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const pipe_port_1 = require("./pipe-port");
const test_discoverer_1 = require("./test-discoverer");
function activate(context) {
    const controller = vscode.tests.createTestController('lilac-tests', 'Lilac Tests');
    new test_discoverer_1.TestDiscoverer(controller, context).discoverAllTests();
    context.subscriptions.push(controller);
    controller.createRunProfile('Run Tests', vscode.TestRunProfileKind.Run, (request, token) => runTests(request, controller, token), true);
}
function runTests(request, controller, token) {
    const run = controller.createTestRun(request);
    let itemsToRun = [];
    if (request.include && request.include.length > 0) {
        itemsToRun = request.include.flatMap((item) => collectAllTests(item));
    }
    else {
        controller.items.forEach((item) => {
            itemsToRun.push(...collectAllTests(item));
        });
    }
    itemsToRun.forEach((test) => run.enqueued(test));
    const idsToRun = itemsToRun.map((test) => buildTestPrefix(test));
    launchTestRunner(idsToRun, controller, run, token);
}
function collectAllTests(item) {
    const tests = [item];
    item.children.forEach((child) => {
        tests.push(...collectAllTests(child));
    });
    return tests;
}
async function launchTestRunner(ids, controller, run, token) {
    const pipe = new pipe_port_1.PipePort('ProgressPipe', 'CommandPipe');
    const idToItem = new Map();
    controller.items.forEach((item) => {
        collectAllTests(item).forEach((t) => {
            idToItem.set(buildTestPrefix(t), t);
        });
    });
    const firstItem = idToItem.get(ids[0]);
    const lovePath = findLovePath(firstItem);
    pipe.on('ready', () => {
        for (const id of ids) {
            pipe.send({ type: 'ScheduleTest', id });
        }
        pipe.send({ type: 'StartSuite' });
    });
    pipe.on('message', (message) => {
        switch (message.type) {
            case 'SuiteStarted':
                break;
            case 'LeafTestStarted': {
                const item = idToItem.get(message.testId);
                if (item)
                    run.started(item);
                break;
            }
            case 'LeafTestCompleted': {
                const item = idToItem.get(message.testId);
                if (!item)
                    break;
                if (message.result === 'passed') {
                    run.passed(item, message.duration);
                }
                else if (message.result === 'skipped') {
                    run.skipped(item);
                }
                else {
                    run.failed(item, new vscode.TestMessage('Test failed'), message.duration);
                }
                break;
            }
            case 'CompositeTestStarted': {
                const item = idToItem.get(message.testId);
                if (item)
                    run.started(item);
                break;
            }
            case 'CompositeTestCompleted': {
                const item = idToItem.get(message.testId);
                if (item)
                    run.passed(item, message.duration);
                break;
            }
            case 'SuiteCompleted':
                run.end();
                pipe.close();
                break;
        }
    });
    token.onCancellationRequested(() => {
        pipe.close();
        run.end();
    });
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
    }
    const config = {
        type: 'lua-local',
        request: 'launch',
        name: 'Lilac Test Debugger',
        program: { command: 'love' },
        args: [lovePath, 'debug', 'interactive'],
    };
    const ok = await vscode.debug.startDebugging(folder, config);
    if (!ok)
        vscode.window.showErrorMessage('Failed to start the Lilac test runner.');
}
function buildTestPrefix(testItem) {
    const names = [];
    let current = testItem;
    while (current) {
        names.unshift(current.label);
        current = current.parent;
    }
    if (testItem && testItem.parent) {
        let root = testItem;
        while (root.parent) {
            root = root.parent;
        }
        if (root.uri) {
            const fileName = root.uri.path
                .split('/')
                .pop()
                .replace(/\.[^/.]+$/, '')
                .replace(/\./g, '-');
            names.unshift(`@${fileName}`);
        }
    }
    return 'Suite::' + names.join('::');
}
function findLovePath(item) {
    if (!item.uri)
        return undefined;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(item.uri);
    if (!workspaceFolder)
        return undefined;
    const current = vscode.Uri.joinPath(item.uri);
    const parts = current.path.split('/');
    // find nearest "src" folder
    const srcIndex = parts.lastIndexOf('src');
    if (srcIndex === -1)
        return undefined;
    // go up one directory from src
    const rootParts = parts.slice(0, srcIndex);
    const distPath = [...rootParts, 'dist'].join('/');
    // Now convert to relative path
    const distUri = vscode.Uri.joinPath(workspaceFolder.uri, distPath);
    return vscode.workspace.asRelativePath(distUri);
}
//# sourceMappingURL=extension.js.map
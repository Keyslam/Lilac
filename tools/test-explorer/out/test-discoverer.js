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
exports.TestDiscoverer = void 0;
const fs = __importStar(require("fs"));
const vscode = __importStar(require("vscode"));
class TestDiscoverer {
    controller;
    context;
    constructor(controller, context) {
        this.context = context;
        this.controller = controller;
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.spec.ts');
        watcher.onDidChange((uri) => this.loadTestsFromFile(uri));
        watcher.onDidCreate((uri) => this.loadTestsFromFile(uri));
        watcher.onDidDelete((uri) => this.controller.items.delete(uri.toString()));
        context.subscriptions.push(watcher);
    }
    async discoverAllTests() {
        const testFiles = await vscode.workspace.findFiles('**/*.spec.ts');
        for (const file of testFiles) {
            this.loadTestsFromFile(file);
        }
    }
    loadTestsFromFile(uri) {
        // Remove old test items for this file
        const existing = this.controller.items.get(uri.toString());
        if (existing) {
            this.controller.items.delete(uri.toString());
        }
        const testTree = this.parseTestFile(uri.fsPath);
        this.registerTests(uri, testTree);
    }
    parseTestFile(filePath) {
        if (!fs.existsSync(filePath))
            return [];
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split(/\r?\n/);
        const rootNodes = [];
        const stack = [];
        const getIndent = (line) => line.search(/\S|$/);
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            const lineRaw = lines[lineNumber];
            const line = lineRaw.trim();
            const match = line.match(/^(describe|it|skip)\(['"`](.+?)['"`],/);
            if (!match)
                continue;
            const type = match[1];
            const label = match[2];
            const node = {
                label,
                file: filePath,
                line: lineNumber,
                children: [],
                skipped: type === 'skip',
            };
            const indent = getIndent(lineRaw);
            while (stack.length && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }
            if (stack.length === 0) {
                rootNodes.push(node);
            }
            else {
                stack[stack.length - 1].node.children.push(node);
            }
            stack.push({ node, indent });
        }
        return rootNodes;
    }
    registerTests(uri, nodes, parent) {
        for (const node of nodes) {
            const id = `${uri.toString()}:${node.label}`;
            const testItem = this.controller.createTestItem(id, node.label, uri);
            // Set range so Test Explorer opens the file at the correct line
            const start = new vscode.Position(node.line, 0);
            const end = new vscode.Position(node.line, Number.MAX_SAFE_INTEGER);
            testItem.range = new vscode.Range(start, end);
            if (parent) {
                parent.children.add(testItem);
            }
            else {
                this.controller.items.add(testItem);
            }
            if (node.children.length) {
                this.registerTests(uri, node.children, testItem);
            }
        }
    }
}
exports.TestDiscoverer = TestDiscoverer;
//# sourceMappingURL=test-discoverer.js.map
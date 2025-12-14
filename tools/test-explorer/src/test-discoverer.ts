import * as fs from 'fs';
import * as vscode from 'vscode';

interface TestNode {
    label: string;
    file: string;
    line: number;
    children: TestNode[];
    skipped?: boolean;
}

export class TestDiscoverer {
    private controller: vscode.TestController;
    private context: vscode.ExtensionContext;

    constructor(controller: vscode.TestController, context: vscode.ExtensionContext) {
        this.context = context;
        this.controller = controller;

        const watcher = vscode.workspace.createFileSystemWatcher('**/*.spec.ts');
        watcher.onDidChange((uri) => this.loadTestsFromFile(uri));
        watcher.onDidCreate((uri) => this.loadTestsFromFile(uri));
        watcher.onDidDelete((uri) => this.controller.items.delete(uri.toString()));

        context.subscriptions.push(watcher);
    }

    public async discoverAllTests() {
        const testFiles = await vscode.workspace.findFiles('**/*.spec.ts');
        for (const file of testFiles) {
            this.loadTestsFromFile(file);
        }
    }

    private loadTestsFromFile(uri: vscode.Uri) {
        // Remove old test items for this file
        const existing = this.controller.items.get(uri.toString());
        if (existing) {
            this.controller.items.delete(uri.toString());
        }

        const testTree = this.parseTestFile(uri.fsPath);
        this.registerTests(uri, testTree);
    }

    private parseTestFile(filePath: string): TestNode[] {
        if (!fs.existsSync(filePath)) return [];

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split(/\r?\n/);

        const rootNodes: TestNode[] = [];
        const stack: { node: TestNode; indent: number }[] = [];

        const getIndent = (line: string) => line.search(/\S|$/);

        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            const lineRaw = lines[lineNumber];
            const line = lineRaw.trim();
            const match = line.match(/^(describe|it|skip)\(['"`](.+?)['"`],/);
            if (!match) continue;

            const type = match[1];
            const label = match[2];

            const node: TestNode = {
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
            } else {
                stack[stack.length - 1].node.children.push(node);
            }

            stack.push({ node, indent });
        }

        return rootNodes;
    }

    private registerTests(uri: vscode.Uri, nodes: TestNode[], parent?: vscode.TestItem) {
        for (const node of nodes) {
            const id = `${uri.toString()}:${node.label}`;
            const testItem = this.controller.createTestItem(id, node.label, uri);

            // Set range so Test Explorer opens the file at the correct line
            const start = new vscode.Position(node.line, 0);
            const end = new vscode.Position(node.line, Number.MAX_SAFE_INTEGER);
            testItem.range = new vscode.Range(start, end);

            if (parent) {
                parent.children.add(testItem);
            } else {
                this.controller.items.add(testItem);
            }

            if (node.children.length) {
                this.registerTests(uri, node.children, testItem);
            }
        }
    }
}

import * as vscode from 'vscode';
import { IncomingMessage, PipePort } from './pipe-port';
import { TestDiscoverer } from './test-discoverer';

export function activate(context: vscode.ExtensionContext) {
    const controller = vscode.tests.createTestController('lilac-tests', 'Lilac Tests');
    new TestDiscoverer(controller, context).discoverAllTests();

    context.subscriptions.push(controller);

    controller.createRunProfile(
        'Run Tests',
        vscode.TestRunProfileKind.Run,
        (request, token) => runTests(request, controller, token),
        true
    );
}

function runTests(request: vscode.TestRunRequest, controller: vscode.TestController, token: vscode.CancellationToken) {
    const run = controller.createTestRun(request);

    let itemsToRun: vscode.TestItem[] = [];

    if (request.include && request.include.length > 0) {
        itemsToRun = request.include.flatMap((item) => collectAllTests(item));
    } else {
        controller.items.forEach((item) => {
            itemsToRun.push(...collectAllTests(item));
        });
    }

    itemsToRun.forEach((test) => run.enqueued(test));

    const idsToRun = itemsToRun.map((test) => buildTestPrefix(test));

    launchTestRunner(idsToRun, controller, run, token);
}

function collectAllTests(item: vscode.TestItem): vscode.TestItem[] {
    const tests: vscode.TestItem[] = [item];
    item.children.forEach((child) => {
        tests.push(...collectAllTests(child));
    });
    return tests;
}

async function launchTestRunner(
    ids: string[],
    controller: vscode.TestController,
    run: vscode.TestRun,
    token: vscode.CancellationToken
) {
    const pipe = new PipePort('ProgressPipe', 'CommandPipe');

    const idToItem = new Map<string, vscode.TestItem>();
    controller.items.forEach((item) => {
        collectAllTests(item).forEach((t) => {
            idToItem.set(buildTestPrefix(t), t);
        });
    });

    const firstItem = idToItem.get(ids[0])!;
    const lovePath = findLovePath(firstItem);

    pipe.on('ready', () => {
        for (const id of ids) {
            pipe.send({ type: 'ScheduleTest', id });
        }
        pipe.send({ type: 'StartSuite' });
    });

    pipe.on('message', (message: IncomingMessage) => {
        switch (message.type) {
            case 'SuiteStarted':
                break;

            case 'LeafTestStarted': {
                const item = idToItem.get(message.testId);
                if (item) run.started(item);
                break;
            }

            case 'LeafTestCompleted': {
                const item = idToItem.get(message.testId);
                if (!item) break;

                if (message.result === 'passed') {
                    run.passed(item, message.duration);
                } else if (message.result === 'skipped') {
                    run.skipped(item);
                } else {
                    run.failed(item, new vscode.TestMessage('Test failed'), message.duration);
                }
                break;
            }

            case 'CompositeTestStarted': {
                const item = idToItem.get(message.testId);
                if (item) run.started(item);
                break;
            }

            case 'CompositeTestCompleted': {
                const item = idToItem.get(message.testId);
                if (item) run.passed(item, message.duration);
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

    const config: vscode.DebugConfiguration = {
        type: 'lua-local',
        request: 'launch',
        name: 'Lilac Test Debugger',
        program: { command: 'love' },
        args: [lovePath, 'debug', 'interactive'],
    };

    const ok = await vscode.debug.startDebugging(folder, config);
    if (!ok) vscode.window.showErrorMessage('Failed to start the Lilac test runner.');
}

function buildTestPrefix(testItem: vscode.TestItem): string {
    const names: string[] = [];

    let current: vscode.TestItem | undefined = testItem;

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
                .pop()!
                .replace(/\.[^/.]+$/, '')
                .replace(/\./g, '-');
            names.unshift(`@${fileName}`);
        }
    }

    return 'Suite::' + names.join('::');
}

function findLovePath(item: vscode.TestItem): string | undefined {
    if (!item.uri) return undefined;

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(item.uri);
    if (!workspaceFolder) return undefined;

    const current = vscode.Uri.joinPath(item.uri);
    const parts = current.path.split('/');

    // find nearest "src" folder
    const srcIndex = parts.lastIndexOf('src');
    if (srcIndex === -1) return undefined;

    // go up one directory from src
    const rootParts = parts.slice(0, srcIndex);
    const distPath = [...rootParts, 'dist'].join('/');

    // Now convert to relative path
    const distUri = vscode.Uri.joinPath(workspaceFolder.uri, distPath);

    return vscode.workspace.asRelativePath(distUri);
}

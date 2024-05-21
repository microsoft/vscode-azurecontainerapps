import * as assert from 'assert';
import * as path from 'path';
import { workspace, type Uri, type WorkspaceFolder } from "vscode";

export function assertFlexibleDeepEqual(results: Record<string, string | undefined>, expectedResults: Record<string, string | RegExp>, errMsg?: string): void {
    assert.strictEqual(Object.keys(results).length, Object.keys(expectedResults).length, errMsg);

    for (const key in expectedResults) {
        const result: string | undefined = results[key];
        const expectedResult: string | RegExp | undefined = expectedResults[key];

        if (result && expectedResult instanceof RegExp) {
            assert.match(result, expectedResult, errMsg);
        } else {
            assert.strictEqual(result, expectedResult, errMsg);
        }
    }
}

export function getWorkspaceFolderUri(folderName: string): Uri {
    let workspaceFolderUri: Uri | undefined;

    const workspaceFolders: readonly WorkspaceFolder[] | undefined = workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace is open');
    } else {
        for (const workspaceFolder of workspaceFolders) {
            if (workspaceFolder.name === folderName) {
                workspaceFolderUri = workspaceFolder.uri;
                assert.strictEqual(path.basename(workspaceFolderUri.fsPath), folderName, 'Opened against an unexpected workspace.');
                return workspaceFolderUri;
            }
        }
    }

    throw new Error(`Unable to find workspace folder "${folderName}"`);
}

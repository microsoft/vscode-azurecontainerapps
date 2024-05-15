import * as assert from 'assert';
import * as path from 'path';
import { workspace, type Uri, type WorkspaceFolder } from "vscode";

export function getWorkspaceFolderUri(testFolderName: string): Uri {
    let workspaceFolderUri: Uri | undefined;

    const workspaceFolders: readonly WorkspaceFolder[] | undefined = workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error("No workspace is open");
    } else {
        for (const workspaceFolder of workspaceFolders) {
            if (workspaceFolder.name === testFolderName) {
                workspaceFolderUri = workspaceFolder.uri;
                assert.strictEqual(path.basename(workspaceFolderUri.fsPath), testFolderName, "Opened against an unexpected workspace.");
                return workspaceFolderUri;
            }
        }
    }

    throw new Error(`Unable to find workspace folder"${testFolderName}""`);
}

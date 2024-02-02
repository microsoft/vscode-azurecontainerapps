import { parseError } from "@microsoft/vscode-azext-utils";
import { exec } from "child_process";
import { ext } from "../../../../extensionVariables";

export async function executeCli(cliCommand: string): Promise<void> {
    try {
        await new Promise<void>((res, rej) => {
            exec(cliCommand, (e, stdout, stderr) => {
                if (e) {
                    const err = parseError(e);
                    ext.outputChannel.appendLog(err.message);
                    return rej();
                }

                if (stderr) {
                    const err = parseError(stderr);
                    ext.outputChannel.appendLog(err.message);
                    return rej();
                }

                ext.outputChannel.appendLog(stdout)
                return res();
            });
        });
    } catch {
        // Swallow
    }
}



import { exec } from "child_process";
import { ext } from "../../../../extensionVariables";

export async function executeCli(cliCommand: string): Promise<void> {
    try {
        await new Promise<void>((res, rej) => {
            exec(cliCommand, (e, stdout, stderr) => {
                if (e) {
                    return rej();
                }

                if (stderr) {
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



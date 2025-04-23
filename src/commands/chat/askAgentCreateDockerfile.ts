/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";
import * as vscode from 'vscode';
import { localize } from "../../utils/localize";

const createDockerfilePrompt: string = localize('createDockerfilePrompt', `
I need help scaffolding a Dockerfile for my project. Please do the following:

1. Inspect my workspace to infer as much information as possible about the project, such as:
   - Programming language (e.g. JavaScript, Python, Golang, etc.)
   - Framework (e.g. Express.js, Flask, etc.).
   - Runtime and runtime version.  Reference dependency management files like the package.json, requirements.txt, go.mod, etc.
    If you cannot find the file, ask me to provide the file as context.
   - Entry point file (e.g. app.js, main.py, etc.).
   - Dependencies or package manager (e.g. npm, pip, etc.).
   - Port the application listens on (e.g. 3000).
2. If any details cannot be inferred, or if important files cannot be found, ask for the missing information.
3. Generate a Dockerfile, use references to best practices when available.

Inspect my workspace and generate a completed Dockerfile based on this information?
`);

export async function askAgentCreateDockerfile(_: IActionContext): Promise<void> {
    await vscode.commands.executeCommand("workbench.action.chat.newChat");
    await vscode.commands.executeCommand("workbench.action.chat.open", { mode: 'agent', query: createDockerfilePrompt });
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import type * as types from '@microsoft/vscode-azext-utils';
import { type ViewPropertiesModel } from '@microsoft/vscode-azureresources-api';
import type * as vscodeTypes from 'vscode';
import { createPrimaryPromptForInputBox, createPrimaryPromptToGetPickManyQuickPickInput, createPrimaryPromptToGetSingleQuickPickInput, doCopilotInteraction } from './copilot';

export class CopilotUserInput implements types.IAzureUserInput {
    private readonly _vscode: typeof vscodeTypes;
    private readonly _onDidFinishPromptEmitter: vscodeTypes.EventEmitter<types.PromptResult>;
    private readonly _relevantContext: ViewPropertiesModel | undefined;

    constructor(vscode: typeof vscodeTypes, relevantContext?: ViewPropertiesModel) {
        this._vscode = vscode;
        this._onDidFinishPromptEmitter = new this._vscode.EventEmitter<types.PromptResult>();
        this._relevantContext = relevantContext;
    }
    showWarningMessage<T extends vscodeTypes.MessageItem>(): Promise<T> | Promise<T> {
        throw new Error('Method not implemented.');
    }
    showOpenDialog(): Promise<vscodeTypes.Uri[]> {
        throw new Error('Method not implemented.');
    }
    showWorkspaceFolderPick(): Promise<vscodeTypes.WorkspaceFolder> {
        throw new Error('Method not implemented.');
    }

    public async showInputBox(options: vscodeTypes.InputBoxOptions): Promise<string> {
        // if there is a default value use that one if not pass to copilot
        if (options.prompt) {
            const primaryPrompt: string = createPrimaryPromptForInputBox(options.prompt, this._relevantContext);
            const response = await doCopilotInteraction(primaryPrompt)
            const jsonResponse: string = JSON.parse(response) as string;
            this._onDidFinishPromptEmitter.fire({ value: jsonResponse });
            return jsonResponse;
        } else if (options.value) {
            this._onDidFinishPromptEmitter.fire({ value: options.value });
            return options.value;
        } else {
            throw new Error('No prompt or default value provided for input box'); // Todo: want to fall back to asking the user input but implement this later
        }
    }

    public get onDidFinishPrompt(): vscodeTypes.Event<types.PromptResult> {
        return this._onDidFinishPromptEmitter.event;
    }

    public async showQuickPick<T extends types.IAzureQuickPickItem<unknown>>(items: T[] | Thenable<T[]>, options: vscodeTypes.QuickPickOptions): Promise<T | T[]> {
        //get copilot to pick a pick
        let primaryPrompt: string;
        const resolvedItems: T[] = await Promise.resolve(items);
        const jsonItems: string[] = resolvedItems.map(item => JSON.stringify(item));

        if (options.canPickMany) {
            primaryPrompt = createPrimaryPromptToGetPickManyQuickPickInput(jsonItems, this._relevantContext);
        } else {
            primaryPrompt = createPrimaryPromptToGetSingleQuickPickInput(jsonItems, this._relevantContext);
        }
        const response = await doCopilotInteraction(primaryPrompt);
        const jsonResponse: T = JSON.parse(response) as T;

        const pick = resolvedItems.find(item => {
            try {
                return JSON.stringify(item) === JSON.stringify(jsonResponse);
            } catch {
                throw new Error('Invalid JSON response from Copilot');
            }
        });

        if (!pick) {
            throw new Error('No valid pick found in the response from Copilot'); //Todo: want to fall back to asking the user input but implement this later
        }

        this._onDidFinishPromptEmitter.fire({ value: pick });

        return pick;
    }
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { DOCKERFILE_GLOB_PATTERN } from "../../constants";
import { selectWorkspaceFile } from "../../utils/workspaceUtils";
import { IBuildImageContext } from "./IBuildImageContext";
import path = require("path");

export interface Item extends vscode.QuickPickItem {
    relativeFilePath: string;
    relativeFolderPath: string;
    absoluteFilePath: string;
    absoluteFolderPath: string;
}

export class DockerFileItemStep extends AzureWizardPromptStep<IBuildImageContext> {
    public async prompt(context: IBuildImageContext): Promise<void> {
        const selectedDockerFile = await selectWorkspaceFile(context, 'Select a Dockerfile', { filters: { 'Dockerfile': ['Dockerfile', 'Dockerfile.*'] } }, DOCKERFILE_GLOB_PATTERN);
        context.dockerFile = createFileItem(context.rootFolder, selectedDockerFile);
    }

    public shouldPrompt(context: IBuildImageContext): boolean {
        return !context.dockerFile;
    }
}

function createFileItem(rootFolder: vscode.WorkspaceFolder, selectedDockerFile: string): Item {
    const relativeFilePath = path.join(".", selectedDockerFile.substr(rootFolder.uri.fsPath.length));

    return <Item>{
        relativeFilePath: relativeFilePath,
        label: relativeFilePath,
        relativeFolderPath: path.dirname(relativeFilePath),
        absoluteFilePath: selectedDockerFile,
        absoluteFolderPath: rootFolder.uri.fsPath,
    };
}

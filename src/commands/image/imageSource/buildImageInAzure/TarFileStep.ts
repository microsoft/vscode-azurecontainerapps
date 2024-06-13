/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import * as os from 'os';
import * as path from "path";
import { type BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";

const idPrecision = 6;

export class TarFileStep extends AzureWizardExecuteStep<BuildImageInAzureImageSourceContext> {
    public priority: number = 420;

    public async execute(context: BuildImageInAzureImageSourceContext): Promise<void> {
        const id: number = Math.floor(Math.random() * Math.pow(10, idPrecision));
        const archive = `sourceArchive${id}.tar.gz`;
        context.tarFilePath = path.join(os.tmpdir(), archive);
    }

    public shouldExecute(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.tarFilePath;
    }
}

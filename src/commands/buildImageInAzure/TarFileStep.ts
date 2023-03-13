/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import * as os from 'os';
import { IBuildImageContext } from "./IBuildImageContext";
import path = require("path");

const idPrecision = 6;

export class TarFileStep extends AzureWizardExecuteStep<IBuildImageContext> {
    public priority: number = 150;

    public async execute(context: IBuildImageContext): Promise<void> {
        const id: number = Math.floor(Math.random() * Math.pow(10, idPrecision));
        const archive = `sourceArchive${id}.tar.gz`;
        context.tarFilePath = path.join(os.tmpdir(), archive);
    }

    public shouldExecute(context: IBuildImageContext): boolean {
        return !context.tarFilePath;
    }
}

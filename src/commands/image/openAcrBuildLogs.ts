/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Run as AcrRun } from '@azure/arm-containerregistry';
import { nonNullProp, openReadOnlyContent, type IActionContext } from "@microsoft/vscode-azext-utils";
import { localize } from '../../utils/localize';

export interface AcrBuildResults {
    name: AcrRun['name'];
    runId: AcrRun['runId'];
    content: string;
}

export async function openAcrBuildLogs(_context: IActionContext, acrBuildResults: AcrBuildResults): Promise<void> {
    if (!acrBuildResults) {
        throw new Error(localize('noAcrBuildResults', 'No Azure Container Registry build results to display.'));
    }

    await openReadOnlyContent({ label: nonNullProp(acrBuildResults, 'name'), fullId: nonNullProp(acrBuildResults, 'runId') }, nonNullProp(acrBuildResults, 'content'), '.log');
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QuickPickItem } from "vscode";
import { uiUtils } from "vscode-azureextensionui";
import { createContainerRegistryClient } from "../../../utils/azureClients";
import { nonNullValue } from "../../../utils/nonNull";
import { IDeployImageContext } from "../IDeployImageContext";
import { RegistryRepositoriesListStepBase } from "../RegistryRepositoriesListBaseStep";

export class AcrRepositoriesListStep extends RegistryRepositoriesListStepBase {
    public async getPicks(context: IDeployImageContext): Promise<QuickPickItem[]> {
        const client = createContainerRegistryClient(context, nonNullValue(context.registry));
        const repositoryNames: string[] = await uiUtils.listAllIterator(client.listRepositoryNames);

        return repositoryNames.map((rn) => { return { label: rn } });
    }
}

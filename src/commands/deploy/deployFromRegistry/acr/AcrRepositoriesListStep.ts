/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { QuickPickItem } from "vscode";
import { createContainerRegistryClient } from "../../../../utils/azureClients";
import { nonNullValue } from "../../../../utils/nonNull";
import { IDeployFromRegistryContext } from "../IDeployFromRegistryContext";
import { RegistryRepositoriesListStepBase } from "../RegistryRepositoriesListBaseStep";

export class AcrRepositoriesListStep extends RegistryRepositoriesListStepBase {
    public async getPicks(context: IDeployFromRegistryContext): Promise<QuickPickItem[]> {
        const client = createContainerRegistryClient(context, nonNullValue(context.registry));
        const repositoryNames: string[] = await uiUtils.listAllIterator(client.listRepositoryNames());

        return repositoryNames.map((rn) => { return { label: rn } });
    }
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QuickPickItem } from "vscode";
import { createContainerRegistryClient } from "../../../utils/azureClients";
import { nonNullValue } from "../../../utils/nonNull";
import { IDeployImageContext } from "../IDeployImageContext";
import { RegistryRepositoriesListStepBase } from "../RegistryRepositoriesListBaseStep";

export class AcrRepositoriesListStep extends RegistryRepositoriesListStepBase {
    public async getPicks(context: IDeployImageContext): Promise<QuickPickItem[]> {
        const client = createContainerRegistryClient(nonNullValue(context.registry));
        const repositoryNames: string[] = []

        for await (const repository of client.listRepositoryNames()) {
            repositoryNames.push(repository);
        }

        return repositoryNames.map((rn) => { return { label: rn } });
    }
}

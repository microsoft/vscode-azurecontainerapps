/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ArtifactManifestProperties } from "@azure/container-registry";
import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { createContainerRegistryClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValue } from "../../utils/nonNull";
import { IContainerAppContext } from "../createContainerApp/IContainerAppContext";

export class RepositoryTagListStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        const client = createContainerRegistryClient(nonNullValue(context.registry));

        const placeHolder: string = localize('selectTag', 'Select a tag');
        const manifests: ArtifactManifestProperties[] = [];

        for await (const manifest of client.getRepository(nonNullProp(context, 'repositoryName')).listManifestProperties()) {
            manifests.push(manifest);
        }

        const picks = manifests[0].tags.map((t) => { { return { label: t } } });
        context.tag = (await context.ui.showQuickPick(picks, { placeHolder })).label;
    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.tag;
    }
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem, ContainerAppModel, getContainerEnvelopeWithSecrets } from "../../../tree/ContainerAppItem";
import { RevisionDraftItem } from "../../../tree/revisionManagement/RevisionDraftItem";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../../utils/updateContainerApp/updateContainerApp";
import type { IDeployRevisionDraftContext } from "./IDeployRevisionDraftContext";

export class DeployRevisionDraftStep extends AzureWizardExecuteStep<IDeployRevisionDraftContext> {
    public priority: number = 1450;

    public async execute(context: IDeployRevisionDraftContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);
        containerAppEnvelope.template = nonNullProp(context, 'template');

        let updating: string | undefined;
        let description: string | undefined;
        if (context.containerApp?.revisionsMode === KnownActiveRevisionsMode.Single) {
            updating = localize('creatingRevision', 'Updating container app...');
            description = localize('updating', 'Updating...');
        } else {
            updating = localize('creatingRevision', 'Creating revision...');
            description = updating;
        }

        progress.report({ message: updating });

        const id: string = containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? containerApp.id : `${containerApp.id}/${RevisionDraftItem.idSuffix}`;

        await ext.state.runWithTemporaryDescription(id, description, async () => {
            await updateContainerApp(context, context.subscription, containerAppEnvelope);
            const updatedContainerApp = await ContainerAppItem.Get(context, context.subscription, containerApp.resourceGroup, containerApp.name);

            if (containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
                // Display the name of the newly created revision when in multiple revisions mode
                context.activityTitle = localize('deployRevision', 'Deploy revision "{0}" to container app "{1}"', updatedContainerApp.latestRevisionName, containerApp.name);
            }
        });
    }

    public shouldExecute(context: IDeployRevisionDraftContext): boolean {
        return !!context.template;
    }
}

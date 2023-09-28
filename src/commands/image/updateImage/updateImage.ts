/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ExecuteActivityContext, IActionContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { webProvider } from "../../../constants";
import { ext } from "../../../extensionVariables";
import type { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { RevisionDraftItem } from "../../../tree/revisionManagement/RevisionDraftItem";
import { RevisionItem } from "../../../tree/revisionManagement/RevisionItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { pickRevision, pickRevisionDraft } from "../../../utils/pickItem/pickRevision";
import type { ImageSourceBaseContext } from "../imageSource/ImageSourceBaseContext";
import { ImageSourceListStep } from "../imageSource/ImageSourceListStep";
import { UpdateImageStep } from "./UpdateImageStep";
import { UpdateRegistryAndSecretsStep } from "./UpdateRegistryAndSecretsStep";

export type UpdateImageContext = ImageSourceBaseContext & ExecuteActivityContext;

export async function updateImage(context: IActionContext, node?: ContainerAppItem | RevisionItem): Promise<void> {
    let item: ContainerAppItem | RevisionItem | RevisionDraftItem | undefined = node;
    if (!item) {
        const containerAppItem: ContainerAppItem = await pickContainerApp(context);

        if (containerAppItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
            item = containerAppItem;
        } else {
            if (ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(containerAppItem)) {
                item = await pickRevisionDraft(context, containerAppItem);
            } else {
                item = await pickRevision(context, containerAppItem);
            }
        }
    }

    const { subscription, containerApp } = item;

    const wizardContext: UpdateImageContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        subscription,
        containerApp
    };

    const promptSteps: AzureWizardPromptStep<UpdateImageContext>[] = [
        new ImageSourceListStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<UpdateImageContext>[] = [
        new VerifyProvidersStep([webProvider]),
        new UpdateRegistryAndSecretsStep(),
        new UpdateImageStep(item)
    ];

    const wizard: AzureWizard<UpdateImageContext> = new AzureWizard(wizardContext, {
        title: localize('updateImage', 'Update image in container app "{0}" (draft)', containerApp.name),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    // information window pop-up, you just executed a draft command, click here to learn more info
}

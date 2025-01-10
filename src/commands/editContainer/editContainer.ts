/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../../tree/ContainerAppItem";
import { type ContainerItem } from "../../tree/containers/ContainerItem";
import { ContainersItem } from "../../tree/containers/ContainersItem";
import { createActivityContext } from "../../utils/activityUtils";
import { isAzdExtensionInstalled } from "../../utils/azdUtils";
import { getManagedEnvironmentFromContainerApp } from "../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { pickContainer } from "../../utils/pickItem/pickContainer";
import { getParentResourceFromItem, isTemplateItemEditable, TemplateItemNotEditableError } from "../../utils/revisionDraftUtils";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { RevisionDraftDeployPromptStep } from "../revisionDraft/RevisionDraftDeployPromptStep";
import { type ContainerEditContext } from "./ContainerEditContext";
import { ContainerEditDraftStep } from "./ContainerEditDraftStep";
import { ContainerEditStartingResourcesLogStep } from "./ContainerEditStartingResourcesLogStep";
import { RegistryAndSecretsUpdateStep } from "./RegistryAndSecretsUpdateStep";

export const editContainerCommandName: string = localize('editContainer', 'Edit Container...');

// Edits both the 'image' and 'environmentVariables' portion of the container profile (draft)
export async function editContainer(context: IActionContext, node?: ContainersItem | ContainerItem): Promise<void> {
    const item: ContainerItem | ContainersItem = node ?? await pickContainer(context, { autoSelectDraft: true });
    const { containerApp, subscription } = item;

    if (!isTemplateItemEditable(item)) {
        throw new TemplateItemNotEditableError(item);
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    let containersIdx: number;
    if (ContainersItem.isContainersItem(item)) {
        // The 'editContainer' command should only show up on a 'ContainersItem' when it only has one container, else the command would show up on the 'ContainerItem'
        containersIdx = 0;
    } else {
        containersIdx = item.containersIdx;
    }

    const wizardContext: ContainerEditContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(true),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx,
        isDraftCommand: true,
    };
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    if (isAzdExtensionInstalled()) {
        wizardContext.telemetry.properties.isAzdExtensionInstalled = 'true';
    }

    const wizard: AzureWizard<ContainerEditContext> = new AzureWizard(wizardContext, {
        title: localize('editContainer', 'Edit container profile for "{0}" (draft)', parentResource.name),
        promptSteps: [
            new ContainerEditStartingResourcesLogStep(),
            new ImageSourceListStep(),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<ContainerEditContext>(),
            new RegistryAndSecretsUpdateStep(),
            new ContainerEditDraftStep(item),
        ],
        showLoadingPrompt: true,
    });

    await wizard.prompt();
    await wizard.execute();
}

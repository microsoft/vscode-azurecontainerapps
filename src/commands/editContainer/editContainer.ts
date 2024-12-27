/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { activityInfoIcon, activitySuccessContext, AzureWizard, createSubscriptionContext, createUniversallyUniqueContextValue, GenericTreeItem, nonNullValue, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
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

    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(wizardContext);
    wizardContext.resourceGroup = nonNullValue(
        resourceGroups.find(rg => rg.name === item.containerApp.resourceGroup),
        localize('containerAppResourceGroup', 'Expected to find the container app\'s resource group.'),
    );

    // Log resource group
    wizardContext.activityChildren?.push(
        new GenericTreeItem(undefined, {
            contextValue: createUniversallyUniqueContextValue(['useExistingResourceGroupInfoItem', activitySuccessContext]),
            label: localize('useResourceGroup', 'Using resource group "{0}"', wizardContext.resourceGroup.name),
            iconPath: activityInfoIcon
        })
    );
    ext.outputChannel.appendLog(localize('usingResourceGroup', 'Using resource group "{0}".', wizardContext.resourceGroup.name));

    // Log container app
    wizardContext.activityChildren?.push(
        new GenericTreeItem(undefined, {
            contextValue: createUniversallyUniqueContextValue(['useExistingContainerAppInfoItem', activitySuccessContext]),
            label: localize('useContainerApp', 'Using container app "{0}"', wizardContext.containerApp?.name),
            iconPath: activityInfoIcon
        })
    );
    ext.outputChannel.appendLog(localize('usingContainerApp', 'Using container app "{0}".', wizardContext.containerApp?.name));

    await LocationListStep.setLocation(wizardContext, item.containerApp.location);

    const wizard: AzureWizard<ContainerEditContext> = new AzureWizard(wizardContext, {
        title: localize('editContainer', 'Edit container profile for "{0}" (draft)', parentResource.name),
        promptSteps: [
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

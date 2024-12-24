/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { activityInfoIcon, activitySuccessContext, AzureWizard, createSubscriptionContext, createUniversallyUniqueContextValue, GenericTreeItem, nonNullValue, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type ImageItem } from "../../../tree/containers/ImageItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { isAzdExtensionInstalled } from "../../../utils/azdUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickImage } from "../../../utils/pickItem/pickImage";
import { getParentResourceFromItem, isTemplateItemEditable, TemplateItemNotEditableError } from "../../../utils/revisionDraftUtils";
import { ImageSourceListStep } from "../../image/imageSource/ImageSourceListStep";
import { RevisionDraftDeployPromptStep } from "../../revisionDraft/RevisionDraftDeployPromptStep";
import { type ContainerEditContext } from "../ContainerEditContext";
import { RegistryAndSecretsUpdateStep } from "../RegistryAndSecretsUpdateStep";
import { ContainerImageEditDraftStep } from "./ContainerImageEditDraftStep";

export type ContainerEditUpdateContext = ContainerEditContext;

// Edits only the 'image' portion of the container profile
export async function editContainerImage(context: IActionContext, node?: ImageItem): Promise<void> {
    const item: ImageItem = node ?? await pickImage(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    if (!isTemplateItemEditable(item)) {
        throw new TemplateItemNotEditableError(item);
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    const wizardContext: ContainerEditUpdateContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(true),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx: item.containersIdx,
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

    const wizard: AzureWizard<ContainerEditUpdateContext> = new AzureWizard(wizardContext, {
        title: localize('editContainerImage', 'Edit container image for "{0}" (draft)', parentResource.name),
        promptSteps: [
            new ImageSourceListStep({ suppressEnvPrompt: true }),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<ContainerEditUpdateContext>(),
            new RegistryAndSecretsUpdateStep(),
            new ContainerImageEditDraftStep(item),
        ],
        showLoadingPrompt: true,
    });

    await wizard.prompt();
    await wizard.execute();
}

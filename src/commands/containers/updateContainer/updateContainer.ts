/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Container, type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type ContainerItem } from "../../../tree/containers/ContainerItem";
import { ContainersItem } from "../../../tree/containers/ContainersItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickContainer } from "../../../utils/pickItem/pickContainer";
import { getParentResourceFromItem } from "../../../utils/revisionDraftUtils";
import { ImageSourceListStep } from "../../image/imageSource/ImageSourceListStep";
import { RegistryAndSecretsUpdateStep } from "../updateContainerImage/RegistryAndSecretsUpdateStep";
import { type ContainerUpdateContext } from "./ContainerUpdateContext";
import { ContainerUpdateDraftStep } from "./ContainerUpdateDraftStep";

export async function updateContainer(context: IActionContext, node?: ContainersItem | ContainerItem): Promise<void> {
    const item: ContainerItem | ContainersItem = node ?? await pickContainer(context, { autoSelectDraft: true });
    const { containerApp, subscription } = item;

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    let container: Container | undefined;
    if (ContainersItem.isContainersItem(item)) {
        // The 'updateContainer' command should only show up on a 'ContainersItem' when it only has one container, else the command would show up on the 'ContainerItem'
        container = parentResource.template?.containers?.[0];
    } else {
        container = item.container;
    }

    const containersIdx: number = parentResource.template?.containers?.findIndex(c => c.image === container?.image) ?? -1;
    if (containersIdx === -1) {
        throw new Error(localize('couldNotFindContainer', 'Internal error: Could not locate the specified container for updating.'));
    }

    const wizardContext: ContainerUpdateContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(true),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx,
    };
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const wizard: AzureWizard<ContainerUpdateContext> = new AzureWizard(wizardContext, {
        title: localize('updateContainer', 'Update "{0}" container (draft)', parentResource.name),
        promptSteps: [
            new ImageSourceListStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<ContainerUpdateContext>(),
            new RegistryAndSecretsUpdateStep(),
            new ContainerUpdateDraftStep(item),
        ],
        showLoadingPrompt: true,
    });

    await wizard.prompt();
    await wizard.execute();
}

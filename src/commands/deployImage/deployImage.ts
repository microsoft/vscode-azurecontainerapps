/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, nonNullValueAndProp, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerItem } from "../../tree/containers/ContainerItem";
import { createActivityContext } from "../../utils/activityUtils";
import { isAzdExtensionInstalled } from "../../utils/azdUtils";
import { getManagedEnvironmentFromContainerApp } from "../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { ContainerAppOverwriteConfirmStep } from "../ContainerAppOverwriteConfirmStep";
import { showContainerAppNotification } from "../createContainerApp/showContainerAppNotification";
import { ContainerAppDeployStartingResourcesLogStep } from "../deployContainerApp/ContainerAppDeployStartingResourcesLogStep";
import { ContainerAppUpdateStep } from "../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { type ContainerRegistryImageSourceContext } from "../image/imageSource/containerRegistry/ContainerRegistryImageSourceContext";
import { type DeployImageContext } from "./DeployImageContext";

export async function deployImage(context: IActionContext & Partial<ContainerRegistryImageSourceContext>, node: ContainerItem): Promise<void> {
    const { subscription, containerApp } = node;
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    const wizardContext: DeployImageContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext({ withChildren: true }),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx: node.containersIdx,
        template: nonNullValueAndProp(getParentResource(containerApp, node.revision), 'template'),
    };

    if (isAzdExtensionInstalled()) {
        wizardContext.telemetry.properties.isAzdExtensionInstalled = 'true';
    }

    wizardContext.telemetry.properties.containersIdx = String(node.containersIdx ?? 0);
    wizardContext.telemetry.properties.basedOnLatestRevision = containerApp.latestRevisionName === node.revision.name ? 'true' : 'false';

    const parentResourceName: string = getParentResource(containerApp, node.revision).name ?? containerApp.name;
    const wizard = new AzureWizard<DeployImageContext>(wizardContext, {
        title: localize('deployImageTitle', 'Deploy image to "{0}"', parentResourceName),
        promptSteps: [
            new ContainerAppDeployStartingResourcesLogStep(),
            new ImageSourceListStep(),
            new ContainerAppOverwriteConfirmStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<DeployImageContext>(),
            new ContainerAppUpdateStep(),
        ],
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    if (!wizardContext.suppressNotification) {
        void showContainerAppNotification(containerApp, true /** isUpdate */);
    }
}

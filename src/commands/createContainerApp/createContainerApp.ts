/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, nonNullProp, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { createActivityContext } from "../../utils/activityUtils";
import { isAzdExtensionInstalled } from "../../utils/azdUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { pickEnvironment } from "../../utils/pickItem/pickEnvironment";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { type ContainerAppCreateContext } from "./ContainerAppCreateContext";
import { ContainerAppCreateStartingResourcesLogStep } from "./ContainerAppCreateStartingResourcesLogStep";
import { ContainerAppCreateStep } from "./ContainerAppCreateStep";
import { ContainerAppNameStep } from "./ContainerAppNameStep";
import { showContainerAppNotification } from "./showContainerAppNotification";

export async function createContainerApp(context: IActionContext, item?: ManagedEnvironmentItem): Promise<ContainerAppItem> {
    // If an incompatible tree item is passed, treat it as if no item was passed
    if (item && !ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        item = undefined;
    }

    item ??= await pickEnvironment(context);

    const wizardContext: ContainerAppCreateContext = {
        ...context,
        ...createSubscriptionContext(item.subscription),
        ...await createActivityContext({ withChildren: true }),
        subscription: item.subscription,
        managedEnvironment: item.managedEnvironment,
        imageSource: ImageSource.QuickstartImage,
    };

    if (isAzdExtensionInstalled()) {
        wizardContext.telemetry.properties.isAzdExtensionInstalled = 'true';
    }

    const wizard: AzureWizard<ContainerAppCreateContext> = new AzureWizard(wizardContext, {
        title: localize('createContainerApp', 'Create container app'),
        promptSteps: [
            new ContainerAppCreateStartingResourcesLogStep(item),
            new ContainerAppNameStep(),
            new ImageSourceListStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<ContainerAppCreateContext>(),
            new ContainerAppCreateStep(),
        ],
        showLoadingPrompt: true
    });
    await wizard.prompt();

    const newContainerAppName = nonNullProp(wizardContext, 'newContainerAppName');
    await ext.state.showCreatingChild(
        item.managedEnvironment.id,
        localize('creating', 'Creating "{0}"...', newContainerAppName),
        async () => {
            wizardContext.activityTitle = localize('createNamedContainerApp', 'Create container app "{0}"', newContainerAppName);
            await wizard.execute();
        }
    );

    const createdContainerApp = nonNullProp(wizardContext, 'containerApp');
    if (!wizardContext.suppressNotification) {
        void showContainerAppNotification(createdContainerApp);
    }

    return new ContainerAppItem(item.subscription, createdContainerApp);
}

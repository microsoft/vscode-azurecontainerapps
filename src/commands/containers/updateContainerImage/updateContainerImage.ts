/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, type ExecuteActivityContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type UpdateImageTelemetryProps as TelemetryProps } from "../../../telemetry/commandTelemetryProps";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type ImageItem } from "../../../tree/containers/ImageItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickImage } from "../../../utils/pickItem/pickImage";
import { getParentResourceFromItem } from "../../../utils/revisionDraftUtils";
import { type ImageSourceBaseContext } from "../../image/imageSource/ImageSourceContext";
import { ImageSourceListStep } from "../../image/imageSource/ImageSourceListStep";
import { ContainerImageUpdateDraftStep } from "./ContainerImageUpdateDraftStep";
import { RegistryAndSecretsUpdateStep } from "./RegistryAndSecretsUpdateStep";

export type ImageUpdateBaseContext = ImageSourceBaseContext & ExecuteActivityContext;
export type ImageUpdateContext = ImageUpdateBaseContext & SetTelemetryProps<TelemetryProps>;

export async function updateContainerImage(context: IActionContext, node?: ImageItem): Promise<void> {
    const item: ImageItem = node ?? await pickImage(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const wizardContext: ImageUpdateContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(true),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
    };
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);
    const wizard: AzureWizard<ImageUpdateContext> = new AzureWizard(wizardContext, {
        title: localize('updateImage', 'Update container image for "{0}" (draft)', parentResource.name),
        promptSteps: [
            new ImageSourceListStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<ImageUpdateContext>(),
            new RegistryAndSecretsUpdateStep(),
            new ContainerImageUpdateDraftStep(item),
        ],
        showLoadingPrompt: true,
    });

    await wizard.prompt();
    await wizard.execute();
}

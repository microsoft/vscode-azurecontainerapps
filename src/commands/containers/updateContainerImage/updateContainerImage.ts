/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, type AzureWizardExecuteStep, type AzureWizardPromptStep, type ExecuteActivityContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type UpdateImageTelemetryProps as TelemetryProps } from "../../../telemetry/commandTelemetryProps";
import { type ContainerAppItem, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type RevisionDraftItem } from "../../../tree/revisionManagement/RevisionDraftItem";
import { type RevisionItem } from "../../../tree/revisionManagement/RevisionItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { pickRevision, pickRevisionDraft } from "../../../utils/pickItem/pickRevision";
import { getParentResourceFromItem } from "../../../utils/revisionDraftUtils";
import { type ImageSourceBaseContext } from "../../image/imageSource/ImageSourceContext";
import { ImageSourceListStep } from "../../image/imageSource/ImageSourceListStep";
import { ContainerImageUpdateDraftStep } from "./ContainerImageUpdateDraftStep";
import { RegistryAndSecretsUpdateStep } from "./RegistryAndSecretsUpdateStep";

export type ImageUpdateBaseContext = ImageSourceBaseContext & ExecuteActivityContext;
export type ImageUpdateContext = ImageUpdateBaseContext & SetTelemetryProps<TelemetryProps>;

export async function updateContainerImage(context: IActionContext, node?: ContainerAppItem | RevisionItem): Promise<void> {
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
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    const wizardContext: ImageUpdateContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp
    };

    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const promptSteps: AzureWizardPromptStep<ImageUpdateContext>[] = [
        new ImageSourceListStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<ImageUpdateContext>[] = [
        getVerifyProvidersStep<ImageUpdateContext>(),
        new RegistryAndSecretsUpdateStep(),
        new ContainerImageUpdateDraftStep(item)
    ];

    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    const wizard: AzureWizard<ImageUpdateContext> = new AzureWizard(wizardContext, {
        title: localize('updateImage', 'Update container image for "{0}" (draft)', parentResource.name),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type ImageItem } from "../../../tree/containers/ImageItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickImage } from "../../../utils/pickItem/pickImage";
import { getParentResourceFromItem, isTemplateItemEditable, throwTemplateItemNotEditable } from "../../../utils/revisionDraftUtils";
import { ImageSourceListStep } from "../../image/imageSource/ImageSourceListStep";
import { RevisionDraftDeployPromptStep } from "../../revisionDraft/RevisionDraftDeployPromptStep";
import { type ContainerUpdateContext } from "../ContainerUpdateContext";
import { RegistryAndSecretsUpdateStep } from "../RegistryAndSecretsUpdateStep";
import { ContainerImageUpdateDraftStep } from "./ContainerImageUpdateDraftStep";

export type ContainerImageUpdateContext = ContainerUpdateContext;

// Updates only the 'image' portion of the container profile
export async function updateContainerImage(context: IActionContext, node?: ImageItem): Promise<void> {
    const item: ImageItem = node ?? await pickImage(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    if (!isTemplateItemEditable(item)) {
        throwTemplateItemNotEditable(item);
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    const wizardContext: ContainerImageUpdateContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(true),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx: item.containersIdx,
    };
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const wizard: AzureWizard<ContainerImageUpdateContext> = new AzureWizard(wizardContext, {
        title: localize('updateContainerImage', 'Update container image for "{0}" (draft)', parentResource.name),
        promptSteps: [
            new ImageSourceListStep({ suppressEnvPrompt: true }),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<ContainerImageUpdateContext>(),
            new RegistryAndSecretsUpdateStep(),
            new ContainerImageUpdateDraftStep(item),
        ],
        showLoadingPrompt: true,
    });

    await wizard.prompt();
    await wizard.execute();
}

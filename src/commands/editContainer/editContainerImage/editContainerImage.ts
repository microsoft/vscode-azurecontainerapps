/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
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
import { ContainerEditStartingResourcesLogStep } from "../ContainerEditStartingResourcesLogStep";
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
        ...await createActivityContext({ withChildren: true }),
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

    wizardContext.telemetry.properties.containersIdx = String(item.containersIdx ?? 0);
    wizardContext.telemetry.properties.basedOnLatestRevision = containerApp.latestRevisionName === item.revision.name ? 'true' : 'false';

    const wizard: AzureWizard<ContainerEditUpdateContext> = new AzureWizard(wizardContext, {
        title: localize('editContainerImage', 'Edit container image for "{0}" (draft)', parentResource.name),
        promptSteps: [
            new ContainerEditStartingResourcesLogStep(),
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

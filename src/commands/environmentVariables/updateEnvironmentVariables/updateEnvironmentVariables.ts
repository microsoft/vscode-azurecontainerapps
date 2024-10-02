/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type EnvironmentVariablesItem } from "../../../tree/containers/EnvironmentVariablesItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickEnvironmentVariables } from "../../../utils/pickItem/pickEnvironmentVariables";
import { getParentResourceFromItem } from "../../../utils/revisionDraftUtils";
import { EnvFileListStep } from "../../image/imageSource/EnvFileListStep";
import { type EnvironmentVariablesUpdateContext } from "./EnvironmentVariablesUpdateContext";
import { EnvironmentVariablesUpdateDraftStep } from "./EnvironmentVariablesUpdateDraftStep";

export async function updateEnvironmentVariables(context: IActionContext, node?: EnvironmentVariablesItem): Promise<void> {
    const item: EnvironmentVariablesItem = node ?? await pickEnvironmentVariables(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    const wizardContext: EnvironmentVariablesUpdateContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx: item.containersIdx,
    };
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const wizard: AzureWizard<EnvironmentVariablesUpdateContext> = new AzureWizard(wizardContext, {
        title: localize('updateEnvironmentVariables', 'Update environment variables for "{0}" (draft)', parentResource.name),
        promptSteps: [
            new EnvFileListStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<EnvironmentVariablesUpdateContext>(),
            new EnvironmentVariablesUpdateDraftStep(item),
        ],
        showLoadingPrompt: true,
    });

    await wizard.prompt();
    await wizard.execute();
}

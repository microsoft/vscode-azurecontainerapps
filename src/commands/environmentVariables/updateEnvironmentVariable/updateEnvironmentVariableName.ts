/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type EnvironmentVariableItem } from "../../../tree/containers/EnvironmentVariableItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickEnvironmentVariable } from "../../../utils/pickItem/pickEnvironmentVariables";
import { getParentResourceFromItem, isTemplateItemEditable, throwTemplateItemNotEditable } from "../../../utils/revisionDraftUtils";
import { EnvironmentVariableNameStep } from "../addEnvironmentVariable/EnvironmentVariableNameStep";
import { type EnvironmentVariableUpdateContext } from "./EnvironmentVariableUpdateContext";
import { EnvironmentVariableUpdateDraftStep } from "./EnvironmentVariableUpdateDraftStep";

export async function updateEnvironmentVariableName(context: IActionContext, node?: EnvironmentVariableItem): Promise<void> {
    const item: EnvironmentVariableItem = node ?? await pickEnvironmentVariable(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    if (!isTemplateItemEditable(item)) {
        throwTemplateItemNotEditable(item);
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    const wizardContext: EnvironmentVariableUpdateContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx: item.containersIdx,
        environmentVariable: item.envVariable,
    };
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const wizard: AzureWizard<EnvironmentVariableUpdateContext> = new AzureWizard(wizardContext, {
        title: localize('updateEnvironmentVariableTitle', 'Update environment variable name in "{0}" (draft)', parentResource.name),
        promptSteps: [
            new EnvironmentVariableNameStep(item),
        ],
        executeSteps: [
            getVerifyProvidersStep<EnvironmentVariableUpdateContext>(),
            new EnvironmentVariableUpdateDraftStep(item),
        ],
    });

    await wizard.prompt();
    wizardContext.activityTitle = localize('updateEnvironmentVariableActivityTitle', 'Update environment variable name to "{0}" in "{1}" (draft)', wizardContext.newEnvironmentVariableName, parentResource.name);
    await wizard.execute();
}

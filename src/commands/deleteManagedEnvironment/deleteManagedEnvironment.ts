/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, createSubscriptionContext, IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import type { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { createActivityContext } from "../../utils/activity/activityUtils";
import { localize } from "../../utils/localize";
import { pickEnvironment } from "../../utils/pickItem/pickEnvironment";
import { DeleteAllContainerAppsStep } from "../deleteContainerApp/DeleteAllContainerAppsStep";
import { DeleteEnvironmentConfirmationStep } from "./DeleteEnvironmentConfirmationStep";
import { DeleteManagedEnvironmentStep } from "./DeleteManagedEnvironmentStep";
import type { IDeleteManagedEnvironmentContext } from "./IDeleteManagedEnvironmentContext";

export async function deleteManagedEnvironment(context: IActionContext, node?: ManagedEnvironmentItem): Promise<void> {
    const { subscription, managedEnvironment } = node ?? await pickEnvironment(context, {
        title: localize('deleteContainerAppsEnvironment', 'Delete Container Apps Environment'),
    });

    const containerApps = await ContainerAppItem.List(context, subscription, managedEnvironment.id);
    const resourceGroupName = getResourceGroupFromId(managedEnvironment.id);

    const wizardContext: IDeleteManagedEnvironmentContext = {
        ...context,
        ...await createActivityContext(),
        subscription: createSubscriptionContext(subscription),
        resourceGroupName: resourceGroupName,
        managedEnvironmentName: managedEnvironment.name,
        containerAppNames: containerApps.map(ca => ca.name),
    };

    const wizard: AzureWizard<IDeleteManagedEnvironmentContext> = new AzureWizard(wizardContext, {
        title: localize('deleteManagedEnvironment', 'Delete container apps environment "{0}"', managedEnvironment.name),
        promptSteps: [new DeleteEnvironmentConfirmationStep()],
        executeSteps: [new DeleteAllContainerAppsStep(), new DeleteManagedEnvironmentStep()]
    });

    await wizard.prompt();

    await ext.state.showDeleting(managedEnvironment.id, async () => {
        await wizard.execute();
    });

    ext.branchDataProvider.refresh();
}

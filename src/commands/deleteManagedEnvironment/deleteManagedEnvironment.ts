/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createSubscriptionContext } from "../../tree/ContainerAppsBranchDataProvider";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { pickEnvironment } from "../../utils/pickEnvironment";
import { DeleteAllContainerAppsStep } from "../deleteContainerApp/DeleteAllContainerAppsStep";
import { DeleteEnvironmentConfirmationStep } from "./DeleteEnvironmentConfirmationStep";
import { DeleteManagedEnvironmentStep } from "./DeleteManagedEnvironmentStep";
import { IDeleteManagedEnvironmentWizardContext } from "./IDeleteManagedEnvironmentWizardContext";

export async function deleteManagedEnvironment(context: IActionContext & { suppressPrompt?: boolean }, node?: ManagedEnvironmentItem): Promise<void> {
    const { subscription, managedEnvironment } = node ?? await pickEnvironment(context);

    const containerApps = await ContainerAppItem.List(context, subscription, managedEnvironment.id);
    const resourceGroupName = getResourceGroupFromId(managedEnvironment.id);
    const deleteManagedEnvironment: string = localize('deleteManagedEnvironment', 'Delete Container Apps Environment "{0}"', managedEnvironment.name);

    const wizardContext: IDeleteManagedEnvironmentWizardContext = {
        activityTitle: deleteManagedEnvironment,
        containerAppNames: containerApps.map(ca => ca.name),
        managedEnvironmentName: managedEnvironment.name,
        resourceGroupName: resourceGroupName,
        subscription: createSubscriptionContext(subscription),
        ...context,
        ...(await createActivityContext())
    };

    const wizard: AzureWizard<IDeleteManagedEnvironmentWizardContext> = new AzureWizard(wizardContext, {
        promptSteps: [new DeleteEnvironmentConfirmationStep()],
        executeSteps: [new DeleteAllContainerAppsStep(), new DeleteManagedEnvironmentStep()]
    });

    if (!context.suppressPrompt) {
        await wizard.prompt();
    }

    await ext.state.runWithTemporaryDescription(managedEnvironment.id, localize('deleting', 'Deleting...'), async () => {
        await wizard.execute();
        ext.branchDataProvider.refresh();
    });
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { createActivityContext } from "../../../../utils/activity/activityUtils";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { type DeployWorkspaceProjectContext } from "../../DeployWorkspaceProjectContext";
import { type DeployWorkspaceProjectInternalOptions } from "../../internal/deployWorkspaceProjectInternal";
import { ConvertSettingsStep } from "./ConvertSettingsStep";
import { DetectV1SettingsStep } from "./DetectV1SettingsStep";

export async function convertSettingsSchema(context: IContainerAppContext, options?: DeployWorkspaceProjectInternalOptions) {
    let activityContext: Partial<ExecuteActivityContext>;

    if (options?.suppressActivity) {
        activityContext = { suppressNotification: true };
    } else {
        activityContext = await createActivityContext();
        activityContext.activityChildren = [];
    }

    const wizardContext: DeployWorkspaceProjectContext = {
        ...context,
        ...activityContext
    };

    const wizard: AzureWizard<DeployWorkspaceProjectContext> = new AzureWizard(wizardContext, {
        title: 'Convert settings schema',
        promptSteps: [new DetectV1SettingsStep()],
        executeSteps: [new ConvertSettingsStep()]
    });

    await wizard.prompt();
    await wizard.execute();
}

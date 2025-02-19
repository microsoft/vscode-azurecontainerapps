/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { StartingResourcesLogStep } from "../../StartingResourcesLogStep";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";

export class DwpStartingResourcesLogStep<T extends DeployWorkspaceProjectInternalContext> extends StartingResourcesLogStep<T> {
    async configureStartingResources(context: T): Promise<void> {
        if (context.resourceGroup) {
            await LocationListStep.setLocation(context, context.resourceGroup.location);
        }

        if (context.managedEnvironment && !LocationListStep.hasLocation(context)) {
            await LocationListStep.setLocation(context, context.managedEnvironment.location);
        }

        if (context.containerApp) {
            if (!LocationListStep.hasLocation(context)) {
                await LocationListStep.setLocation(context, context.containerApp.location);
            }
        }
    }
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { ContainerAppNameStep } from "../../createContainerApp/ContainerAppNameStep";
import { ImageNameStep } from "../../image/imageSource/buildImageInAzure/ImageNameStep";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";

/** Names the resources unique to the individual app: `container app`, `image name` */
export class AppResourcesNameStep extends AzureWizardPromptStep<DeployWorkspaceProjectInternalContext> {
    public async configureBeforePrompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        if (context.newContainerAppName || context.containerApp) {
            // This ensures image naming even when all other resources have already been created
            context.imageName = ImageNameStep.getTimestampedImageName(context.newContainerAppName || nonNullValueAndProp(context.containerApp, 'name'));
        }
    }

    public async prompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        context.newContainerAppName = (await context.ui.showInputBox({
            prompt: localize('containerAppNamePrompt', 'Enter a name for the new container app'),
            value: context.dockerfilePath?.split(path.sep).at(-2)?.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase(),
            validateInput: (name: string) => ContainerAppNameStep.validateInput(name),
            asyncValidationTask: async (name: string) => {
                const resourceGroupName: string = context.resourceGroup?.name || nonNullProp(context, 'newResourceGroupName');
                const isAvailable: boolean = await ContainerAppNameStep.isNameAvailable(context, resourceGroupName, name);
                return isAvailable ? undefined : localize('containerAppExists', 'The container app "{0}" already exists in resource group "{1}".', name, resourceGroupName);
            }
        })).trim();

        context.imageName = ImageNameStep.getTimestampedImageName(context.newContainerAppName);
        ext.outputChannel.appendLog(localize('usingContainerAppName', 'User provided the name "{0}" for the new container app.', context.newContainerAppName));
    }

    public shouldPrompt(context: DeployWorkspaceProjectInternalContext): boolean {
        return !context.containerApp && !context.newContainerAppName;
    }
}

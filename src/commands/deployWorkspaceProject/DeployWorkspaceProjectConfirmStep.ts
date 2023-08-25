/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";
import { IDeployWorkspaceProjectSettings, getContainerAppDeployWorkspaceSettings } from "./getContainerAppDeployWorkspaceSettings";

export class DeployWorkspaceProjectConfirmStep extends AzureWizardPromptStep<IDeployWorkspaceProjectContext> {
    public async prompt(context: IDeployWorkspaceProjectContext): Promise<void> {
        const settings: IDeployWorkspaceProjectSettings | undefined = await getContainerAppDeployWorkspaceSettings(nonNullProp(context, 'rootFolder'));

        const resourcesToCreate: string[] = [];
        if (!context.resourceGroup) {
            resourcesToCreate.push('resource group');
        }

        if (!context.managedEnvironment) {
            resourcesToCreate.push('log analytics workspace');
            resourcesToCreate.push('container app environment');
        }

        if (context.registry) {
            if (settings?.acrName !== context.registry.name) {
                // Edge-case
                await context.ui.showWarningMessage(
                    localize('detectedExistingRegistry',
                        'Detected a registry with name matching the local workspace "{0}". \n\nContinuing means the latest image in this registry will be overwritten.',
                        context.registry.name
                    ),
                    { modal: true },
                    { title: localize('continue', 'Continue') }
                );
            }
        } else {
            resourcesToCreate.push('container registry');
        }

        if (context.containerApp) {
            if (settings?.containerAppName !== context.containerApp.name) {
                // Edge-case
                await context.ui.showWarningMessage(
                    localize('detectedExistingContainerApp',
                        'Detected a container app with name matching the local workspace "{0}". \n\nContinuing means the latest deployment of this container app will be overwritten.',
                        context.containerApp.name
                    ),
                    { modal: true },
                    { title: localize('continue', 'Continue') }
                );
            }
        } else {
            resourcesToCreate.push('container app');
        }

        let confirmMessage: string | undefined;
        if (resourcesToCreate.length) {
            confirmMessage = localize('resourceCreationConfirm',
                'To deploy your new workspace project to a container app, the following resources will need to be created: "{0}".',
                resourcesToCreate.join(', ')
            );
        } else {
            if (context.containerApp && settings?.containerAppName === context.containerApp.name) {
                confirmMessage = localize('containerAppConfirm',
                    'The latest deployment of container app "{0}"',
                    context.containerApp?.name
                );
            }
            if (context.registry && settings?.acrName === context.registry.name) {
                confirmMessage = confirmMessage ?
                    confirmMessage + localize('addRegistryConfirm', ' and the latest image of registry "{0}"', context.registry?.name) :
                    localize('registryConfirm', 'The latest image of registry "{0}"', context.registry?.name);
            }

            if (confirmMessage) {
                confirmMessage += localize('concludeMessage', ' will be overwritten.');
            }
        }

        await context.ui.showWarningMessage(
            nonNullValue(confirmMessage),
            { modal: true },
            { title: localize('continue', 'Continue') }
        );
    }

    public shouldPrompt(): boolean {
        return true;
    }
}

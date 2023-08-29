/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";
import { IDeployWorkspaceProjectSettings, getDeployWorkspaceProjectSettings } from "./deployWorkspaceProjectSettings";

export class DeployWorkspaceProjectConfirmStep extends AzureWizardPromptStep<IDeployWorkspaceProjectContext> {
    public async prompt(context: IDeployWorkspaceProjectContext): Promise<void> {
        const settings: IDeployWorkspaceProjectSettings | undefined = await getDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'));

        const resourcesToCreate: string[] = [];
        if (!context.resourceGroup) {
            resourcesToCreate.push('resource group');
        }

        if (!context.managedEnvironment) {
            resourcesToCreate.push('log analytics workspace');
            resourcesToCreate.push('container app environment');
        }

        if (!context.registry) {
            resourcesToCreate.push('container registry');
        }

        if (!context.containerApp) {
            resourcesToCreate.push('container app');
        }

        let confirmMessage: string | undefined;
        if (resourcesToCreate.length) {
            confirmMessage = localize('resourceCreationConfirm',
                'To deploy your workspace project, the following resources will be created: "{0}".',
                resourcesToCreate.join(', ')
            );
        } else {
            if (context.containerApp && settings?.containerAppName === context.containerApp.name) {
                confirmMessage = localize('containerAppConfirm',
                    'The latest deployment of container app "{0}"',
                    context.containerApp?.name
                );
            }
            if (context.registry && settings?.containerRegistryName === context.registry.name) {
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

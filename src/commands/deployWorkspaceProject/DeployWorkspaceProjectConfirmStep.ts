/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullValue } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { OverwriteConfirmStepBase } from "../OverwriteConfirmStepBase";
import type { DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";

export class DeployWorkspaceProjectConfirmStep extends OverwriteConfirmStepBase<DeployWorkspaceProjectContext> {
    protected async promptCore(context: DeployWorkspaceProjectContext): Promise<void> {
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
        let outputMessage: string | undefined;
        if (resourcesToCreate.length) {
            confirmMessage = localize('resourceCreationConfirm',
                'To deploy your workspace project, the following resources will be created: "{0}".',
                resourcesToCreate.join(', ')
            );
            outputMessage = localize('resourceCreationConfirmed',
                'User confirmed creation for the following resources: "{0}".',
                resourcesToCreate.join(', ')
            );
        } else {
            confirmMessage = localize('overwriteConfirm', 'The latest deployment of container app "{0}" and the latest image of registry "{1}" will be overwritten.', context.containerApp?.name, context.registry?.name);
            outputMessage = localize('overwriteConfirmed', 'User confirmed overwrite of container app "{0}" and the latest image of registry "{1}".', context.containerApp?.name, context.registry?.name);
        }

        if (this.hasUnsupportedFeatures(context)) {
            confirmMessage += '\n\n' + this.unsupportedFeaturesWarning;
            outputMessage += ' ' + localize('unsupportedOverwriteConfirmed', 'User also confirmed that proceeding means that any unsupported container app features in VS Code will be lost.');
        }

        await context.ui.showWarningMessage(
            nonNullValue(confirmMessage),
            { modal: true },
            { title: localize('continue', 'Continue') }
        );

        ext.outputChannel.appendLog(outputMessage);
    }

    public shouldPrompt(): boolean {
        return true;
    }
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { MessageItem } from "vscode";
import { IContainerAppContext } from "../../commands/IContainerAppContext";
import type { ContainerAppModel } from "../../tree/ContainerAppItem";
import { localize } from "../localize";

export class ContainerAppOverwriteConfirmStep<T extends IContainerAppContext> extends AzureWizardPromptStep<T> {
    public hideStepCount: boolean = true;

    public async prompt(context: T): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const warning: string = containerApp.revisionsMode === KnownActiveRevisionsMode.Single ?
            localize('confirmDeploySingle', 'Are you sure you want to deploy to "{0}"? This will overwrite the active revision and unsupported features in VS Code will be lost.', containerApp.name) :
            localize('confirmDeployMultiple', 'Are you sure you want to deploy to "{0}"? Unsupported features in VS Code will be lost in the new revision.', containerApp.name);

        const items: MessageItem[] = [{ title: localize('deploy', 'Deploy') }];
        await context.ui.showWarningMessage(warning, { modal: true, stepName: 'confirmDestructiveDeployment' }, ...items);
    }

    public shouldPrompt(context: T): boolean {
        return !!context.containerApp && this.hasUnsupportedFeatures(context);
    }

    // Check for any portal features that VS Code doesn't currently support
    private hasUnsupportedFeatures(context: T): boolean {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        if (containerApp.template?.volumes) {
            return true;
        } else if (containerApp.template?.containers) {
            if (containerApp.template.containers.length > 1) {
                return true;
            }

            for (const container of containerApp.template.containers) {
                // NOTE: these are all arrays so if they are empty, this will still return true
                // but these should be undefined if not being utilized
                return !!container.probes || !!container.volumeMounts || !!container.args;
            }
        }

        return false;
    }
}

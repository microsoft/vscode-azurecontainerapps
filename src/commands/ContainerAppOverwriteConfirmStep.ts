/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { MessageItem } from "vscode";
import type { ContainerAppModel } from "../tree/ContainerAppItem";
import { localize } from "../utils/localize";
import type { IContainerAppContext } from "./IContainerAppContext";

export class ContainerAppOverwriteConfirmStep<T extends IContainerAppContext> extends AzureWizardPromptStep<T> {
    public hideStepCount: boolean = true;

    public async configureBeforePrompt(context: T): Promise<void> {
        context.telemetry.properties.hasUnsupportedFeatures = 'false';
    }

    public async prompt(context: T): Promise<void> {
        context.telemetry.properties.hasUnsupportedFeatures = 'true';

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
                // but the length on these should be 0 or undefined if not being utilized
                return !!container.probes?.length || !!container.volumeMounts?.length || !!container.args?.length;
            }
        }

        return false;
    }
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { ContainerAppModel } from "../tree/ContainerAppItem";
import { localize } from "../utils/localize";
import type { IContainerAppContext } from "./IContainerAppContext";

export abstract class UnsupportedContainerAppFeaturesStepBase<T extends IContainerAppContext> extends AzureWizardPromptStep<T> {
    public hideStepCount: boolean = true;
    protected readonly unsupportedFeaturesWarning: string = localize('unsupportedOverwriteConfirm', 'Any unsupported container app features in VS Code will be lost.');

    public abstract prompt(context: T): Promise<void>;
    public abstract shouldPrompt(context: T): boolean;

    // Check for any portal features that VS Code doesn't currently support
    protected hasUnsupportedFeatures(context: T): boolean {
        if (!context.containerApp) {
            return false;
        }

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

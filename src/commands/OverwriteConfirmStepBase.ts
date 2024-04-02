/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type OverwriteConfirmTelemetryProps as TelemetryProps } from "../telemetry/OverwriteConfirmTelemetryProps";
import { type SetTelemetryProps } from "../telemetry/SetTelemetryProps";
import { type ContainerAppModel } from "../tree/ContainerAppItem";
import { localize } from "../utils/localize";
import { type IContainerAppContext } from "./IContainerAppContext";

type OverwriteConfirmContext = IContainerAppContext & SetTelemetryProps<TelemetryProps>;

export abstract class OverwriteConfirmStepBase<T extends OverwriteConfirmContext> extends AzureWizardPromptStep<T> {
    public hideStepCount: boolean = true;
    protected readonly unsupportedFeaturesWarning: string = localize('unsupportedOverwriteConfirm', 'Any unsupported container app features in VS Code will be lost.');

    public async configureBeforePrompt(context: T): Promise<void> {
        context.telemetry.properties.hasUnsupportedFeatures = 'false';
    }

    public async prompt(context: T): Promise<void> {
        if (this.hasUnsupportedFeatures(context)) {
            context.telemetry.properties.hasUnsupportedFeatures = 'true';
        }

        await this.promptCore(context);
    }

    protected abstract promptCore(context: T): Promise<void>;
    public abstract shouldPrompt(context: T): boolean;

    /**
     * Checks for any portal features that VS Code doesn't currently support
     */
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

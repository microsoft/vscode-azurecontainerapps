/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type EnvironmentVar } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, nonNullProp, nonNullValueAndProp, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import * as deepEqual from "deep-eql";
import * as path from "path";
import { localize } from "../../../../../utils/localize";
import { EnvironmentVariablesListStep } from "../../../../image/imageSource/EnvironmentVariablesListStep";
import { type WorkspaceDeploymentConfigurationContext } from "../WorkspaceDeploymentConfigurationContext";
import { ContainerAppVerifyStep } from "../azureResources/ContainerAppVerifyStep";
import { ResourceGroupVerifyStep } from "../azureResources/ResourceGroupVerifyStep";

export const useExistingConfigurationKey: string = 'useExistingConfiguration';

export class EnvUseExistingConfigurationPromptStep<T extends WorkspaceDeploymentConfigurationContext> extends AzureWizardPromptStep<T> {
    private hasDifferingEnvVars?: boolean;

    public async configureBeforePrompt(context: T): Promise<void> {
        const envPath: string = nonNullValueAndProp(context.deploymentConfigurationSettings, 'envPath');
        if (envPath === useExistingConfigurationKey) {
            this.hasDifferingEnvVars = false;
            return;
        }

        const rootPath: string = nonNullProp(context, 'rootFolder').uri.fsPath;
        const fullPath: string = path.join(rootPath, envPath);

        // Verify the resource group and container app ahead of time so we can inspect the current environment variables
        try {
            await ResourceGroupVerifyStep.verifyResourceGroup(context);
            await ContainerAppVerifyStep.verifyContainerApp(context);
        } catch {
            this.hasDifferingEnvVars = false;
            return;
        }

        const configVars: EnvironmentVar[] = await EnvironmentVariablesListStep.parseEnvironmentVariablesFromEnvPath(fullPath);
        const currentVars: EnvironmentVar[] = context.containerApp?.template?.containers?.[0]?.env ?? [];
        this.hasDifferingEnvVars = !deepEqual(configVars, currentVars);
    }

    public async prompt(context: T): Promise<void> {
        const useEnvFile: string = localize('useEnvFile', 'Env file');
        const useExistingConfig: string = localize('useExistingConfig', 'Existing container env');
        const dontAskAgain: string = localize('dontAskAgain', 'Env file, don\'t ask again');
        const picks: IAzureQuickPickItem<string>[] = [
            { label: useEnvFile, data: useEnvFile },
            { label: useExistingConfig, data: useExistingConfig },
            { label: dontAskAgain, data: dontAskAgain },
        ];

        const result: string = (await context.ui.showQuickPick(picks, {
            placeHolder: localize('envMismatch', 'Which env configuration should be used from now on?'),
            suppressPersistence: true,
        })).data;

        // Todo: outputlog

        if (result === useEnvFile) {
            // Let the following file path verification steps validate the env file
        } else if (result === useExistingConfig) {
            context.envPath = '';
        } else if (result === dontAskAgain) {
            // Todo
        }
    }

    public shouldPrompt(): boolean {
        return !!this.hasDifferingEnvVars;
    }
}

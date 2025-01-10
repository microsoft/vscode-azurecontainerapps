/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type EnvironmentVar } from "@azure/arm-appcontainers";
import { activitySuccessContext, activitySuccessIcon, AzureWizardPromptStep, createUniversallyUniqueContextValue, GenericTreeItem, nonNullProp, nonNullValueAndProp, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import * as deepEqual from "deep-eql";
import * as path from "path";
import { ext } from "../../../../../extensionVariables";
import { localize } from "../../../../../utils/localize";
import { EnvFileListStep } from "../../../../image/imageSource/EnvFileListStep";
import { type WorkspaceDeploymentConfigurationContext } from "../WorkspaceDeploymentConfigurationContext";
import { ContainerAppVerifyStep } from "../azureResources/ContainerAppVerifyStep";
import { ResourceGroupVerifyStep } from "../azureResources/ResourceGroupVerifyStep";

export const useRemoteConfigurationKey: string = 'useRemoteConfiguration';
export const useRemoteConfigurationLabel: string = localize('useRemoteConfiguration', 'Remote env configuration');
export const useRemoteConfigurationOutputMessage: string = localize('usingRemoteConfiguration', 'Using the existing remote env configuration.');

export class EnvUseRemoteConfigurationPromptStep<T extends WorkspaceDeploymentConfigurationContext> extends AzureWizardPromptStep<T> {
    private shouldPromptEnvVars?: boolean;

    public async configureBeforePrompt(context: T): Promise<void> {
        const envPath: string | undefined = context.deploymentConfigurationSettings?.envPath;
        if (!envPath || envPath === useRemoteConfigurationKey) {
            this.shouldPromptEnvVars = false;
            return;
        }

        // Verify the resource group and container app ahead of time so we can inspect the current environment variables
        try {
            await ResourceGroupVerifyStep.verifyResourceGroup(context);
            await ContainerAppVerifyStep.verifyContainerApp(context);
        } catch {
            this.shouldPromptEnvVars = false;
            return;
        }

        const rootPath: string = nonNullProp(context, 'rootFolder').uri.fsPath;
        const fullPath: string = path.join(rootPath, envPath);
        const configVars: EnvironmentVar[] = await EnvFileListStep.parseEnvironmentVariablesFromEnvPath(fullPath);
        const currentVars: EnvironmentVar[] = context.containerApp?.template?.containers?.[0]?.env ?? [];
        this.shouldPromptEnvVars = !deepEqual(configVars, currentVars);
    }

    public async prompt(context: T): Promise<void> {
        const envPath: string = nonNullValueAndProp(context.deploymentConfigurationSettings, 'envPath');
        const useEnvFile: string = localize('useEnvFile', 'Env file');
        const useExistingConfig: string = localize('useExistingConfig', 'Existing configuration');

        const picks: IAzureQuickPickItem<string>[] = [
            { label: useEnvFile, data: useEnvFile, description: envPath },
            { label: useExistingConfig, data: useExistingConfig, description: context.containerApp?.name },
        ];

        const result: string = (await context.ui.showQuickPick(picks, {
            placeHolder: localize('selectSourcePrompt', 'Detected conflicts between local and remote environment variables. Select source.'),
            suppressPersistence: true,
        })).data;

        if (result === useEnvFile) {
            // Do nothing, later steps will verify the file path
        } else if (result === useExistingConfig) {
            context.envPath = '';
            context.activityChildren?.push(
                new GenericTreeItem(undefined, {
                    contextValue: createUniversallyUniqueContextValue(['envUseExistingConfigurationPromptStepItem', activitySuccessContext]),
                    label: useRemoteConfigurationLabel,
                    iconPath: activitySuccessIcon,
                })
            );
            ext.outputChannel.appendLog(useRemoteConfigurationOutputMessage);
        }
    }

    public shouldPrompt(): boolean {
        return !!this.shouldPromptEnvVars;
    }
}

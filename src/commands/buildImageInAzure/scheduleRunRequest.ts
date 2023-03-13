/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Run as AcrRun } from '@azure/arm-containerregistry';
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, nonNullValue } from '@microsoft/vscode-azext-utils';
import { DockerFileItemStep } from './DockerFileItemStep';
import { IBuildImageContext } from './IBuildImageContext';
import { ImageNameStep } from './ImageNameStep';
import { OSPickStep } from './osPickStep';
import { RootFolderStep } from "./RootFolderStep";
import { RunStep } from './RunStep';
import { TarFileStep } from './TarFileStep';
import { UploadSourceCodeStep } from './UploadSourceCodeStep';

export async function scheduleRunRequest(context: IBuildImageContext): Promise<() => Promise<AcrRun>> {
    const wizardContext: IBuildImageContext = context;

    const promptSteps: AzureWizardPromptStep<IBuildImageContext>[] = [
        new RootFolderStep(),
        new DockerFileItemStep(),
        new ImageNameStep(),
        new OSPickStep()
    ];

    const executeSteps: AzureWizardExecuteStep<IBuildImageContext>[] = [
        new TarFileStep(),
        new UploadSourceCodeStep(),
        new RunStep()
    ];

    const wizard: AzureWizard<IBuildImageContext> = new AzureWizard(wizardContext, {
        promptSteps,
        executeSteps
    });

    await wizard.prompt();
    await wizard.execute();

    return async () => context.client.runs.get(context.resourceGroupName, context.registryName, nonNullValue(context.run.runId));
}

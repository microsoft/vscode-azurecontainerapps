/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../../utils/localize";
import { BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";

export enum AcrBuildSupportedOS {
    Windows = 'Windows',
    Linux = 'Linux'
}

export class OSPickStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        const placeHolder: string = localize('imageOSPrompt', 'Select image base OS');
        const picks: IAzureQuickPickItem<AcrBuildSupportedOS>[] = [
            { label: AcrBuildSupportedOS.Linux, data: AcrBuildSupportedOS.Linux, suppressPersistence: true },
            { label: AcrBuildSupportedOS.Windows, data: AcrBuildSupportedOS.Windows, suppressPersistence: true },
        ];

        context.os = (await context.ui.showQuickPick(picks, { placeHolder })).data;
        context.telemetry.properties.imageBaseOs = context.os;
    }

    public shouldPrompt(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.os;
    }
}

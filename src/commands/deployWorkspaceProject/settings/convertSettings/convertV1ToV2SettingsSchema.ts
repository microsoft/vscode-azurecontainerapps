/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { RootFolderStep } from "../../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type ConvertSettingsContext } from "./ConvertSettingsContext";
import { ConvertSettingsStep } from "./ConvertSettingsStep";

export async function convertV1ToV2SettingsSchema(context: IContainerAppContext): Promise<ConvertSettingsContext> {
    const wizardContext: ConvertSettingsContext = context;

    const wizard = new AzureWizard<ConvertSettingsContext>(wizardContext, {
        promptSteps: [new RootFolderStep()],
        executeSteps: [new ConvertSettingsStep()]
    });

    await wizard.prompt();
    await wizard.execute();

    return context;
}

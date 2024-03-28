/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { createActivityContext } from "../../../../utils/activity/activityUtils";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { RootFolderStep } from "../../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type ConvertSettingsContext } from "./ConvertSettingsContext";
import { ConvertSettingsStep } from "./ConvertSettingsStep";
import { DetectV1SettingsStep } from "./DetectV1SettingsStep";

export async function convertSettingsSchema(context: IContainerAppContext) {
    const wizardContext: ConvertSettingsContext = {
        ...context,
        ...await createActivityContext(),
    };

    const wizard: AzureWizard<ConvertSettingsContext> = new AzureWizard(wizardContext, {
        title: 'Convert settings schema',
        promptSteps: [new RootFolderStep(), new DetectV1SettingsStep()],
        executeSteps: [new ConvertSettingsStep()]
    });

    await wizard.prompt();
    await wizard.execute();
}

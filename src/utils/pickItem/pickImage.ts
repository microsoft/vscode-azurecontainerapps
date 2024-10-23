/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContextValueQuickPickStep, runQuickPickWizard, type AzureWizardPromptStep, type IActionContext, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { ImageItem } from "../../tree/containers/ImageItem";
import { getPickContainerSteps } from "./pickContainer";
import { pickContainerApp } from "./pickContainerApp";
import { type RevisionDraftPickItemOptions } from "./PickItemOptions";

function getPickImageStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: ImageItem.contextValueRegExp },
        skipIfOne: true,
    });
}

export async function pickImage(context: IActionContext, options?: RevisionDraftPickItemOptions): Promise<ImageItem> {
    const containerAppItem: ContainerAppItem = await pickContainerApp(context);
    return await runQuickPickWizard(context, {
        promptSteps: [
            ...getPickContainerSteps(containerAppItem, options),
            getPickImageStep(),
        ],
        title: options?.title,
    }, containerAppItem);
}

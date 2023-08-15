/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { AzureWizardPromptStep, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { ICreateAcrContext } from "./ICreateAcrContext";

export class SkuListStep extends AzureWizardPromptStep<ICreateAcrContext> {
    public async prompt(context: ICreateAcrContext): Promise<void> {
        const placeHolder: string = "Select a SKU";
        const picks: IAzureQuickPickItem<KnownSkuName>[] = [
            { label: "Basic", data: KnownSkuName.Basic },
            { label: "Standard", data: KnownSkuName.Standard },
            { label: "Premium", data: KnownSkuName.Premium },
        ];

        context.sku = (await context.ui.showQuickPick(picks, {
            placeHolder,
            suppressPersistence: true
        })).data;
    }

    public shouldPrompt(context: ICreateAcrContext): boolean {
        return !context.sku;
    }
}

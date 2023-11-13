/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { AzureWizardPromptStep, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../../../../utils/localize";
import { type CreateAcrContext } from "./CreateAcrContext";

export class SkuListStep extends AzureWizardPromptStep<CreateAcrContext> {
    public async prompt(context: CreateAcrContext): Promise<void> {
        const placeHolder: string = localize("sku", "Select a SKU");
        const picks: IAzureQuickPickItem<KnownSkuName>[] = [
            { label: KnownSkuName.Basic, data: KnownSkuName.Basic },
            { label: KnownSkuName.Standard, data: KnownSkuName.Standard },
            { label: KnownSkuName.Premium, data: KnownSkuName.Premium },
        ];

        context.newRegistrySku = (await context.ui.showQuickPick(picks, {
            placeHolder,
            suppressPersistence: true
        })).data;
    }

    public shouldPrompt(context: CreateAcrContext): boolean {
        return !context.newRegistrySku;
    }
}

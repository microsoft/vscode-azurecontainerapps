/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { AzureWizardPromptStep, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../../utils/localize";
import { isRecommendedPick } from "../../../../utils/telemetryUtils";
import { acrCreatePick, AcrListStep } from "../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";

export class DwpAcrListStep<T extends DeployWorkspaceProjectInternalContext> extends AzureWizardPromptStep<T> {
    public async prompt(context: T): Promise<void> {
        const picks: IAzureQuickPickItem<Registry | undefined>[] = await this.getPicks(context);
        if (!picks.length) {
            // No container registries to choose from
            return;
        }

        const placeHolder: string = localize('selectContainerRegistry', 'Select an Azure Container Registry to store your image');
        const pick: IAzureQuickPickItem<Registry | undefined> = await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true });

        context.telemetry.properties.usedRecommendedRegistry = isRecommendedPick(pick) ? 'true' : 'false';
        context.registry = pick.data;
    }

    public shouldPrompt(context: T): boolean {
        return !context.registry;
    }

    public async getPicks(context: T): Promise<IAzureQuickPickItem<Registry | undefined>[]> {
        return [
            acrCreatePick,
            ...await AcrListStep.getSortedAndRecommendedPicks(context),
        ];
    }
}


/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../../utils/localize";
import { AcrListStep } from "../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";

const recommendedPickDescription: string = localize('recommended', '(Recommended)');

export class DwpContainerRegistryListStep extends AzureWizardPromptStep<DeployWorkspaceProjectInternalContext> {
    public async prompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        const picks: IAzureQuickPickItem<Registry | undefined>[] = await this.getPicks(context);
        if (!picks.length) {
            // No container registries to choose from
            return;
        }

        const placeHolder: string = localize('selectContainerRegistry', 'Select a container registry');
        const pick = await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true });
        context.registry = pick.data;

        context.telemetry.properties.usedRecommendedRegistry = isRecommendedPick(pick) ? 'true' : 'false';
        context.telemetry.properties.recommendedRegistryCount =
            String(picks.reduce((count, pick) => count + (isRecommendedPick(pick) ? 1 : 0), 0));
    }

    public shouldPrompt(context: DeployWorkspaceProjectInternalContext): boolean {
        return !context.registry;
    }

    private async getPicks(context: DeployWorkspaceProjectInternalContext): Promise<IAzureQuickPickItem<Registry | undefined>[]> {
        const registries: Registry[] = await AcrListStep.getRegistries(context);
        if (!registries.length) {
            return [];
        }

        const registriesByGroup: Record<string, Registry[]> = {};
        for (const r of registries) {
            if (!r.id) {
                continue;
            }

            const { resourceGroup } = parseAzureResourceId(r.id);
            const registriesGroup: Registry[] = registriesByGroup[resourceGroup] ?? [];
            registriesGroup.push(r);
            registriesByGroup[resourceGroup] = registriesGroup;
        }

        // Sort resource groups alphabetically; if matches selected resource group, prioritize to the top
        const sortedResourceGroups: string[] = Object.keys(registriesByGroup).sort((a, b) => {
            const lowA: string = a.toLocaleLowerCase();
            const lowB: string = b.toLocaleLowerCase();

            switch (true) {
                // If the user already picked a resource group, sort those to the top
                case a === context.resourceGroup?.name:
                    return -1;
                case b === context.resourceGroup?.name:
                    return 1;

                // Everything below handles normal alphabetical sorting
                case lowA < lowB:
                    return -1;
                case lowB < lowA:
                    return 1;
                default:
                    return 0;
            }
        });

        const picks: IAzureQuickPickItem<Registry | undefined>[] = [
            {
                label: localize('newContainerRegistry', '$(plus) Create new container registry'),
                data: undefined
            }
        ];

        for (const rg of sortedResourceGroups) {
            const registryGroup: Registry[] = registriesByGroup[rg];
            const maybeRecommended: string = rg === context.resourceGroup?.name ? ` ${recommendedPickDescription}` : '';

            picks.push(...registryGroup.map(r => {
                return {
                    label: nonNullProp(r, 'name'),
                    description: rg + maybeRecommended,
                    data: r,
                };
            }));
        }

        return picks;
    }
}

const isRecommendedPick = (pick: IAzureQuickPickItem<Registry | undefined>): boolean => pick.description === recommendedPickDescription;

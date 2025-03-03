/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { type Registry } from "@azure/arm-containerregistry";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { nonNullProp, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { acrDomain } from "../../../../../constants";
import { parseImageName } from "../../../../../utils/imageNameUtils";
import { localize } from "../../../../../utils/localize";
import { currentlyDeployedPickDescription, hasMatchingPickDescription } from "../../../../../utils/pickUtils";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";
import { getLatestContainerAppImage } from "../getLatestContainerImage";
import { type AcrPickItem, type AcrPickUpdateStrategy } from "./AcrListStep";

export class AcrResourceGroupAndDeployedPickUpdateStrategy implements AcrPickUpdateStrategy {
    updatePicks(context: ContainerRegistryImageSourceContext, picks: AcrPickItem[]): AcrPickItem[] {
        const registriesByGroup: Record<string, Registry[]> = {};
        for (const p of picks) {
            const registry: Registry | undefined = p.data;
            if (!registry.id) {
                continue;
            }

            const { resourceGroup } = parseAzureResourceId(registry.id);
            const registriesGroup: Registry[] = registriesByGroup[resourceGroup] ?? [];
            registriesGroup.push(registry);
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

        // Check for a currently deployed registry
        let currentRegistry: string | undefined;
        let hasCurrentRegistry: boolean = false;
        if (context.containerApp) {
            const { registryDomain, registryName } = parseImageName(getLatestContainerAppImage(context.containerApp, context.containersIdx ?? 0));
            if (context.containerApp.revisionsMode === KnownActiveRevisionsMode.Single && registryDomain === acrDomain) {
                currentRegistry = registryName;

                const crIndex: number = picks.findIndex((p) => !!currentRegistry && p.data.loginServer === currentRegistry);
                hasCurrentRegistry = crIndex !== -1;
            }
        }

        context.telemetry.properties.sameRgAcrCount = '0';

        let hasSameRgRegistry: boolean = false;
        const reOrderedPicks: IAzureQuickPickItem<Registry>[] = [];
        for (const [i, rg] of sortedResourceGroups.entries()) {
            const registriesGroup: Registry[] = registriesByGroup[rg];

            // Same resource group would be sorted to the top of the list...
            let maybeSameRg: string | undefined;
            if (i === 0 && !hasCurrentRegistry && rg === context.resourceGroup?.name) {
                maybeSameRg = localize('sameRg', 'Within Same Resource Group');
                context.telemetry.properties.sameRgAcrCount = String(registriesGroup.length);
                hasSameRgRegistry = true;
            }

            // ...any "Other" resource groups would come after
            let maybeOtherRg: string | undefined;
            if (i > 0 && hasSameRgRegistry) {
                maybeOtherRg = localize('other', 'Other');
            }

            const groupedRegistries: IAzureQuickPickItem<Registry>[] = registriesGroup.map(r => {
                const maybeDeployed: string = r.loginServer === currentRegistry ? ` ${currentlyDeployedPickDescription}` : '';
                return {
                    label: nonNullProp(r, 'name'),
                    group: maybeSameRg || maybeOtherRg,
                    description: maybeDeployed || rg,
                    data: r,
                };
            });

            reOrderedPicks.push(...groupedRegistries);
        }

        // If a currently deployed registry exists, bring it to the front of the list
        if (hasCurrentRegistry) {
            const cdIdx: number = reOrderedPicks.findIndex(p => hasMatchingPickDescription(p, currentlyDeployedPickDescription));
            if (cdIdx !== -1) {
                const currentlyDeployedPick: IAzureQuickPickItem<Registry> | undefined = reOrderedPicks.splice(cdIdx, 1)[0];
                reOrderedPicks.unshift(currentlyDeployedPick);
            }
        }

        return reOrderedPicks;
    }
}

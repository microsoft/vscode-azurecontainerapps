/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

interface TestRegion {
    /**
     * The region id passed to Azure APIs (e.g. `westus2`).
     */
    id: string;
    /**
     * The region display name shown in location quick picks (e.g. `West US 2`).
     */
    displayName: string;
}

/**
 * Display names for regions that may be selected when running the long-running (nightly) tests.
 * Add an entry here (or set `AzCode_TestRegionDisplayName`) when targeting a region not listed below.
 */
const regionDisplayNames: Record<string, string> = {
    centralus: 'Central US',
    eastus: 'East US',
    eastus2: 'East US 2',
    northcentralus: 'North Central US',
    southcentralus: 'South Central US',
    westus: 'West US',
    westus2: 'West US 2',
    westus3: 'West US 3',
    canadacentral: 'Canada Central',
    northeurope: 'North Europe',
    westeurope: 'West Europe',
};

/**
 * Default region used by the long-running tests when creating resources.
 * `eastus` is avoided because it frequently hits capacity constraints for managed environments.
 */
const defaultRegionId: string = 'westus2';

function resolveTestRegion(): TestRegion {
    const id: string = (process.env.AzCode_TestRegion || defaultRegionId).trim().toLowerCase();
    const displayName: string | undefined = process.env.AzCode_TestRegionDisplayName?.trim() || regionDisplayNames[id];

    if (!displayName) {
        throw new Error(
            `Unknown display name for test region "${id}". ` +
            `Add it to "regionDisplayNames" in test/nightly/testRegion.ts or set the "AzCode_TestRegionDisplayName" variable.`
        );
    }

    return { id, displayName };
}

/**
 * The Azure region used by the long-running (nightly) tests when creating resources.
 *
 * Defaults to `westus2`. A different region can be selected at queue-time by setting the
 * `AzCode_TestRegion` build variable / environment variable to the desired region id (e.g. `eastus`).
 * If the region id is not present in `regionDisplayNames`, its display name can be provided via the
 * `AzCode_TestRegionDisplayName` variable.
 */
export const testRegion: TestRegion = resolveTestRegion();

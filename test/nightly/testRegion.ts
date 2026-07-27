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
 * Reads the first defined/non-empty environment variable from the provided names.
 *
 * Azure DevOps exposes pipeline variables to the test process as environment variables using an
 * upper-cased name (e.g. the `AzCode_TestRegion` variable becomes `AZCODE_TESTREGION`), whereas a
 * developer running locally typically exports the variable using its literal, mixed-case name.
 * Checking both forms keeps the helper working in either context.
 */
function readEnv(...names: string[]): string | undefined {
    for (const name of names) {
        const value: string | undefined = process.env[name]?.trim();
        if (value) {
            return value;
        }
    }
    return undefined;
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
    const id: string = (readEnv('AzCode_TestRegion', 'AZCODE_TESTREGION') || defaultRegionId).toLowerCase();
    const displayName: string | undefined = readEnv('AzCode_TestRegionDisplayName', 'AZCODE_TESTREGIONDISPLAYNAME') || regionDisplayNames[id];

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
 * Defaults to `westus2`. A different region can be selected at queue-time by setting the pipeline's
 * `Test Region` parameter (surfaced to the test process via the `AzCode_TestRegion` variable), or
 * locally by exporting the `AzCode_TestRegion` environment variable to the desired region id (e.g. `eastus`).
 * If the region id is not present in `regionDisplayNames`, its display name can be provided via the
 * `AzCode_TestRegionDisplayName` variable.
 */
export const testRegion: TestRegion = resolveTestRegion();

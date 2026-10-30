/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ExecResult, type LifecyclePolicy, type PublicDiskImage, type Sandbox, type SandboxGroup, type SandboxResources, type Snapshot } from '@azure/containerapps-sandbox';

/** Reference to an Azure Container Apps sandbox group. */
export interface SandboxGroupRef {
    subscriptionId: string;
    resourceGroup: string;
    groupName: string;
    /** Azure region used to select the sandbox data-plane endpoint. */
    region: string;
}

/**
 * Reference to a single sandbox within a sandbox group.
 */
export interface SandboxRef extends SandboxGroupRef {
    sandboxId: string;
}

/** Options for creating a sandbox from a public disk image. */
export interface CreateSandboxOptions {
    disk: string;
    resources: SandboxResources;
}

/** A supported sandbox resource tier. */
export interface SandboxResourceTier {
    name: 'XS' | 'S' | 'M' | 'L' | 'XL';
    cpuCores: string;
    memoryGb: string;
    diskGib: string;
    resources: SandboxResources;
}

/** Resource tiers supported by Azure Container Apps Sandboxes. */
export const sandboxResourceTiers: readonly SandboxResourceTier[] = [
    { name: 'M', cpuCores: '1', memoryGb: '2', diskGib: '20', resources: { cpu: '1000m', memory: '2048Mi', disk: '20480Mi' } },
    { name: 'XS', cpuCores: '0.25', memoryGb: '0.5', diskGib: '5', resources: { cpu: '250m', memory: '512Mi', disk: '5120Mi' } },
    { name: 'S', cpuCores: '0.5', memoryGb: '1', diskGib: '10', resources: { cpu: '500m', memory: '1024Mi', disk: '10240Mi' } },
    { name: 'L', cpuCores: '2', memoryGb: '4', diskGib: '40', resources: { cpu: '2000m', memory: '4096Mi', disk: '40960Mi' } },
    { name: 'XL', cpuCores: '4', memoryGb: '8', diskGib: '80', resources: { cpu: '4000m', memory: '8192Mi', disk: '81920Mi' } },
];

/** Parses an ARM sandbox-group id into a data-plane reference. */
export function parseSandboxGroupId(id: string, region: string): SandboxGroupRef | undefined {
    const match = /\/subscriptions\/([^/]+)\/resourceGroups\/([^/]+)\/providers\/Microsoft\.App\/sandboxGroups\/([^/]+)/i.exec(id ?? '');
    if (!match) {
        return undefined;
    }
    return {
        subscriptionId: match[1],
        resourceGroup: match[2],
        groupName: match[3],
        region,
    };
}

export { type ExecResult, type LifecyclePolicy, type PublicDiskImage, type Sandbox, type SandboxGroup, type Snapshot };

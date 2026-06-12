/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Reference to an Azure Container Apps sandbox group.
 *
 * These references are derived by parsing the ARM id returned by the `aca` CLI
 * (`/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.App/sandboxGroups/<name>`)
 * and are passed to mutation commands. Exported for reuse by follow-up features
 * (e.g. the integrated sandbox terminal).
 */
export interface SandboxGroupRef {
    subscriptionId: string;
    resourceGroup: string;
    groupName: string;
}

/**
 * Reference to a single sandbox within a sandbox group.
 */
export interface SandboxRef extends SandboxGroupRef {
    sandboxId: string;
}

/**
 * Subscription as returned by `az account list -o json`.
 */
export interface Subscription {
    id: string;
    name: string;
    isDefault?: boolean;
    state?: string;
}

/**
 * Auto-suspend lifecycle policy for a sandbox.
 */
export interface AutoSuspendPolicy {
    enabled?: boolean;
    /** Idle interval in seconds before the sandbox is auto-suspended. */
    interval?: number;
    /** Suspend mode, e.g. "Memory" or "Disk". Treated as an open set. */
    mode?: string;
}

export interface SandboxLifecycle {
    autoSuspendPolicy?: AutoSuspendPolicy;
}

export interface SandboxResources {
    cpu?: string;
    memory?: string;
    disk?: string;
}

/**
 * Sandbox group as returned by `aca sandboxgroup list`.
 */
export interface SandboxGroup {
    id: string;
    name: string;
    location?: string;
    properties?: {
        provisioningState?: string;
        managementEndpoint?: string;
    };
}

/**
 * Single sandbox as returned by `aca sandbox list/get`.
 *
 * The preview CLI may add or omit fields; only the documented fields are typed and
 * all are optional so parsing remains tolerant.
 */
export interface Sandbox {
    id: string;
    /** Lifecycle state, e.g. "Idle"/"Running"/"Suspended" plus transitional states. Open set. */
    state?: string;
    labels?: Record<string, string>;
    lifecycle?: SandboxLifecycle;
    resources?: SandboxResources;
    createdAt?: string;
    snapshotId?: string;
}

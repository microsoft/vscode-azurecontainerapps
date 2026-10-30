/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsSandboxManagementClient, SandboxGroupClient, endpointForRegion, type ExecResult, type LifecyclePolicy, type PublicDiskImage, type Sandbox, type SandboxGroup, type SandboxResources, type Snapshot } from '@azure/containerapps-sandbox';
import { parseClientContext, type AzExtClientContext } from '@microsoft/vscode-azext-azureutils';
import { localize } from '../utils/localize';
import { type CreateSandboxOptions, type SandboxGroupRef } from './sandboxTypes';

export interface SandboxServiceClient {
    sandboxes: {
        list(): AsyncIterable<Sandbox>;
        beginCreate(body: { sourcesRef: { diskImage: { name: string; isPublic: boolean } }; resources: SandboxResources }): { pollUntilDone(): Promise<Sandbox> };
        get(sandboxId: string): Promise<Sandbox>;
        exec(sandboxId: string, body: { command: string; workingDirectory?: string }): Promise<ExecResult>;
        beginDelete(sandboxId: string): { pollUntilDone(): Promise<void> };
        beginStop(sandboxId: string): { pollUntilDone(): Promise<Sandbox> };
        beginResume(sandboxId: string): { pollUntilDone(): Promise<Sandbox> };
        beginCreateSnapshot(sandboxId: string, options: { name: string }): { pollUntilDone(): Promise<Snapshot> };
        setLifecyclePolicy(sandboxId: string, policy: LifecyclePolicy): Promise<LifecyclePolicy>;
    };
    diskImages: {
        listPublic(): AsyncIterable<PublicDiskImage>;
    };
}

export interface SandboxService {
    listSandboxes(): Promise<Sandbox[]>;
    listPublicDiskImages(): Promise<PublicDiskImage[]>;
    createSandbox(options: CreateSandboxOptions): Promise<Sandbox>;
    getSandbox(sandboxId: string): Promise<Sandbox>;
    exec(sandboxId: string, command: string, workingDirectory?: string): Promise<ExecResult>;
    deleteSandbox(sandboxId: string): Promise<void>;
    stopSandbox(sandboxId: string): Promise<Sandbox>;
    resumeSandbox(sandboxId: string): Promise<Sandbox>;
    createSnapshot(sandboxId: string, name: string): Promise<Snapshot>;
    setLifecyclePolicy(sandboxId: string, policy: LifecyclePolicy): Promise<LifecyclePolicy>;
}

export class AzureSandboxService implements SandboxService {
    constructor(
        private readonly client: SandboxServiceClient,
        private readonly groupName?: string,
    ) { }

    public async listSandboxes(): Promise<Sandbox[]> {
        return this.run(() => collectPaged(this.client.sandboxes.list()));
    }

    public async listPublicDiskImages(): Promise<PublicDiskImage[]> {
        return this.run(() => collectPaged(this.client.diskImages.listPublic()));
    }

    public async createSandbox(options: CreateSandboxOptions): Promise<Sandbox> {
        return this.run(async () => {
            const poller = this.client.sandboxes.beginCreate({
                sourcesRef: {
                    diskImage: {
                        name: options.disk,
                        isPublic: true,
                    },
                },
                resources: options.resources,
            });
            return poller.pollUntilDone();
        });
    }

    public async getSandbox(sandboxId: string): Promise<Sandbox> {
        return this.run(() => this.client.sandboxes.get(sandboxId));
    }

    public async exec(sandboxId: string, command: string, workingDirectory?: string): Promise<ExecResult> {
        return this.run(() => this.client.sandboxes.exec(sandboxId, { command, workingDirectory }));
    }

    public async deleteSandbox(sandboxId: string): Promise<void> {
        await this.run(async () => {
            const poller = this.client.sandboxes.beginDelete(sandboxId);
            await poller.pollUntilDone();
        });
    }

    public async stopSandbox(sandboxId: string): Promise<Sandbox> {
        return this.run(async () => {
            const poller = this.client.sandboxes.beginStop(sandboxId);
            return poller.pollUntilDone();
        });
    }

    public async resumeSandbox(sandboxId: string): Promise<Sandbox> {
        return this.run(async () => {
            const poller = this.client.sandboxes.beginResume(sandboxId);
            return poller.pollUntilDone();
        });
    }

    public async createSnapshot(sandboxId: string, name: string): Promise<Snapshot> {
        return this.run(async () => {
            const poller = this.client.sandboxes.beginCreateSnapshot(sandboxId, { name });
            return poller.pollUntilDone();
        });
    }

    public async setLifecyclePolicy(sandboxId: string, policy: LifecyclePolicy): Promise<LifecyclePolicy> {
        return this.run(() => this.client.sandboxes.setLifecyclePolicy(sandboxId, policy));
    }

    private async run<T>(action: () => Promise<T>): Promise<T> {
        try {
            return await action();
        } catch (error) {
            throw normalizeSandboxError(error, this.groupName);
        }
    }
}

export function createSandboxService(context: AzExtClientContext, ref: SandboxGroupRef): SandboxService {
    const subscriptionContext = parseClientContext(context);
    if (subscriptionContext.isCustomCloud) {
        throw new Error(localize('sandboxCustomCloudUnsupported', 'Azure Container Apps sandboxes are not supported in custom cloud environments.'));
    }
    if (!ref.region) {
        throw new Error(localize('sandboxRegionMissing', 'The sandbox group location is unavailable. Refresh the Azure Resources view and retry.'));
    }

    const client = new SandboxGroupClient(
        subscriptionContext.credentials,
        endpointForRegion(ref.region),
        ref.subscriptionId,
        ref.resourceGroup,
        ref.groupName,
    );
    return new AzureSandboxService(client, ref.groupName);
}

export function createSandboxManagementClient(context: AzExtClientContext): ContainerAppsSandboxManagementClient {
    const subscriptionContext = parseClientContext(context);
    return new ContainerAppsSandboxManagementClient(
        subscriptionContext.credentials,
        subscriptionContext.subscriptionId,
        {
            endpoint: subscriptionContext.environment.resourceManagerEndpointUrl,
            apiVersion: '2026-07-01',
        },
    );
}

export async function listSandboxGroups(context: AzExtClientContext, resourceGroup: string): Promise<SandboxGroup[]> {
    const client = createSandboxManagementClient(context);
    return collectPaged(client.sandboxGroups.list(resourceGroup));
}

async function collectPaged<T>(items: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const item of items) {
        result.push(item);
    }
    return result;
}

export async function ensureSandboxRunning(service: SandboxService, sandboxId: string): Promise<void> {
    const sandbox = await service.getSandbox(sandboxId);
    const state = sandbox.state?.toLowerCase();
    if (state === 'stopped' || state === 'suspended' || state === 'idle') {
        await service.resumeSandbox(sandboxId);
    }
}

function normalizeSandboxError(error: unknown, groupName?: string): Error {
    const statusCode = getNumberProperty(error, 'statusCode');
    const requestId = getStringProperty(error, 'requestId');
    const suffix = requestId ? localize('sandboxRequestId', '\n\nRequest ID: {0}', requestId) : '';

    if (statusCode === 401) {
        return new Error(localize('sandboxUnauthorized', 'Your Azure session is not authorized for sandbox operations. Sign in to Azure again and retry.{0}', suffix), { cause: error });
    }
    if (statusCode === 403) {
        return new Error(localize('sandboxForbidden', 'Sandbox access was denied. Assign the "Container Apps SandboxGroup Data Owner" role on sandbox group "{0}" and retry.{1}', groupName ?? '', suffix), { cause: error });
    }
    if (statusCode === 404) {
        return new Error(localize('sandboxNotFound', 'The sandbox or sandbox group could not be found. Refresh the Azure Resources view and retry.{0}', suffix), { cause: error });
    }
    if (statusCode === 409) {
        return new Error(localize('sandboxConflict', 'The sandbox operation conflicts with its current state. Refresh the Azure Resources view and retry.{0}', suffix), { cause: error });
    }
    if (statusCode === 429) {
        return new Error(localize('sandboxThrottled', 'Sandbox requests are being throttled. Wait and retry.{0}', suffix), { cause: error });
    }
    return error instanceof Error ? error : new Error(String(error));
}

function getNumberProperty(value: unknown, property: string): number | undefined {
    if (typeof value !== 'object' || value === null || !(property in value)) {
        return undefined;
    }
    const result = Reflect.get(value, property);
    return typeof result === 'number' ? result : undefined;
}

function getStringProperty(value: unknown, property: string): string | undefined {
    if (typeof value !== 'object' || value === null || !(property in value)) {
        return undefined;
    }
    const result = Reflect.get(value, property);
    return typeof result === 'string' ? result : undefined;
}

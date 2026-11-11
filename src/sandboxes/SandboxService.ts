/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsSandboxManagementClient, SandboxGroupClient, endpointForRegion, type ExecResult, type LifecyclePolicy, type PublicDiskImage, type Sandbox, type SandboxGroup, type SandboxResources, type Snapshot } from '@azure/containerapps-sandbox';
import { RestError, type PipelinePolicy } from '@azure/core-rest-pipeline';
import { parseClientContext, type AzExtClientContext } from '@microsoft/vscode-azext-azureutils';
import { localize } from '../utils/localize';
import { type CreateSandboxOptions, type SandboxGroupRef } from './sandboxTypes';

export interface SandboxServiceClient {
    sandboxes: {
        list(): AsyncIterable<Sandbox>;
        beginCreate(body: { sourcesRef: { diskImage: { name: string; isPublic: boolean } }; resources: SandboxResources; labels?: Record<string, string> }): { pollUntilDone(): Promise<Sandbox> };
        get(sandboxId: string): Promise<Sandbox>;
        exec(sandboxId: string, body: { command: string; workingDirectory?: string }): Promise<ExecResult>;
        beginDelete(sandboxId: string): { pollUntilDone(): Promise<void> };
        beginStop(sandboxId: string): { pollUntilDone(): Promise<Sandbox> };
        beginResume(sandboxId: string): { pollUntilDone(): Promise<Sandbox> };
        beginCreateSnapshot(sandboxId: string, options: { name: string }): { pollUntilDone(): Promise<Snapshot> };
        setLifecyclePolicy(sandboxId: string, policy: LifecyclePolicy): Promise<LifecyclePolicy>;
    };
    snapshots: {
        list(): AsyncIterable<Snapshot>;
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
                ...(options.name ? { labels: { name: options.name } } : {}),
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
            const snapshots = await collectPaged(this.client.snapshots.list());
            if (snapshots.some(snapshot => snapshot.sandboxId === sandboxId && snapshot.labels.name === name)) {
                throw new Error(localize(
                    'sandboxSnapshotNameExists',
                    'A snapshot named "{0}" already exists for this sandbox. Choose a different name.',
                    name,
                ));
            }

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
        { additionalPolicies: [{ policy: sandboxErrorResponsePolicy, position: 'perCall' }] },
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

export const sandboxErrorResponsePolicy: PipelinePolicy = {
    name: 'sandboxErrorResponsePolicy',
    async sendRequest(request, next) {
        const response = await next(request);
        if (response.status >= 400) {
            const body = parseSandboxErrorBody(response.bodyAsText);
            const detail = getStringProperty(body, 'detail')?.trim();
            if (detail) {
                // The SDK drops problem-details bodies when converting them to RestError.
                throw Object.assign(new RestError(detail, {
                    statusCode: response.status,
                    code: getStringProperty(body, 'errorCode'),
                    request,
                    response,
                }), {
                    requestId: getStringProperty(body, 'requestId') ?? response.headers.get('x-ms-request-id'),
                });
            }
        }
        return response;
    },
};

function normalizeSandboxError(error: unknown, groupName?: string): Error {
    const statusCode = getNumberProperty(error, 'statusCode');
    const requestId = getStringProperty(error, 'requestId');
    const serviceMessage = getServiceErrorMessage(error);
    const details = serviceMessage ? localize('sandboxServiceMessage', '\n\nDetails: {0}', serviceMessage) : '';
    const suffix = details + (requestId ? localize('sandboxRequestId', '\n\nRequest ID: {0}', requestId) : '');

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
    if (serviceMessage) {
        return new Error(serviceMessage + (requestId ? localize('sandboxRequestId', '\n\nRequest ID: {0}', requestId) : ''), { cause: error });
    }
    return error instanceof Error ? error : new Error(String(error));
}

function getServiceErrorMessage(error: unknown): string | undefined {
    const response = getProperty(error, 'response');
    const message = getResponseErrorMessage(getProperty(error, 'details'))
        ?? getResponseErrorMessage(getProperty(response, 'parsedBody'));
    if (message) {
        return message;
    }

    // The REST SDK retains string response bodies as bodyAsText, not parsedBody.
    return getResponseErrorMessage(parseSandboxErrorBody(getStringProperty(response, 'bodyAsText')));
}

function parseSandboxErrorBody(bodyAsText: string | null | undefined): unknown {
    if (bodyAsText) {
        try {
            return JSON.parse(bodyAsText);
        } catch (parseError) {
            if (!(parseError instanceof SyntaxError)) {
                throw parseError;
            }
        }
    }
    return undefined;
}

function getResponseErrorMessage(body: unknown): string | undefined {
    return getStringProperty(getProperty(body, 'error'), 'message')?.trim()
        || getStringProperty(body, 'message')?.trim()
        || getStringProperty(body, 'detail')?.trim()
        || undefined;
}

function getProperty(value: unknown, property: string): unknown {
    return typeof value === 'object' && value !== null ? Reflect.get(value, property) : undefined;
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

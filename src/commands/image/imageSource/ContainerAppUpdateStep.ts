/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownRevisionProvisioningState, KnownRevisionRunningState, type Container, type ContainerAppsAPIClient, type Ingress, type Revision } from "@azure/arm-appcontainers";
import { LogsQueryClient, LogsQueryResultStatus, type LogsTable } from "@azure/monitor-query";
import { parseAzureResourceId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStepWithActivityOutput, createSubscriptionContext, nonNullProp, nonNullValueAndProp, type AzureWizardExecuteStep, type LogActivityAttributes } from "@microsoft/vscode-azext-utils";
import * as retry from "p-retry";
import { type Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { getContainerEnvelopeWithSecrets, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { delay } from "../../../utils/delay";
import { localize } from "../../../utils/localize";
import { type IngressContext } from "../../ingress/IngressContext";
import { enabledIngressDefaults } from "../../ingress/enableIngress/EnableIngressStep";
import { RegistryCredentialType } from "../../registryCredentials/RegistryCredentialsAddConfigurationListStep";
import { updateContainerApp } from "../../updateContainerApp";
import { type ImageSourceContext } from "./ImageSourceContext";
import { getContainerNameForImage } from "./containerRegistry/getContainerNameForImage";

export class ContainerAppUpdateStep<T extends ImageSourceContext & IngressContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 680;
    public stepName: string = 'containerAppUpdateStep';
    protected getOutputLogSuccess = (context: T): string => localize('updateContainerAppSuccess', 'Updated container app "{0}".', context.containerApp?.name);
    protected getOutputLogFail = (context: T): string => localize('updateContainerAppFail', 'Failed to update container app "{0}".', context.containerApp?.name);
    protected getTreeItemLabel = (context: T): string => localize('updateContainerAppLabel', 'Update container app "{0}"', context.containerApp?.name);

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('updatingContainerApp', 'Updating container app...') });

        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        let ingress: Ingress | undefined;
        if (context.enableIngress) {
            ingress = {
                ...enabledIngressDefaults,
                ...containerAppEnvelope.configuration.ingress ?? {}, // Overwrite any default settings if we already have previous configurations set
                external: context.enableExternal ?? containerAppEnvelope.configuration.ingress?.external,
                targetPort: context.targetPort ?? containerAppEnvelope.configuration.ingress?.targetPort,
            };
        } else if (context.enableIngress === false) {
            ingress = undefined;
        } else {
            // If enableIngress is not set, just default to the previous settings if they exist
            ingress = containerAppEnvelope.configuration.ingress;
        }

        containerAppEnvelope.configuration.ingress = ingress;
        containerAppEnvelope.configuration.secrets = context.secrets;
        containerAppEnvelope.configuration.registries = context.registryCredentials;

        containerAppEnvelope.template = context.template ?? containerAppEnvelope.template ?? {};
        containerAppEnvelope.template.containers ||= [];

        const newContainer: Container = {
            env: context.environmentVariables,
            image: context.image,
            name: getContainerNameForImage(nonNullProp(context, 'image')),
        };
        if (context.containersIdx) {
            containerAppEnvelope.template.containers[context.containersIdx] = newContainer;
        } else {
            containerAppEnvelope.template.containers = [newContainer];
        }

        // Related: https://github.com/microsoft/vscode-azurecontainerapps/pull/805
        const retries = 4;
        await retry(
            async (): Promise<void> => {
                await ext.state.runWithTemporaryDescription(containerApp.id, localize('updating', 'Updating...'), async () => {
                    context.containerApp = await updateContainerApp(context, context.subscription, containerAppEnvelope);
                    ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
                });
            },
            {
                onFailedAttempt: (err: retry.FailedAttemptError) => {
                    if (context.newRegistryCredentialType !== RegistryCredentialType.DockerLogin || !/authentication\srequired/i.test(err.message)) {
                        throw err;
                    }
                },
                retries,
                minTimeout: 2 * 1000,
            }
        );
    }

    public shouldExecute(context: T): boolean {
        return !!context.containerApp;
    }

    public addExecuteSteps(): AzureWizardExecuteStep<T>[] {
        return [new ContainerAppUpdateVerifyStep()];
    }
}

/**
 * Verifies that the updated container app does not have runtime issues.
 * Sometimes an image builds and deploys successfully but fails to run.
 * This leads to the Azure Container Apps service silently reverting to the last successful revision.
 */
class ContainerAppUpdateVerifyStep<T extends ImageSourceContext & IngressContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 681;
    public stepName: string = 'containerAppUpdateVerifyStep';

    private _revisionId: string | undefined;
    private _revisionStatus: string | undefined;
    private _client: ContainerAppsAPIClient;

    protected getOutputLogSuccess = (context: T): string => localize('verifyContainerAppSuccess', 'Successfully verified container app "{0}" runtime status.', context.containerApp?.name);
    protected getOutputLogFail = (context: T): string => localize('updateContainerAppFail', 'Failed to verify successful container app "{0}" runtime status.', context.containerApp?.name);
    protected getTreeItemLabel = (): string => localize('verifyContainerAppLabel', 'Verify successful container app runtime status');

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('verifyingContainerApp', 'Verifying container app runtime status...') });

        // Estimated time (n=1): 1s
        this._revisionId = await this.waitAndGetRevisionId(context, 1000 * 10 /** maxWaitTimeMs */);

        if (!this._revisionId) {
            throw new Error(localize('revisionCheckTimeout', 'Status check timed out - unable to find the newly deployed container app revision.'));
        }

        const containerAppName: string = nonNullValueAndProp(context.containerApp, 'name');

        // Estimated time (n=1): 20s
        this._revisionStatus = await this.waitAndGetRevisionStatus(context, this._revisionId, containerAppName, 1000 * 60 /** maxWaitTimeMs */);

        const parsedResource = parseAzureResourceId(this._revisionId);

        try {
            await this.addLogAttributes(context, parsedResource.resourceName);
        } catch { /** Do nothing */ }

        if (!this._revisionStatus) {
            throw new Error(localize('revisionStatusTimeout', 'Status check timed out - unable to determine the final status of the newly deployed container app revision "{0}".', parsedResource.resourceName));
        } else if (this._revisionStatus !== KnownRevisionRunningState.Running) {
            throw new Error(localize(
                'unexpectedRevisionState',
                'Deployment failed - the container app revision "{0}" failed to start successfully. The service will attempt to revert to the previous working revision. This is most often caused by a container runtime error, such as a crash or misconfiguration.',
                parsedResource.resourceName,
            ));
        }
    }

    public shouldExecute(context: T): boolean {
        return !!context.containerApp;
    }

    private async waitAndGetRevisionId(context: T, maxWaitTimeMs: number): Promise<string | undefined> {
        this._client ??= await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);

        const resourceGroupName: string = nonNullValueAndProp(context.containerApp, 'resourceGroup');
        const containerAppName: string = nonNullValueAndProp(context.containerApp, 'name');

        let revision: Revision | undefined;
        let revisions: Revision[];

        const start: number = Date.now();

        while (true) {
            if ((Date.now() - start) > maxWaitTimeMs) {
                break;
            }

            await delay(1000);

            revisions = await uiUtils.listAllIterator(this._client.containerAppsRevisions.listRevisions(resourceGroupName, containerAppName));
            revision = revisions.find(r => r.template?.containers?.[context.containersIdx ?? 0].image === context.image);

            if (revision) {
                return revision.id;
            }
        }

        return undefined;
    }

    private async waitAndGetRevisionStatus(context: T, revisionId: string, containerAppName: string, maxWaitTimeMs: number): Promise<string | undefined> {
        this._client ??= await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);
        const parsedRevision = parseAzureResourceId(revisionId);

        let revision: Revision;
        const start: number = Date.now();

        while (true) {
            if ((Date.now() - start) > maxWaitTimeMs) {
                break;
            }

            await delay(2000);

            revision = await this._client.containerAppsRevisions.getRevision(parsedRevision.resourceGroup, containerAppName, parsedRevision.resourceName);

            if (
                revision.provisioningState === KnownRevisionProvisioningState.Deprovisioning ||
                revision.provisioningState === KnownRevisionProvisioningState.Provisioning ||
                revision.runningState === KnownRevisionRunningState.Processing ||
                revision.runningState === 'Activating' // For some reason this isn't listed in the enum
            ) {
                continue;
            }

            return revision.runningState;
        }

        return undefined;
    }

    private async addLogAttributes(context: T, revisionName: string) {
        const workspaceId = context.managedEnvironment.appLogsConfiguration?.logAnalyticsConfiguration?.customerId;
        if (!workspaceId) {
            return;
        }

        const logsQueryClient = new LogsQueryClient(await context.createCredentialsForScopes(["https://api.loganalytics.io/.default"]));
        const query = `
ContainerAppConsoleLogs_CL
| where RevisionName_s == "${revisionName}"
| project TimeGenerated, Stream_s, Log_s
| order by TimeGenerated desc
`;

        const queryResult = await logsQueryClient.queryWorkspace(workspaceId, query, {
            // <= 5 min (ISO 8601)
            duration: 'PT5M'
        });

        if (queryResult.status !== LogsQueryResultStatus.Success) {
            return;
        }

        let content: string = '';
        const table: LogsTable = queryResult.tables[0];

        content += table.columnDescriptors.map(c => c.name).join(',') + '\n';
        for (const row of table.rows) {
            if (!Array.isArray(row)) {
                continue;
            }

            for (const r of row) {
                if (r instanceof Date) {
                    content += r.toLocaleString() + ' ';
                } else {
                    content += String(r) + ' ';
                }
            }

            content += '\n';
        }

        const logs: LogActivityAttributes = {
            name: 'Container App Console Logs',
            description: `Historical application (container runtime) logs for revision "${revisionName}". When a container app update cannot be successfully verified, these should be inspected to help identify the root cause.`,
            content,
        };

        context.activityAttributes ??= {};
        context.activityAttributes.logs ??= [];
        context.activityAttributes?.logs.push(logs);
    }
}

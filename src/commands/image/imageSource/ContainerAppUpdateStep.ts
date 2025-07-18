/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownRevisionProvisioningState, KnownRevisionRunningState, type Container, type ContainerAppsAPIClient, type Ingress, type Revision } from "@azure/arm-appcontainers";
import { LogsQueryResultStatus, type LogsTable } from "@azure/monitor-query";
import { parseAzureResourceId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStepWithActivityOutput, createSubscriptionContext, nonNullProp, nonNullValueAndProp, parseError, type AzureWizardExecuteStep, type IParsedError, type LogActivityAttributes } from "@microsoft/vscode-azext-utils";
import * as retry from "p-retry";
import { type Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { type ContainerAppUpdateTelemetryProps } from "../../../telemetry/ContainerAppUpdateTelemetryProps";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { getContainerEnvelopeWithSecrets, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { createContainerAppsAPIClient, createLogsQueryClient } from "../../../utils/azureClients";
import { delay } from "../../../utils/delay";
import { localize } from "../../../utils/localize";
import { type IngressContext } from "../../ingress/IngressContext";
import { enabledIngressDefaults } from "../../ingress/enableIngress/EnableIngressStep";
import { RegistryCredentialType } from "../../registryCredentials/RegistryCredentialsAddConfigurationListStep";
import { updateContainerApp } from "../../updateContainerApp";
import { type ImageSourceContext } from "./ImageSourceContext";
import { getContainerNameForImage } from "./containerRegistry/getContainerNameForImage";

type ContainerAppUpdateContext = ImageSourceContext & IngressContext & SetTelemetryProps<ContainerAppUpdateTelemetryProps>;

export class ContainerAppUpdateStep<T extends ContainerAppUpdateContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
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
 * Verifies that the recently updated container app did not have any startup issues.
 *
 * Note: Sometimes an image builds and deploys successfully but fails to run.
 * This leads to the Azure Container Apps service silently reverting to the last successful revision.
 */
class ContainerAppUpdateVerifyStep<T extends ContainerAppUpdateContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 681;
    public stepName: string = 'containerAppUpdateVerifyStep';

    private _client: ContainerAppsAPIClient;

    protected getOutputLogSuccess = (context: T): string => localize('verifyContainerAppSuccess', 'Verified container app "{0}" deployment started successfully.', context.containerApp?.name);
    protected getOutputLogFail = (context: T): string => localize('updateContainerAppFail', 'Failed to verify container app "{0}" deployment started successfully.', context.containerApp?.name);
    protected getTreeItemLabel = (): string => localize('verifyContainerAppLabel', 'Verify container app deployment started successfully');

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('verifyingContainerApp', 'Verifying container app startup status...') });
        const containerAppName: string = nonNullValueAndProp(context.containerApp, 'name');

        // Estimated time (n=1): 1s
        const revisionId: string | undefined = await this.waitAndGetRevisionId(context, 1000 * 10 /** maxWaitTimeMs */);
        if (!revisionId) {
            throw new Error(localize('revisionCheckTimeout', 'Status check timed out before retrieving the latest deployed container app revision.'));
        }

        // Estimated time (n=1): 20s
        const revisionStatus: string | undefined = await this.waitAndGetRevisionStatus(context, revisionId, containerAppName, 1000 * 60 /** maxWaitTimeMs */);

        const parsedResource = parseAzureResourceId(revisionId);
        if (!revisionStatus) {
            throw new Error(localize('revisionStatusTimeout', 'Status check timed out for the deployed container app revision "{0}".', parsedResource.resourceName));
        } else if (revisionStatus !== KnownRevisionRunningState.Running) {
            try {
                // Try to query and provide any logs to the LLM before throwing
                await this.tryAddLogAttributes(context, parsedResource.resourceName);
            } catch (error) {
                const perr: IParsedError = parseError(error);
                ext.outputChannel.appendLog(localize('logQueryError', 'Error encountered while trying to verify container app revision logs through log query platform.'));
                ext.outputChannel.appendLog(perr.message);
            }

            throw new Error(localize(
                'unexpectedRevisionState',
                'The deployed container app revision "{0}" has failed to start. The service will try to revert to the previous working revision. Inspect the application logs to address startup issues.',
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
            revision = revisions.find(r => r.name === context.containerApp?.latestRevisionName && r.template?.containers?.[context.containersIdx ?? 0].image === context.image);

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
                revision.runningState === 'Activating' // For some reason this isn't listed in the known enum
            ) {
                continue;
            }

            return revision.runningState;
        }

        return undefined;
    }

    /**
     * Try to query for any logs associated with the revision and add them to the Copilot activity attributes
     */
    private async tryAddLogAttributes(context: T, revisionName: string) {
        context.telemetry.properties.targetCloud = context.environment.name;
        context.telemetry.properties.addedContainerAppUpdateVerifyLogs = 'false';

        // Basic validation check since we're including a name directly in the query
        if (revisionName.length > 54 || !/^[\w-]+$/.test(revisionName)) {
            const invalidName: string = localize('unexpectedRevisionName', 'Internal warning: Encountered an unexpected revision name format "{0}". Skipping log query for the revision status check.', revisionName);
            ext.outputChannel.appendLog(invalidName);
            throw new Error(invalidName);
        }

        const workspaceId = context.managedEnvironment.appLogsConfiguration?.logAnalyticsConfiguration?.customerId;
        if (!workspaceId) {
            return;
        }

        const logsQueryClient = await createLogsQueryClient(context);
        const query = `
ContainerAppConsoleLogs_CL
| where RevisionName_s == "${revisionName}"
| project TimeGenerated, Stream_s, Log_s
| order by TimeGenerated desc
`;

        const queryResult = await logsQueryClient.queryWorkspace(workspaceId, query, {
            // <= 5 min ago (ISO 8601)
            duration: 'PT5M'
        });

        if (queryResult.status !== LogsQueryResultStatus.Success) {
            return;
        }

        const lines: string[] = [];
        const table: LogsTable = queryResult.tables[0];

        lines.push(table.columnDescriptors.map(c => c.name ?? '{columnName}').join(','));
        for (const row of table.rows) {
            if (!Array.isArray(row)) {
                continue;
            }
            lines.push(row.map(r => r instanceof Date ? r.toLocaleString() : String(r)).join(' '));
        }

        const logs: LogActivityAttributes = {
            name: 'Container App Console Logs',
            description: `Container runtime logs for revision "${revisionName}" (<= 5 min ago). When a container app update was unsuccessful, these should be inspected to help identify the root cause.`,
            content: lines.join('\n'),
        };

        context.activityAttributes ??= {};
        context.activityAttributes.logs ??= [];
        context.activityAttributes?.logs.push(logs);
        context.telemetry.properties.addedContainerAppUpdateVerifyLogs = 'true';
    }
}

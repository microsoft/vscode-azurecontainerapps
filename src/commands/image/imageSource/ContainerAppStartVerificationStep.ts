/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownRevisionProvisioningState, KnownRevisionRunningState, type ContainerAppsAPIClient, type Revision } from "@azure/arm-appcontainers";
import { LogsQueryResultStatus, type LogsTable } from "@azure/monitor-query";
import { parseAzureResourceId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStepWithActivityOutput, createSubscriptionContext, maskUserInfo, nonNullValueAndProp, parseError, type IParsedError, type LogActivityAttributes } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { type ContainerAppStartVerificationTelemetryProps } from "../../../telemetry/ContainerAppStartVerificationTelemetryProps";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { createContainerAppsAPIClient, createLogsQueryClientPublicCloud } from "../../../utils/azureClients";
import { delayWithExponentialBackoff } from "../../../utils/delay";
import { localize } from "../../../utils/localize";
import { type IngressContext } from "../../ingress/IngressContext";
import { type ImageSourceContext } from "./ImageSourceContext";

type ContainerAppStartVerificationContext = ImageSourceContext & IngressContext & SetTelemetryProps<ContainerAppStartVerificationTelemetryProps>;

/**
 * Verifies that the recently deployed container app did not have any startup issues.
 *
 * Note: Sometimes an image builds and deploys successfully but fails to run.
 * This leads to the Azure Container Apps service silently reverting to the last successful revision.
 */
export class ContainerAppStartVerificationStep<T extends ContainerAppStartVerificationContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 690;
    public stepName: string = 'containerAppStartVerificationStep';

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
                context.telemetry.properties.targetCloud = context.environment.name;

                // Try to query and provide any logs to the LLM before throwing
                await this.tryAddLogAttributes(context, parsedResource.resourceName);
                context.telemetry.properties.addedContainerAppStartLogs = 'true';
            } catch (error) {
                const perr: IParsedError = parseError(error);
                ext.outputChannel.appendLog(localize('logQueryError', 'Error encountered while trying to verify container app revision logs through log query platform.'));
                ext.outputChannel.appendLog(perr.message);
                context.telemetry.properties.addedContainerAppStartLogs = 'false';
                context.telemetry.properties.getLogsQueryError = maskUserInfo(perr.message, []);
            }

            throw new Error(localize(
                'unexpectedRevisionState',
                'The deployed container app revision "{0}" has failed to start. If you are updating an existing container app, the service will try to revert to the previous working revision. Inspect the application logs to check for any known startup issues.',
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

        let attempt: number = 1;
        const start: number = Date.now();

        while (true) {
            if ((Date.now() - start) > maxWaitTimeMs) {
                break;
            }

            await delayWithExponentialBackoff(attempt, 1000 /** baseDelayMs */, maxWaitTimeMs);
            attempt++;

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
        let attempt: number = 1;
        const start: number = Date.now();

        while (true) {
            if ((Date.now() - start) > maxWaitTimeMs) {
                break;
            }

            await delayWithExponentialBackoff(attempt, 1000 /** baseDelayMs */, maxWaitTimeMs);
            attempt++;

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
        // Basic validation check since we're including a name directly in the query
        if (revisionName.length > 54 || !/^[\w-]+$/.test(revisionName)) {
            const invalidName: string = localize('unexpectedRevisionName', 'Internal warning: Encountered an unexpected revision name format "{0}". Skipping log query for the revision status check.', revisionName);
            ext.outputChannel.appendLog(invalidName);
            throw new Error(invalidName);
        }

        const workspaceId = context.managedEnvironment?.appLogsConfiguration?.logAnalyticsConfiguration?.customerId;
        if (!workspaceId) {
            return;
        }

        const logsQueryClient = await createLogsQueryClientPublicCloud(context);
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

        if (!table.rows.length) {
            // Note: Often times we will only be able to find logs when the image source was for `RemoteAcrBuild`
            throw new Error(localize('noQueryLogs', 'No query logs were found for revision "{0}".', revisionName));
        }

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
    }
}

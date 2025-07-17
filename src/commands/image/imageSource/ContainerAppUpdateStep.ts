/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownRevisionProvisioningState, KnownRevisionRunningState, type Container, type ContainerAppsAPIClient, type Ingress, type Revision } from "@azure/arm-appcontainers";
import { parseAzureResourceId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStepWithActivityOutput, createSubscriptionContext, nonNullProp, nonNullValueAndProp, type AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
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
        this.options.continueOnFail = true;
        progress.report({ message: localize('verifyingContainerApp', 'Verifying container app runtime status...') });

        const maxWaitTimeMs: number = 1000 * 20;
        this._revisionId = await this.waitAndGetRevisionById(context, maxWaitTimeMs);

        if (!this._revisionId) {
            throw new Error(localize('revisionCheckTimeout', 'Status check timed out - unable to find the newly deployed container app revision.'));
        }

        const containerAppName: string = nonNullValueAndProp(context.containerApp, 'name');
        this._revisionStatus = await this.waitAndGetRevisionStatus(context, this._revisionId, containerAppName, maxWaitTimeMs);

        const parsedResource = parseAzureResourceId(this._revisionId);

        if (!this._revisionStatus) {
            throw new Error(localize('revisionStatusTimeout', 'Status check timed out - unable to determine the final status of the newly deployed container app revision "{0}".', parsedResource.resourceName));
        } else if (this._revisionStatus !== KnownRevisionRunningState.Running) {
            throw new Error(localize(
                'unexpectedRevisionState',
                'Deployment failed - the container app revision "{0}" did not start successfully and has reverted to the previous working revision. This is most often caused by a container runtime error, such as a crash or misconfiguration.',
                parsedResource.resourceName,
            ));
        }
    }

    public shouldExecute(context: T): boolean {
        return !!context.containerApp;
    }

    private async waitAndGetRevisionById(context: T, maxWaitTimeMs: number): Promise<string | undefined> {
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

            revisions = await uiUtils.listAllIterator(this._client.containerAppsRevisions.listRevisions(resourceGroupName, containerAppName));
            revision = revisions.find(r => r.template?.containers?.[context.containersIdx ?? 0].image === context.image);

            if (revision) {
                console.log(`Found revision: ${revision.id}`);
                return revision.id;
            }

            console.log('Checking')
            await delay(1000);
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

            await delay(1000);

            revision = await this._client.containerAppsRevisions.getRevision(parsedRevision.resourceGroup, containerAppName, parsedRevision.resourceName);

            if (
                revision.provisioningState === KnownRevisionProvisioningState.Deprovisioning ||
                revision.provisioningState === KnownRevisionProvisioningState.Provisioning ||
                revision.runningState === KnownRevisionRunningState.Processing
            ) {
                console.log(`Checking revision status: ${revision.provisioningState} - ${revision.runningState}`);
                continue;
            }

            console.log(revision.runningState);
            return revision.runningState;
        }

        return undefined;
    }
}

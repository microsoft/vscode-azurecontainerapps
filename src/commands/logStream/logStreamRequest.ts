/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AbortController } from '@azure/abort-controller';
import { ContainerAppsAPIClient } from '@azure/arm-appcontainers';
import { ServiceClient } from '@azure/core-client';
import { createHttpHeaders, createPipelineRequest } from '@azure/core-rest-pipeline';
import { createGenericClient } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, createSubscriptionContext, nonNullValue, parseError } from "@microsoft/vscode-azext-utils";
import * as vscode from 'vscode';
import { ext } from '../../extensionVariables';
import { createContainerAppsAPIClient } from '../../utils/azureClients';
import { localize } from '../../utils/localize';
import { IStreamLogsContext } from './IStreamLogsContext';

export interface ILogStream extends vscode.Disposable {
    isConnected: boolean;
    outputChannel: vscode.OutputChannel;
    data: {
        containerApp?: string;
        revision?: string;
        replica?: string;
        container?: string;
    }
}

const logStreams: Map<string, ILogStream> = new Map<string, ILogStream>();

export function getActiveLogStreams(context: IStreamLogsContext): Map<string, ILogStream> {
    const activeStreams = new Map<string, ILogStream>();
    for (const [key, value] of logStreams) {
        if (value.data.containerApp === context.containerApp.name && value.data.revision === context.revision?.name && value.isConnected) {
            activeStreams.set(key, value);
        }
    }
    return activeStreams;
}

function getLogStreamId(context: IStreamLogsContext) {
    return `${context.container?.containerId}${context.container?.logStreamEndpoint}`;
}

export async function logStreamRequest(context: IStreamLogsContext): Promise<ILogStream> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);
    const token = await client.containerApps.getAuthToken(context.resourceGroupName, context.containerApp.name);

    const endpoint = nonNullValue(context.container?.logStreamEndpoint);

    const logStreamId = getLogStreamId(context);
    const logStream: ILogStream | undefined = logStreams.get(logStreamId);
    if (logStream && logStream.isConnected) {
        logStream.outputChannel.show();
        void context.ui.showWarningMessage(localize('logStreamAlreadyActive', 'The log-streaming service for "{0}" is already active.', context.replica?.name));
        return logStream;
    } else {
        const outputChannel: vscode.OutputChannel = logStream ? logStream.outputChannel : vscode.window.createOutputChannel(localize('logStreamLabel', '{0} ({1})', context.replica?.name, context.container?.name));
        ext.context.subscriptions.push(outputChannel);
        outputChannel.show();
        outputChannel.appendLine(localize('connectingToLogStream', 'Connecting to log stream...'));

        return await new Promise((onLogStreamCreated: (ls: ILogStream) => void): void => {
            void callWithTelemetryAndErrorHandling('containerApps.streamingLogs', async (_context) => {
                const abortController: AbortController = new AbortController();

                const genericClient: ServiceClient = await createGenericClient(context, undefined);
                const headers = createHttpHeaders({
                    authorization: `Bearer ${token.token}`
                })

                const logsResponse = await genericClient.sendRequest(createPipelineRequest({
                    method: "GET",
                    url: endpoint,
                    abortSignal: abortController.signal,
                    headers,
                    streamResponseStatusCodes: new Set<number>([200])
                }));

                await new Promise<void>((onLogStreamEnded: () => void, reject: (err: Error) => void): void => {
                    const newLogStream: ILogStream = {
                        dispose: (): void => {
                            logsResponse.readableStreamBody?.removeAllListeners();
                            abortController.abort();
                            outputChannel.show();
                            outputChannel.appendLine(localize('logStreamDisconnected', 'Disconnected from log-streaming service.'));
                            newLogStream.isConnected = false;
                            void onLogStreamEnded();
                        },
                        isConnected: true,
                        outputChannel: outputChannel,
                        data: {
                            revision: context.revision?.name,
                            replica: context.replica?.name,
                            container: context.container?.name,
                            containerApp: context.containerApp.name,
                        }
                    };

                    logsResponse.readableStreamBody?.on('data', (chunk: Buffer | string) => {
                        outputChannel.append(chunk.toString());
                    }).on('error', (err: Error) => {
                        newLogStream.isConnected = false;
                        outputChannel.show();
                        outputChannel.appendLine(localize('logStreamError', 'Error connecting to log-streaming service:'));
                        outputChannel.appendLine(parseError(err).message);
                        reject(err);
                    }).on('complete', () => {
                        newLogStream.dispose();
                    });
                    logStreams.set(logStreamId, newLogStream);
                    onLogStreamCreated(newLogStream);
                });
            });
        });
    }
}

export async function disconnectLogStreaming(context: IStreamLogsContext): Promise<void> {
    const allStreams = context.logStreamToStop ? [context.logStreamToStop] : getActiveLogStreams(context);

    for (const streams of allStreams.values()) {
        if (streams && streams.isConnected) {
            streams.dispose();
        } else {
            await context.ui.showWarningMessage(localize('alreadyDisconnected', 'The log-streaming service is already disconnected.'));
        }
    }
}

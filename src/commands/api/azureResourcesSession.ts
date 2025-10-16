/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { nonNullValue } from "@microsoft/vscode-azext-utils";
import { apiUtils, AzExtResourceType, AzExtSignatureCredentialManager, type AzExtCredentialManager, type AzureExtensionApi, type AzureResourcesExtensionApi, type AzureResourcesExtensionAuthApi } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { delayWithExponentialBackoff } from "../../utils/delay";
import { localize } from "../../utils/localize";
import { azureContainerAppsApiVersion } from "./getAzureContainerAppsApiProvider";

const azureResourcesApiVersion = '3.0.0';
const azureResourcesExtId = 'ms-azuretools.vscode-azureresourcegroups';

const azureContainerAppsCredentialManager: AzExtCredentialManager<string> = new AzExtSignatureCredentialManager();

export async function createAzureResourcesSession(): Promise<void> {
    const azureContainerAppsExtId: string = ext.context.extension.id;
    const apiReady: boolean = await verifyAzureContainerAppsApiReady(azureContainerAppsExtId, 1000 * 10);

    if (!apiReady) {
        // Add output log?
    }

    const resourcesApi = await getClientExtensionApi<AzureResourcesExtensionAuthApi>(azureResourcesExtId, azureResourcesApiVersion);
    const containerAppsCredential: string = await azureContainerAppsCredentialManager.createCredential(azureContainerAppsExtId);
    await resourcesApi.createAzureResourcesApiSession(azureContainerAppsExtId, azureContainerAppsApiVersion, containerAppsCredential);
}

async function verifyAzureContainerAppsApiReady(azureContainerAppsExtId: string, maxWaitTimeMs: number): Promise<boolean> {
    let attempts: number = 1;
    const start: number = Date.now();

    while (true) {
        if ((Date.now() - start) > maxWaitTimeMs) {
            break;
        }

        await delayWithExponentialBackoff(attempts, 500 /** baseDelayMs */, maxWaitTimeMs);
        attempts++;

        try {
            if (await getClientExtensionApi<AzureExtensionApi>(azureContainerAppsExtId, azureContainerAppsApiVersion)) {
                return true;
            }
        } catch { /** Do nothing */ }
    }

    return false;
}

export async function receiveAzureResourcesSession(azureResourcesCredential: string, containerAppsCredential: string): Promise<void> {
    if (!azureResourcesCredential || !containerAppsCredential) {
        return;
    }

    const azureContainerAppsExtId: string = ext.context.extension.id;
    const { verified } = await azureContainerAppsCredentialManager.verifyCredential(containerAppsCredential, azureContainerAppsExtId);

    if (!verified) {
        return;
    }

    ext.rgApiV2 = nonNullValue(await getAzureResourcesApi(azureContainerAppsExtId, azureResourcesCredential));
    ext.rgApiV2.resources.registerAzureResourceBranchDataProvider(AzExtResourceType.ContainerAppsEnvironment, ext.branchDataProvider);
}

async function getAzureResourcesApi(azureContainerAppExtId: string, azureResourcesCredential: string): Promise<AzureResourcesExtensionApi | undefined> {
    const resourcesApi = await getClientExtensionApi<AzureResourcesExtensionAuthApi>(azureResourcesExtId, azureResourcesApiVersion);
    return await resourcesApi.getAzureResourcesApi(azureContainerAppExtId, azureResourcesCredential);
}

async function getClientExtensionApi<T extends AzureExtensionApi>(clientExtensionId: string, clientExtensionVersion: string): Promise<T> {
    const extensionProvider = await apiUtils.getExtensionExports<apiUtils.AzureExtensionApiProvider>(clientExtensionId);
    if (extensionProvider) {
        return extensionProvider.getApi<T>(clientExtensionVersion);
    } else {
        throw new Error(localize('noClientExt', 'Could not find Azure extension API for extension ID "{0}".', clientExtensionId));
    }
}

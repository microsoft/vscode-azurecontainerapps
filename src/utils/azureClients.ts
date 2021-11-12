/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from '@azure/arm-appservice';
import { ContainerRegistryManagementClient, ContainerRegistryManagementModels } from '@azure/arm-containerregistry';
import { ContainerRegistryClient, KnownContainerRegistryAudience } from '@azure/container-registry';
import { VisualStudioCodeCredential } from '@azure/identity';
import { appendExtensionUserAgent, AzExtClientContext, parseClientContext } from 'vscode-azureextensionui';

// Lazy-load @azure packages to improve startup performance.
// NOTE: The client is the only import that matters, the rest of the types disappear when compiled to JavaScript

export async function createWebSiteClient(context: AzExtClientContext): Promise<WebSiteManagementClient> {
    const clientContext = parseClientContext(context);
    const cred = new VisualStudioCodeCredential({ tenantId: clientContext.tenantId })
    return new WebSiteManagementClient(cred, clientContext.subscriptionId,
        {
            endpoint: 'https://brazilus.management.azure.com/',
            userAgentOptions: { userAgentPrefix: appendExtensionUserAgent() }
        });
}

export async function createContainerRegistryManagementClient(context: AzExtClientContext): Promise<ContainerRegistryManagementClient> {
    const clientContext = parseClientContext(context);
    const cred = new VisualStudioCodeCredential({ tenantId: clientContext.tenantId })
    return new ContainerRegistryManagementClient(cred, clientContext.subscriptionId);
}

export function createContainerRegistryClient(registry: ContainerRegistryManagementModels.Registry): ContainerRegistryClient {
    return new ContainerRegistryClient(`https://${registry.loginServer}`, new VisualStudioCodeCredential({}),
        { audience: KnownContainerRegistryAudience.AzureResourceManagerPublicCloud });
}

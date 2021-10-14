/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from '@azure/arm-appservice';
import { ResourceManagementClient } from '@azure/arm-resources';
import { VisualStudioCodeCredential } from '@azure/identity';
import { appendExtensionUserAgent, AzExtClientContext, parseClientContext } from 'vscode-azureextensionui';

// Lazy-load @azure packages to improve startup performance.
// NOTE: The client is the only import that matters, the rest of the types disappear when compiled to JavaScript

export async function createWebSiteClient(context: AzExtClientContext): Promise<WebSiteManagementClient> {
    const clientContext = parseClientContext(context);
    if (clientContext.credentials.getToken) {
        const cred = new VisualStudioCodeCredential({ tenantId: clientContext.tenantId })
        return new WebSiteManagementClient(cred, clientContext.subscriptionId,
            {
                endpoint: 'https://brazilus.management.azure.com/',
                userAgentOptions: { userAgentPrefix: appendExtensionUserAgent() }
            });
    }

    throw new Error();
}

export async function createResourceClient(context: AzExtClientContext): Promise<ResourceManagementClient> {
    const clientContext = parseClientContext(context);
    if (clientContext.credentials.getToken) {
        const cred = new VisualStudioCodeCredential({ tenantId: clientContext.tenantId })
        return new ResourceManagementClient(cred, clientContext.subscriptionId);
    }

    throw new Error();
}

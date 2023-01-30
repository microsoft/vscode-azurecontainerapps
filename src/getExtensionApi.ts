/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { getExtensionExports } from "@microsoft/vscode-azext-utils";
import { AzureExtensionApiProvider } from "@microsoft/vscode-azext-utils/api";
import { AzureResourcesApi } from "@microsoft/vscode-azext-utils/hostapi.v2";
import { localize } from "./utils/localize";

export async function getResourceGroupsApi(): Promise<AzureResourcesApi> {
    const rgApiProvider = await getExtensionExports<AzureExtensionApiProvider>('ms-azuretools.vscode-azureresourcegroups');
    if (rgApiProvider) {
        return rgApiProvider.getApi<AzureResourcesApi>('2.0.0', {
            extensionId: 'ms-azuretools.vscode-azurecontainerapps',
        });
    } else {
        throw new Error(localize('noResourceGroupExt', 'Could not find the Azure Resource Groups extension'));
    }
}

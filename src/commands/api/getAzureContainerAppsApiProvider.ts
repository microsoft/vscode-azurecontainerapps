/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { createApiProvider, type apiUtils } from "@microsoft/vscode-azext-utils";
import { deployWorkspaceProjectApi } from "./deployWorkspaceProjectApi";
import type * as api from "./vscode-azurecontainerapps.api";

export function getAzureContainerAppsApiProvider(): apiUtils.AzureExtensionApiProvider {
    return createApiProvider([<api.AzureContainerAppsExtensionApi>{
        // Todo: Change this to 0.0.2 later.  0.0.2 is backwards compatible anyway so this change should be fine either way.
        // For some reason it's causing a block on Function side, so just keep it at 0.0.1 until we figure out why
        apiVersion: '0.0.1',
        deployWorkspaceProject: deployWorkspaceProjectApi
    }]);
}

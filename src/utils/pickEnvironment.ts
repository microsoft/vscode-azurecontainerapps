/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { azureResourceExperience, IActionContext } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType } from "@microsoft/vscode-azureresources-api";
import { ext } from "../extensionVariables";
import { ManagedEnvironmentItem } from "../tree/ManagedEnvironmentItem";

export async function pickEnvironment(context: IActionContext): Promise<ManagedEnvironmentItem> {
    return await azureResourceExperience<ManagedEnvironmentItem>(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, AzExtResourceType.ContainerAppsEnvironment);
}

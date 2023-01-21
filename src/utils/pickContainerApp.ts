/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtResourceType, azureResourceExperience, IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../extensionVariables";
import { ContainerAppItem } from "../tree/ContainerAppItem";

export async function pickContainerApp(context: IActionContext): Promise<ContainerAppItem> {
    return await azureResourceExperience<ContainerAppItem>(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, AzExtResourceType.ContainerAppsEnvironment, {
        include: ContainerAppItem.contextValueRegExp,
    });
}

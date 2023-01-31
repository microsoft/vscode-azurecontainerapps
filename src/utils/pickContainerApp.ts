/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { azureResourceExperience, IActionContext } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType } from "@microsoft/vscode-azureresources-api";
import { ext } from "../extensionVariables";
import { ContainerAppItem } from "../tree/ContainerAppItem";

// TODO: support creating a new container app from picker
export async function pickContainerApp(context: IActionContext, excludePick: boolean): Promise<ContainerAppItem> {
    const doNotInclude: boolean = excludePick && !ContainerAppItem.ingressEnabled;
    return await azureResourceExperience<ContainerAppItem>(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, AzExtResourceType.ContainerAppsEnvironment, {
        include: ContainerAppItem.contextValueRegExp,
        exclude: doNotInclude ? ContainerAppItem.contextValueRegExp : undefined,
    });
}

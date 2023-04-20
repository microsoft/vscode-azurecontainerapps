/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Replica, ReplicaContainer, Revision } from "@azure/arm-appcontainers";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import type { ContainerAppModel } from "../../tree/ContainerAppItem";
import { ILogStream } from "./logStreamRequest";

export interface IStreamLogsContext extends IActionContext {
    containerApp: ContainerAppModel;
    subscription: AzureSubscription;
    resourceGroupName: string;

    revision?: Revision;
    replica?: Replica;
    container?: ReplicaContainer;

    logStreamToStop?: ILogStream;
}

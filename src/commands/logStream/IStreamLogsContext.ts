/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Replica, ReplicaContainer, Revision } from "@azure/arm-appcontainers";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ContainerAppModel } from "../../tree/ContainerAppItem";
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

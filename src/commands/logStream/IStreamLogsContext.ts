/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Replica, ReplicaContainer, Revision } from "@azure/arm-appcontainers";
import type { ContainerAppModel } from "../../tree/ContainerAppItem";
import type { IContainerAppContext } from "../IContainerAppContext";
import type { ILogStream } from "./logStreamRequest";

export interface IStreamLogsContext extends IContainerAppContext {
    // Make containerApp _required_
    containerApp: ContainerAppModel;

    resourceGroupName: string;

    revision?: Revision;
    replica?: Replica;
    container?: ReplicaContainer;

    logStreamToStop?: ILogStream;
}

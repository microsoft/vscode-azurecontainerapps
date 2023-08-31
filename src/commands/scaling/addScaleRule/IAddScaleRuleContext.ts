/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaleRule } from "@azure/arm-appcontainers";
import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { ContainerAppModel } from "../../../tree/ContainerAppItem";
import type { IContainerAppContext } from "../../IContainerAppContext";

export interface IAddScaleRuleContext extends IContainerAppContext, ExecuteActivityContext {
    // Make containerApp _required_
    containerApp: ContainerAppModel;

    /**
     * The name of the parent resource (`ContainerAppModel | Revision`)
     */
    parentResourceName: string;

    // Base Rule Properties
    newRuleName?: string;
    newRuleType?: string;

    // HTTP Rule Properties
    newHttpConcurrentRequests?: string;

    // Queue Rule Properties
    newQueueName?: string;
    newQueueLength?: number;
    newQueueSecretRef?: string;
    newQueueTriggerParameter?: string;

    scaleRule?: ScaleRule;
}

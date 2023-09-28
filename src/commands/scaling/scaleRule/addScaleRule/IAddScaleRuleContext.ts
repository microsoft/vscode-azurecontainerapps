/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ScaleRule } from "@azure/arm-appcontainers";
import type { ContainerAppModel } from "../../../../tree/ContainerAppItem";
import type { ISecretContext } from "../../../secret/ISecretContext";
import type { ScaleRuleContext } from "../ScaleRuleContext";

export interface IAddScaleRuleContext extends ScaleRuleContext, ISecretContext {
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
    newQueueTriggerParameter?: string;

    scaleRule?: ScaleRule;
}

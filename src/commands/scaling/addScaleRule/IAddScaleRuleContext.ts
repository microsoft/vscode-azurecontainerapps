/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Scale, ScaleRule } from "@azure/arm-appcontainers";
import type { ContainerAppModel } from "../../../tree/ContainerAppItem";
import type { IContainerAppContext } from "../../IContainerAppContext";

export interface IAddScaleRuleContext extends IContainerAppContext {
    // Make containerApp _required_
    containerApp: ContainerAppModel;

    scale: Scale;
    scaleRules: ScaleRule[];

    // Base Rule Properties
    ruleName?: string;
    ruleType?: string;

    // HTTP Rule Properties
    concurrentRequests?: string;

    // Queue Rule Properties
    queueName?: string;
    queueLength?: number;
    secretRef?: string;
    triggerParameter?: string;

    scaleRule?: ScaleRule;
}

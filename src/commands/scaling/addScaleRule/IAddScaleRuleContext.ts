/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ScaleRule } from "@azure/arm-appcontainers";
import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { ContainerAppModel } from "../../../tree/ContainerAppItem";
import type { IContainerAppContext } from "../../IContainerAppContext";
import { ISecretContext } from "../../secret/ISecretContext";

export interface IAddScaleRuleContext extends IContainerAppContext, ISecretContext, ExecuteActivityContext {
    // Make containerApp _required_
    containerApp: ContainerAppModel;

    scaleRules: ScaleRule[];

    // Base Rule Properties
    ruleName?: string;
    ruleType?: string;

    // HTTP Rule Properties
    concurrentRequests?: string;

    // Queue Rule Properties (also leverages `ISecretContext` params)
    queueName?: string;
    queueLength?: number;
    triggerParameter?: string;

}

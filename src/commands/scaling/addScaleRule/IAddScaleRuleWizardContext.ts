/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Scale, ScaleRule } from "@azure/arm-appcontainers";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ContainerAppModel } from "../../../tree/ContainerAppItem";

export interface IAddScaleRuleWizardContext extends IActionContext {
    subscription: AzureSubscription;
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

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaleRule } from "@azure/arm-appcontainers";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppTreeItem } from "../../../tree/ContainerAppTreeItem";
import { ScaleRuleGroupTreeItem } from "../../../tree/ScaleRuleGroupTreeItem";
import { ScaleTreeItem } from "../../../tree/ScaleTreeItem";

export interface IAddScaleRuleWizardContext extends IActionContext {
    containerApp: ContainerAppTreeItem;
    scale: ScaleTreeItem;
    scaleRuleGroup: ScaleRuleGroupTreeItem;

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

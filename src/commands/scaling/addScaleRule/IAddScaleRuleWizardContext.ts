/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppTreeItem } from "../../../tree/ContainerAppTreeItem";
import { ScaleRuleGroupTreeItem } from "../../../tree/ScaleRuleGroupTreeItem";

export interface IAddScaleRuleWizardContext extends IActionContext {
    containerApp: ContainerAppTreeItem;
    treeItem: ScaleRuleGroupTreeItem;
    ruleName?: string;
    ruleType?: string;
    concurrentRequests?: string;
    queueName?: string;
    queueLength?: number;
    secretRef?: string;
    triggerParameter?: string;
}

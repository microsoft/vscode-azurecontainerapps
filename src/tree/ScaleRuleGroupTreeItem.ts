/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaleRule } from "@azure/arm-appcontainers";
import { AzExtParentTreeItem, AzExtTreeItem, AzureWizard, ICreateChildImplContext, IWizardOptions, nonNullProp, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { AddScaleRuleStep } from "../commands/scaling/addScaleRule/AddScaleRuleStep";
import { IAddScaleRuleWizardContext } from "../commands/scaling/addScaleRule/IAddScaleRuleWizardContext";
import { ScaleRuleNameStep } from "../commands/scaling/addScaleRule/ScaleRuleNameStep";
import { ScaleRuleTypeStep } from "../commands/scaling/addScaleRule/ScaleRuleTypeStep";
import { azResourceContextValue } from "../constants";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { ScaleRuleTreeItem } from "./ScaleRuleTreeItem";
import { ScaleTreeItem } from "./ScaleTreeItem";

export class ScaleRuleGroupTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'scaleRules';
    public readonly contextValue: string = `${ScaleRuleGroupTreeItem.contextValue}|${azResourceContextValue}`;
    public readonly parent: ScaleTreeItem;

    public label: string;
    public data: ScaleRule[];

    constructor(parent: ScaleTreeItem, data: ScaleRule[]) {
        super(parent);
        this.label = localize('scaleRules', 'Scale Rules');
        this.data = data;
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('symbol-constant');
    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        const scale: ScaleTreeItem = treeUtils.findNearestParent(this, ScaleTreeItem.prototype) as ScaleTreeItem;
        const containerApp: ContainerAppTreeItem = treeUtils.findNearestParent(this, ContainerAppTreeItem.prototype) as ContainerAppTreeItem;

        const title: string = localize('addScaleRuleTitle', 'Add Scale Rule');
        const wizardContext: IAddScaleRuleWizardContext = {
            ...context, containerApp, scale, scaleRuleGroup: this,
        };
        const wizardOptions: IWizardOptions<IAddScaleRuleWizardContext> = {
            title,
            promptSteps: [new ScaleRuleNameStep(), new ScaleRuleTypeStep()],
            executeSteps: [new AddScaleRuleStep()],
            showLoadingPrompt: true
        };
        const wizard: AzureWizard<IAddScaleRuleWizardContext> = new AzureWizard(wizardContext, wizardOptions);
        await wizard.prompt();
        context.showCreatingTreeItem(nonNullProp(wizardContext, 'ruleName'));
        await wizard.execute();
        return new ScaleRuleTreeItem(this, nonNullProp(wizardContext, "scaleRule"));
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        return this.createTreeItemsWithErrorHandling(
            this.data,
            'invalidRule',
            rule => new ScaleRuleTreeItem(this, rule),
            _rule => localize('invalidScalingRule', 'Invalid Scaling Rule')
        );
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}

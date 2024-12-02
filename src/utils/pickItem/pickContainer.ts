/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Container } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, ContextValueQuickPickStep, runQuickPickWizard, type AzureResourceQuickPickWizardContext, type IActionContext, type IWizardOptions, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { type ResourceModelBase } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ContainerItem } from "../../tree/containers/ContainerItem";
import { ContainersItem } from "../../tree/containers/ContainersItem";
import { RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { localize } from "../localize";
import { ParentResourceItemPickSteps } from "./parentResourcePickSteps";
import { getPickContainerAppSteps } from "./pickContainerApp";
import { type RevisionDraftPickItemOptions } from "./PickItemOptions";

function getPickContainerStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: ContainerItem.contextValueRegExp },
        skipIfOne: true,
    }, {
        placeHolder: localize('selectContainer', 'Select a container'),
    });
}

function getPickContainersStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: ContainersItem.contextValueRegExp },
        skipIfOne: true,
    });
}

export async function pickContainer(context: IActionContext, options?: RevisionDraftPickItemOptions): Promise<ContainerItem> {
    return await runQuickPickWizard(context, {
        promptSteps: getPickContainerSteps(options),
        title: options?.title,
    });
}

export function getPickContainerSteps(options?: RevisionDraftPickItemOptions): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    return [
        ...getPickContainerAppSteps(),
        new ParentResourceItemPickSteps(options),
        new ContainerItemPickSteps(),
    ];
}

/**
 * Use to add pick steps that select down to the `ContainerItem` given that the last node picked was
 * either a `ContainerAppItem`, `RevisionItem` or `RevisionDraftItem` (i.e. a parent resource item)
 */
export class ContainerItemPickSteps<T extends AzureResourceQuickPickWizardContext> extends AzureWizardPromptStep<T> {
    public async prompt(): Promise<void> {
        // Nothing to prompt, just need to use the subwizard
    }

    public shouldPrompt(): boolean {
        return false;
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        const lastNode: unknown = context.pickedNodes.at(-1);
        const lastItem: unknown = (lastNode as { branchItem?: ResourceModelBase })?.branchItem ?? lastNode;

        let containers: Container[] = [];
        if (ContainerAppItem.isContainerAppItem(lastItem)) {
            containers = lastItem.containerApp.template?.containers ?? [];
        } else if (RevisionItem.isRevisionItem(lastItem)) {
            containers = lastItem.revision.template?.containers ?? [];
        } else if (RevisionDraftItem.isRevisionDraftItem(lastItem)) {
            containers = lastItem.revision.template?.containers ?? [];
        } else {
            throw new Error(localize('expectedItem', 'Internal error: Expected last picked item to be a "ContainerAppItem", "RevisionItem", or "RevisionDraftItem".'));
        }

        const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [];
        if (containers.length > 1) {
            promptSteps.push(getPickContainersStep());
        }
        promptSteps.push(getPickContainerStep());

        return { promptSteps };
    }
}

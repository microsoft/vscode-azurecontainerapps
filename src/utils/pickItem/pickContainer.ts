/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Container } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, ContextValueQuickPickStep, runQuickPickWizard, type AzureResourceQuickPickWizardContext, type IActionContext, type IWizardOptions, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ContainerItem } from "../../tree/containers/ContainerItem";
import { ContainersItem } from "../../tree/containers/ContainersItem";
import { RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { localize } from "../localize";
import { pickContainerApp } from "./pickContainerApp";
import { type RevisionDraftPickItemOptions } from "./PickItemOptions";
import { getPickRevisionDraftStep, getPickRevisionStep, getPickRevisionsStep } from "./pickRevision";

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
    const containerAppItem: ContainerAppItem = await pickContainerApp(context);
    return await runQuickPickWizard(context, {
        promptSteps: getPickContainerSteps(containerAppItem, { autoSelectDraft: options?.autoSelectDraft }),
        title: options?.title,
    }, containerAppItem);
}

/**
 * Assumes starting from the ContainerAppItem
 */
export function getPickContainerSteps(containerAppItem: ContainerAppItem, options?: RevisionDraftPickItemOptions): AzureWizardPromptStep<QuickPickWizardContext>[] {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [];
    if (containerAppItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
        promptSteps.push(getPickRevisionsStep());

        if (options?.autoSelectDraft && ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(containerAppItem)) {
            promptSteps.push(getPickRevisionDraftStep());
        } else {
            promptSteps.push(getPickRevisionStep());
        }
    }

    promptSteps.push(new ContainerItemPickSteps());
    return promptSteps;
}

export class ContainerItemPickSteps<T extends AzureResourceQuickPickWizardContext> extends AzureWizardPromptStep<T> {
    public async prompt(): Promise<void> {
        // Nothing to prompt, just need to use the subwizard
    }

    public shouldPrompt(): boolean {
        return false;
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        const lastNode: unknown = context.pickedNodes.at(-1);

        let containers: Container[] = [];
        if (ContainerAppItem.isContainerAppItem(lastNode)) {
            const node = lastNode as ContainerAppItem;
            containers = node.containerApp.template?.containers ?? [];
        } else if (RevisionItem.isRevisionItem(lastNode)) {
            const node = lastNode as RevisionItem;
            containers = node.revision.template?.containers ?? [];
        } else if (RevisionDraftItem.isRevisionDraftItem(lastNode)) {
            const node = lastNode as RevisionDraftItem;
            containers = node.revision.template?.containers ?? [];
        }

        const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [];
        if (containers.length > 1) {
            promptSteps.push(getPickContainersStep());
        }
        promptSteps.push(getPickContainerStep());

        return { promptSteps };
    }
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Container, type Revision } from "@azure/arm-appcontainers";
import { activityFailContext, activityFailIcon, activityProgressContext, activityProgressIcon, activitySuccessContext, activitySuccessIcon, createUniversallyUniqueContextValue, GenericParentTreeItem, GenericTreeItem, nonNullProp, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { type ContainerAppItem, type ContainerAppModel } from "../../tree/ContainerAppItem";
import { type RevisionsItemModel } from "../../tree/revisionManagement/RevisionItem";
import { localize } from "../../utils/localize";
import { getParentResourceFromItem } from "../../utils/revisionDraftUtils";
import { getContainerNameForImage } from "../image/imageSource/containerRegistry/getContainerNameForImage";
import { RevisionDraftUpdateBaseStep } from "../revisionDraft/RevisionDraftUpdateBaseStep";
import { type ContainerUpdateContext } from "./ContainerUpdateContext";

export class ContainerUpdateDraftStep<T extends ContainerUpdateContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 590;

    constructor(baseItem: ContainerAppItem | RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('updatingContainer', 'Updating container (draft)...') });
        this.revisionDraftTemplate.containers ??= [];

        const container: Container = this.revisionDraftTemplate.containers[context.containersIdx] ?? {};
        container.name = getContainerNameForImage(nonNullProp(context, 'image'));
        container.image = context.image;
        container.env = context.environmentVariables;

        await this.updateRevisionDraftWithTemplate(context);
    }

    public shouldExecute(context: T): boolean {
        return context.containersIdx !== undefined && !!context.image;
    }

    public createSuccessOutput(context: T): ExecuteActivityOutput {
        const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(this.baseItem);
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['containerUpdateDraftStepSuccessItem', activitySuccessContext]),
                label: localize('updateContainer', 'Update container for "{0}" (draft)', parentResource.name),
                iconPath: activitySuccessIcon,
            }),
            message: localize('updateContainerSuccess', 'Updated container app "{0}" with image "{1}" (draft).', parentResource.name, context.image),
        };
    }

    public createProgressOutput(): ExecuteActivityOutput {
        const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(this.baseItem);
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['containerUpdateDraftStepProgressItem', activityProgressContext]),
                label: localize('updateContainer', 'Update container for "{0}" (draft)', parentResource.name),
                iconPath: activityProgressIcon,
            }),
        };
    }

    public createFailOutput(context: T): ExecuteActivityOutput {
        const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(this.baseItem);
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['containerUpdateDraftStepFailItem', activityFailContext]),
                label: localize('updateContainer', 'Update container for "{0}" (draft)', parentResource.name),
                iconPath: activityFailIcon,
            }),
            message: localize('updateContainerFail', 'Failed to update container app "{0}" with image "{1}" (draft).', parentResource.name, context.image),
        };
    }
}
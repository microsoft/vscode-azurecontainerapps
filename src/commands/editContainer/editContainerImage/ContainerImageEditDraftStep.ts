/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Container, type Revision } from "@azure/arm-appcontainers";
import { ActivityChildItem, ActivityChildType, activityFailContext, activityFailIcon, activityProgressContext, activityProgressIcon, activitySuccessContext, activitySuccessIcon, createContextValue, nonNullProp, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { type ContainerAppItem, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { getParentResourceFromItem } from "../../../utils/revisionDraftUtils";
import { getContainerNameForImage } from "../../image/imageSource/containerRegistry/getContainerNameForImage";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import { type ContainerEditUpdateContext } from "./editContainerImage";

const containerImageEditDraftStepContext: string = 'containerImageEditDraftStep';

export class ContainerImageEditDraftStep<T extends ContainerEditUpdateContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 590;

    constructor(baseItem: ContainerAppItem | RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('editingImage', 'Editing image (draft)...') });
        this.revisionDraftTemplate.containers ??= [];

        const container: Container = this.revisionDraftTemplate.containers[context.containersIdx] ?? {};
        container.name = getContainerNameForImage(nonNullProp(context, 'image'));
        container.image = context.image;

        await this.updateRevisionDraftWithTemplate(context);
    }

    public shouldExecute(context: T): boolean {
        return context.containersIdx !== undefined && !!context.image;
    }

    public createSuccessOutput(context: T): ExecuteActivityOutput {
        const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(this.baseItem);
        return {
            item: new ActivityChildItem({
                label: localize('editImage', 'Edit container image for app "{0}" (draft)', parentResource.name),
                contextValue: createContextValue([containerImageEditDraftStepContext, activitySuccessContext]),
                activityType: ActivityChildType.Success,
                iconPath: activitySuccessIcon,
            }),
            message: localize('editImageSuccess', 'Successfully added image "{0}" to container app "{1}" (draft).', context.image, parentResource.name),
        };
    }

    public createProgressOutput(): ExecuteActivityOutput {
        const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(this.baseItem);
        return {
            item: new ActivityChildItem({
                label: localize('editImage', 'Edit container image for app "{0}" (draft)', parentResource.name),
                contextValue: createContextValue([containerImageEditDraftStepContext, activityProgressContext]),
                activityType: ActivityChildType.Progress,
                iconPath: activityProgressIcon,
            }),
        };
    }

    public createFailOutput(context: T): ExecuteActivityOutput {
        const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(this.baseItem);
        return {
            item: new ActivityChildItem({
                label: localize('editImage', 'Edit container image for app "{0}" (draft)', parentResource.name),
                contextValue: createContextValue([containerImageEditDraftStepContext, activityFailContext]),
                activityType: ActivityChildType.Fail,
                iconPath: activityFailIcon,
            }),
            message: localize('editImageFail', 'Failed to add image "{0}" to container app "{1}" (draft).', context.image, parentResource.name),
        };
    }
}

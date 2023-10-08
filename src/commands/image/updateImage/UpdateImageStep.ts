/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Revision } from "@azure/arm-appcontainers";
import { nonNullProp, randomUtils } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem, ContainerAppModel } from "../../../tree/ContainerAppItem";
import { RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { getParentResourceFromItem } from "../../../utils/revisionDraftUtils";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import { getContainerNameForImage } from "../imageSource/containerRegistry/getContainerNameForImage";
import { UpdateImageContext } from "./updateImage";

export class UpdateImageStep<T extends UpdateImageContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 490;

    constructor(baseItem: ContainerAppItem | RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: UpdateImageContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('updatingImage', 'Updating image (draft)...') });

        this.revisionDraftTemplate.containers = [];
        this.revisionDraftTemplate.containers.push({
            env: context.environmentVariables,
            image: context.image,
            // We need the revision draft to always show up as having unsaved changes, we can ensure this by adding a unique ID at end of the container name
            name: getContainerNameForImage(nonNullProp(context, 'image')) + `-${randomUtils.getRandomHexString(5)}`,
        });

        this.updateRevisionDraftWithTemplate();

        const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(this.baseItem);
        ext.outputChannel.appendLog(localize('updatedImage', 'Updated container app "{0}" with image "{1}" (draft).', parentResource.name, context.image));
    }

    public shouldExecute(context: UpdateImageContext): boolean {
        return !!context.containerApp && !!context.image;
    }
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Revision } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import type { ContainerAppItem, ContainerAppModel } from "../../../tree/ContainerAppItem";
import type { RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { getParentResourceFromItem } from "../../../utils/revisionDraftUtils";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import { getContainerNameForImage } from "../imageSource/containerRegistry/getContainerNameForImage";
import type { UpdateImageContext } from "./updateImage";

export class UpdateImageDraftStep<T extends UpdateImageContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 490;

    constructor(baseItem: ContainerAppItem | RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('updatingImage', 'Updating image (draft)...') });

        this.revisionDraftTemplate.containers = [];
        this.revisionDraftTemplate.containers.push({
            env: context.environmentVariables,
            image: context.image,
            name: getContainerNameForImage(nonNullProp(context, 'image')),
        });

        await this.updateRevisionDraftWithTemplate(context);

        const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(this.baseItem);
        ext.outputChannel.appendLog(localize('updatedImage', 'Updated container app "{0}" with image "{1}" (draft).', parentResource.name, context.image));
    }

    public shouldExecute(context: T): boolean {
        return !!context.containerApp && !!context.image;
    }
}

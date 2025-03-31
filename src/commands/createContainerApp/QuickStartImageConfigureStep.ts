/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStepWithActivityOutput } from "@microsoft/vscode-azext-utils";
import { ImageSource, quickStartImageName } from "../../constants";
import { localize } from "../../utils/localize";
import { type ImageSourceContext } from "../image/imageSource/ImageSourceContext";
import { type ContainerAppCreateContext } from "./ContainerAppCreateContext";

export class QuickStartImageConfigureStep<T extends ContainerAppCreateContext & ImageSourceContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 610;
    public stepName: string = 'quickStartImageConfigureStep';
    protected getSuccessString = () => localize('quickStartImageSuccess', 'Successfully configured quick start image.');
    protected getFailString = () => localize('quickStartImageFail', 'Failed to configure quick start image.');
    protected getTreeItemLabel = () => localize('quickStartImageLabel', 'Configure quick start image');

    public async execute(context: T): Promise<void> {
        context.image = quickStartImageName;
        context.enableIngress = true;
        context.enableExternal = true;
        context.targetPort = 80;
    }

    public shouldExecute(context: T): boolean {
        return !context.image && context.imageSource === ImageSource.QuickstartImage;
    }
}

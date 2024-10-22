/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { parseImageName } from "../../../../utils/imageNameUtils";
import { localize } from "../../../../utils/localize";
import { AzureWizardActivityOutputExecuteStep } from "../../../AzureWizardActivityOutputExecuteStep";
import { type ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";
import { getLoginServer } from "./getLoginServer";

export class ContainerRegistryImageConfigureStep<T extends ContainerRegistryImageSourceContext> extends AzureWizardActivityOutputExecuteStep<T> {
    public priority: number = 570;
    public stepName: string = 'containerRegistryImageConfigureStep';
    protected getSuccessString = (context: T) => localize('successOutput', 'Successfully set container app image to "{0}".', context.image);
    protected getFailString = (context: T) => localize('failOutput', 'Failed to set container app image to "{0}".', context.image);
    protected getTreeItemLabel = (context: T) => localize('treeItemLabel', 'Set container app image to "{0}"', context.image);

    public async execute(context: T): Promise<void> {
        context.image = `${getLoginServer(context)}/${context.repositoryName}:${context.tag}`;

        const { registryName, registryDomain } = parseImageName(context.image);
        context.telemetry.properties.registryName = registryName;
        context.telemetry.properties.registryDomain = registryDomain ?? 'other';
    }

    public shouldExecute(context: T): boolean {
        return !context.image;
    }
}

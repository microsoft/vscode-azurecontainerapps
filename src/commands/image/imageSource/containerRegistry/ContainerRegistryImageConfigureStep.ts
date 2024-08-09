/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { parseImageName } from "../../../../utils/imageNameUtils";
import { type ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";
import { getLoginServer } from "./getLoginServer";

export class ContainerRegistryImageConfigureStep extends AzureWizardExecuteStep<ContainerRegistryImageSourceContext> {
    public priority: number = 570;

    public async execute(context: ContainerRegistryImageSourceContext): Promise<void> {
        context.image = `${getLoginServer(context)}/${context.repositoryName}:${context.tag}`;

        const { registryName, registryDomain } = parseImageName(context.image);
        context.telemetry.properties.registryName = registryName;
        context.telemetry.properties.registryDomain = registryDomain ?? 'other';
    }

    public shouldExecute(context: ContainerRegistryImageSourceContext): boolean {
        return !context.image;
    }
}

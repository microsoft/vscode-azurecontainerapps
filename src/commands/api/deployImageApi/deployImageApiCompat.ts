/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerRegistryImageSourceContext } from "../../image/imageSource/containerRegistry/ContainerRegistryImageSourceContext";
import { type DeployImageToAcaOptionsContract } from "../vscode-azurecontainerapps.api";
import { deployImageApi } from "./deployImageApi";

/**
 * A compatibility wrapper for the legacy entrypoint utilizing `deployImageApi`
 */
export async function deployImageApiCompat(_: IActionContext & Partial<ContainerRegistryImageSourceContext>, deployImageOptions: DeployImageToAcaOptionsContract): Promise<void> {
    return await deployImageApi(deployImageOptions);
}

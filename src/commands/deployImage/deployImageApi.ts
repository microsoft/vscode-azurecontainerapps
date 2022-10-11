/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { deployImage } from "./deployImage";
import { IDeployImageContext } from "./IDeployImageContext";

// The interface of the command options passed to the Azure Container Apps extension's deployImageToAca command
// This interface is shared with the Docker extension (https://github.com/microsoft/vscode-docker)
interface DeployImageToAcaOptionsContract {
    imageName: string;
    loginServer?: string;
    username?: string;
    secret?: string;
}

export function deployImageApi(context: IActionContext & Partial<IDeployImageContext>, deployImageOptions: DeployImageToAcaOptionsContract): Promise<void> {
    // Fill in data from the options into the wizard context
    context.image = deployImageOptions.imageName;
    // TODO: more stuff to fill in

    // Call the deployImage function programmatically
    return deployImage(context);
}

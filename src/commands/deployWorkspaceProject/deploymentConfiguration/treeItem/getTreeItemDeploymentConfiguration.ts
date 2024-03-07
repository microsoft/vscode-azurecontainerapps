/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IContainerAppContext } from "../../../IContainerAppContext";
import { type DeploymentConfiguration } from "../DeploymentConfiguration";

// Todo: Monorepo core logic (tree item path) https://github.com/microsoft/vscode-azurecontainerapps/issues/613
export async function getTreeItemDeploymentConfiguration(_: IContainerAppContext): Promise<DeploymentConfiguration> {
    return {};
}

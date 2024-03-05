/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IContainerAppContext } from "../../IContainerAppContext";
import { type DeploymentConfigurationModel } from "./DeploymentConfigurationModel";

// Todo: Monorepo core logic (tree item path) https://github.com/microsoft/vscode-azurecontainerapps/issues/613
export async function getTreeItemDeploymentConfigurationModel(_: IContainerAppContext): Promise<DeploymentConfigurationModel> {
    return {};
}

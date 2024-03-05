/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IContainerAppContext } from "../../IContainerAppContext";
import { type DeploymentConfigurationModel } from "./DeploymentConfigurationModel";

export async function getTreeItemDeploymentConfigurationModel(_: IContainerAppContext): Promise<DeploymentConfigurationModel> {
    return {};
}

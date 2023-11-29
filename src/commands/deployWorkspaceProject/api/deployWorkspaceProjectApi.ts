/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { deployWorkspaceProject, type DeployWorkspaceProjectResults } from "../deployWorkspaceProject";

interface DeployWorkspaceProjectApiOptionsContract {
    // Resources
    resourceGroupId?: string;

    // Workspace deployment paths
    rootPath?: string;
    srcPath?: string;
    dockerfilePath?: string;

    // Option flags
    skipContainerAppCreation?: boolean;
    saveRedeploySettings?: boolean;
}

export async function deployWorkspaceProjectApi(context: IActionContext, _deployWorkspaceProjectOptions: DeployWorkspaceProjectApiOptionsContract): Promise<DeployWorkspaceProjectResults> {
    // Assign root workspace folder using path
    // Assign resource group using resource group id

    // Handle all flags in the main logic

    return await deployWorkspaceProject(context);
}

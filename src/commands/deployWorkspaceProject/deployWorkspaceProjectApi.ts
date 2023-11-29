/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { deployWorkspaceProject } from "./deployWorkspaceProject";

interface DeployFunctionsProjectToAcaOptionsContract {
    image: string;
    registryName: string;
    username?: string;
    secret?: string;
}

export type DeployWorkspaceProjectApiContext = DeployFunctionsProjectToAcaOptionsContract;

export async function deployWorkspaceProjectApi(context: DeployWorkspaceProjectApiContext): Promise<void> {
    await deployWorkspaceProject(context);
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUtils } from "@microsoft/vscode-azext-utils";
import { type DeployWorkspaceProjectTestCases } from "./DeployWorkspaceProjectTestCases";

export function getAlbumApiTestCases(): DeployWorkspaceProjectTestCases {
    const sharedResourceName: string = 'album-api' + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        // Todo
    ];
}

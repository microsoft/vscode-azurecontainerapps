/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Secret } from "@azure/arm-appcontainers";
import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { IContainerAppContext } from "../IContainerAppContext";

export interface ISecretContext extends IContainerAppContext, ExecuteActivityContext {
    secretName?: string;  // a.k.a. 'key'
    secretValue?: string;

    secret?: Secret;
}

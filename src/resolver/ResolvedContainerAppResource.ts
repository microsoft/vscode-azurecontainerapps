/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResolvedAppResourceBase } from "@microsoft/vscode-azext-utils/hostapi";

export interface ResolvedContainerAppResource<T> extends ResolvedAppResourceBase {
    data: T;
    name: string;
    resourceGroupName: string;
}

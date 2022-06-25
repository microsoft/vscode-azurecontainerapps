/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeDataProvider, AzExtTreeItem, IAzExtOutputChannel, IExperimentationServiceAdapter } from "@microsoft/vscode-azext-utils";
import { AzureHostExtensionApi } from "@microsoft/vscode-azext-utils/hostapi";
import { ExtensionContext, TreeView } from "vscode";
import { ContainerAppsBranchDataProvider } from "./tree/ContainerAppsBranchDataProvider";

/**
 * Namespace for common variables used throughout the extension. They must be initialized in the activate() method of extension.ts
 */
export namespace ext {
    export let context: ExtensionContext;
    export let tree: AzExtTreeDataProvider;
    export let treeView: TreeView<AzExtTreeItem>;
    export let outputChannel: IAzExtOutputChannel;
    export let ignoreBundle: boolean | undefined;
    export const prefix: string = 'containerApps';
    export let experimentationService: IExperimentationServiceAdapter;
    export let rgApi: AzureHostExtensionApi;
    export let branch: ContainerAppsBranchDataProvider;
}

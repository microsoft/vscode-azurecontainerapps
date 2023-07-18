/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IAzExtOutputChannel, IExperimentationServiceAdapter, TreeElementStateManager } from "@microsoft/vscode-azext-utils";
import { AzureResourcesExtensionApi } from "@microsoft/vscode-azureresources-api";
import { ExtensionContext } from "vscode";
import { RevisionDraftFileSystem } from "./commands/revisionDraft/RevisionDraftFileSystem";
import { ContainerAppsBranchDataProvider } from "./tree/ContainerAppsBranchDataProvider";

/**
 * Namespace for common variables used throughout the extension. They must be initialized in the activate() method of extension.ts
 */
export namespace ext {
    export let context: ExtensionContext;
    export let outputChannel: IAzExtOutputChannel;
    export let ignoreBundle: boolean | undefined;
    export const prefix: string = 'containerApps';
    export let experimentationService: IExperimentationServiceAdapter;
    export let revisionDraftFileSystem: RevisionDraftFileSystem;
    export let rgApiV2: AzureResourcesExtensionApi;

    export let state: TreeElementStateManager;
    export let branchDataProvider: ContainerAppsBranchDataProvider;
}

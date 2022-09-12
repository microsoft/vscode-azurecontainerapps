/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { QuickPickItem } from "vscode";
import { localize } from "./utils/localize";

export const webProvider: string = 'Microsoft.Web';
export const containerAppProvider: string = `${webProvider}/containerApps`;
export const appProvider: string = 'Microsoft.App';
export const managedEnvironmentProvider: string = `${appProvider}/managedEnvironments`;

export const rootFilter = {
    type: managedEnvironmentProvider
}

export namespace IngressConstants {
    export const external: string = localize('external', 'External');
    export const internal: string = localize('internal', 'Internal');
    export const externalDesc: string = localize('externalDesc', 'Accepting traffic from anywhere');
    export const internalDesc: string = localize('internalDesc', 'Only allowing traffic within your vNet');
}

export namespace RevisionConstants {
    export const multiple: IAzureQuickPickItem<string> = { label: localize('multiple', 'Multiple'), description: localize('multipleDesc', 'Several revisions active simultaneously'), data: 'multiple' };
    export const single: IAzureQuickPickItem<string> = { label: localize('single', 'Single'), description: localize('singleDesc', 'One active revision at a time'), data: 'single' };
}

export enum ScaleRuleTypes {
    HTTP = "HTTP scaling",
    Queue = "Azure queue"
}

export const acrDomain = 'azurecr.io';
export const dockerHubDomain = 'docker.io';

export type SupportedRegistries = 'azurecr.io' | 'docker.io';

export const loadMoreQp: IAzureQuickPickItem = { label: '$(sync) Load More', data: undefined, suppressPersistence: true };
export type QuickPicksCache = { cache: QuickPickItem[], next: string | null };

export const azResourceContextValue: string = 'azResource';
export const azResourceRegExp = new RegExp(azResourceContextValue, 'i');

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { type QuickPickItem } from "vscode";
import { localize } from "./utils/localize";

export const registryProvider: string = 'Microsoft.ContainerRegistry';
export const registryResourceType: string = 'registries';

export const logAnalyticsProvider: string = 'Microsoft.OperationalInsights';
export const logAnalyticsResourceType: string = 'workspaces';

export const managedEnvironmentProvider: string = 'Microsoft.App';
export const managedEnvironmentResourceType: string = 'managedEnvironments';

export const containerAppProvider: string = 'Microsoft.App';
export const containerAppResourceType: string = 'containerApps';

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

export const showDraftCommandDeployPopupSetting: string = 'showDraftCommandDeployPopup';

export enum ScaleRuleTypes {
    HTTP = "HTTP scaling",
    Queue = "Azure queue"
}

export enum ImageSource {
    /*
     * Uses the default hello-world image with preset configurations
     */
    QuickstartImage = 'quickstartImage',
    /*
     * Use an image stored in ACR or a third party registry
     */
    ContainerRegistry = 'containerRegistry',
    /*
     * Build the image from your project remotely using ACR (reqs. Dockerfile)
     */
    RemoteAcrBuild = 'remoteAcrBuild'
}

export const acrDomain = 'azurecr.io';
export const dockerHubDomain = 'docker.io';
export const dockerHubRegistry = 'index.docker.io';
export const quickStartImageName = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest';

export type SupportedRegistries = 'azurecr.io' | 'docker.io';

export const browseItem: IAzureQuickPickItem<undefined> = { label: `$(file-directory) ${localize('browse', 'Browse...')}`, description: '', data: undefined };
export const loadMoreQp: IAzureQuickPickItem = { label: '$(sync) Load More', data: undefined, suppressPersistence: true };

export const noMatchingResources = 'noMatchingResources';
export const noMatchingResourcesQp: IAzureQuickPickItem<typeof noMatchingResources> = {
    label: localize('noMatchingResources', 'No matching resources found.'),
    description: '',
    data: noMatchingResources
};

export type QuickPicksCache = { cache: QuickPickItem[], next: string | null };

export const vscodeFolder: string = '.vscode';
export const settingsFile: string = 'settings.json';
export const relativeSettingsFilePath: string = `${vscodeFolder}/${settingsFile}`;

// Originally from the Docker extension: https://github.com/microsoft/vscode-docker/blob/main/src/constants.ts
export const dockerfileGlobPattern = '{*.[dD][oO][cC][kK][eE][rR][fF][iI][lL][eE],[dD][oO][cC][kK][eE][rR][fF][iI][lL][eE],[dD][oO][cC][kK][eE][rR][fF][iI][lL][eE].*}';
export const envFileGlobPattern = '*.{env,env.*}';
export const dockerFilePick = localize('dockerFilePick', 'Choose a Dockerfile from your source code directory.')

export const revisionModeSingleContextValue: string = 'revisionMode:single';
export const revisionModeMultipleContextValue: string = 'revisionMode:multiple';

export const revisionDraftTrueContextValue: string = 'revisionDraft:true';
export const revisionDraftFalseContextValue: string = 'revisionDraft:false';

export const unsavedChangesTrueContextValue: string = 'unsavedChanges:true';
export const unsavedChangesFalseContextValue: string = 'unsavedChanges:false';

export const activityInfoContext: string = 'activity:info';

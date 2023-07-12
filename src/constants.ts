/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { QuickPickItem } from "vscode";
import { localize } from "./utils/localize";

export const managedEnvironmentsId = 'managedEnvironments';
export const containerAppsId = 'containerApps';
export const appProvider: string = 'Microsoft.App';
export const webProvider: string = 'Microsoft.Web';

export const containerAppsWebProvider: string = `${webProvider}/${containerAppsId}`;
export const managedEnvironmentsAppProvider: string = `${appProvider}/${managedEnvironmentsId}`;

export const rootFilter = {
    type: managedEnvironmentsAppProvider
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

export const currentlyDeployed: string = localize('currentlyDeployed', '(currently deployed)');

export enum ScaleRuleTypes {
    HTTP = "HTTP scaling",
    Queue = "Azure queue"
}

export enum ImageSource {
    /*
     * Uses the default hello-world image with preset configurations
     */
    QuickStartImage = 'quickStartImage',
    /*
     * Use an image stored in ACR or a third party registry
     */
    ContainerRegistry = 'containerRegistry',
    /*
     * Build the image from your project locally using Docker (reqs. Dockerfile)
     */
    LocalDockerBuild = 'localDockerBuild',
    /*
     * Build the image from your project remotely using ACR (reqs. Dockerfile)
     */
    RemoteAcrBuild = 'remoteAcrBuild'
}

export type ImageSourceValues = typeof ImageSource[keyof typeof ImageSource];

export const acrDomain = 'azurecr.io';
export const dockerHubDomain = 'docker.io';
export const dockerHubRegistry = 'index.docker.io';
export const quickStartImageName = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest';

export type SupportedRegistries = 'azurecr.io' | 'docker.io';

export const loadMoreQp: IAzureQuickPickItem = { label: '$(sync) Load More', data: undefined, suppressPersistence: true };
export type QuickPicksCache = { cache: QuickPickItem[], next: string | null };

// Originally from the Docker extension: https://github.com/microsoft/vscode-docker/blob/main/src/constants.ts
export const DOCKERFILE_GLOB_PATTERN = '**/{*.[dD][oO][cC][kK][eE][rR][fF][iI][lL][eE],[dD][oO][cC][kK][eE][rR][fF][iI][lL][eE],[dD][oO][cC][kK][eE][rR][fF][iI][lL][eE].*}';

export const revisionModeSingleContextValue: string = 'revisionMode:single';
export const revisionModeMultipleContextValue: string = 'revisionMode:multiple';

// export const revisionDraftTrueContextValue: string = 'revisionDraft:true';
// export const revisionDraftFalseContextValue: string = 'revisionDraft:false';

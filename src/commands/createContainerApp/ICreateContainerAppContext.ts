/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { IContainerAppContext } from '../IContainerAppContext';
import { ImageSourceBaseContext } from '../imageSource/ImageSourceBastContext';

export interface ICreateContainerAppContext extends IResourceGroupWizardContext, ImageSourceBaseContext, IContainerAppContext {
    managedEnvironmentId: string;
    newContainerAppName?: string;

    enableIngress?: boolean;
    enableExternal?: boolean;

    defaultPort?: number;
    targetPort?: number;
}

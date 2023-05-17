/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { ExecuteActivityContext } from '@microsoft/vscode-azext-utils';
import { IContainerAppContext } from '../IContainerAppContext';
import { ImageSourceBaseContext } from '../imageSource/ImageSourceBaseContext';
import { IngressContext } from '../ingress/IngressContext';

export interface ICreateContainerAppContext extends IResourceGroupWizardContext, ImageSourceBaseContext, IngressContext, IContainerAppContext, ExecuteActivityContext {
    managedEnvironmentId: string;
    newContainerAppName?: string;
}

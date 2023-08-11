/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ManagedEnvironment } from '@azure/arm-appcontainers';
import type { IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import type { ExecuteActivityContext } from '@microsoft/vscode-azext-utils';
import type { IContainerAppContext } from '../IContainerAppContext';
import type { ImageSourceBaseContext } from '../deployImage/imageSource/ImageSourceBaseContext';
import type { IngressContext } from '../ingress/IngressContext';

export interface ICreateContainerAppContext extends IResourceGroupWizardContext, ImageSourceBaseContext, IngressContext, IContainerAppContext, ExecuteActivityContext {
    managedEnvironmentId?: string;
    newContainerAppName?: string;

    managedEnvironment?: ManagedEnvironment;
}

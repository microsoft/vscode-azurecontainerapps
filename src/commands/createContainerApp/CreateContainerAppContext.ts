/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from '@azure/arm-appcontainers';
import { type IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { type ExecuteActivityContext } from '@microsoft/vscode-azext-utils';
import { type SetTelemetryProps } from '../../telemetry/SetTelemetryProps';
import { type CreateContainerAppTelemetryProps as TelemetryProps } from '../../telemetry/commandTelemetryProps';
import { type IContainerAppContext } from '../IContainerAppContext';
import { type ImageSourceBaseContext } from '../image/imageSource/ImageSourceContext';
import { type IngressBaseContext } from '../ingress/IngressContext';

export interface CreateContainerAppBaseContext extends IResourceGroupWizardContext, ImageSourceBaseContext, IngressBaseContext, IContainerAppContext, ExecuteActivityContext {
    newContainerAppName?: string;

    managedEnvironmentId?: string;
    managedEnvironment?: ManagedEnvironment;
}

export type CreateContainerAppContext = CreateContainerAppBaseContext & SetTelemetryProps<TelemetryProps>;

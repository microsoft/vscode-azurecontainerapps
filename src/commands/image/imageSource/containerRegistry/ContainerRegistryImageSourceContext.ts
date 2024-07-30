/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from '@azure/arm-containerregistry';
import { type SupportedRegistries } from '../../../../constants';
import { type ContainerRegistryTelemetryProps as TelemetryProps } from '../../../../telemetry/ImageSourceTelemetryProps';
import { type SetTelemetryProps } from '../../../../telemetry/SetTelemetryProps';
import { type CreateAcrContext } from '../../../registries/acr/AcrContext';
import { type ImageSourceBaseContext } from '../ImageSourceContext';

export interface ContainerRegistryImageSourceBaseContext extends CreateAcrContext, ImageSourceBaseContext {
    registryDomain?: SupportedRegistries;
    registry?: Registry;
    dockerHubNamespace?: string;

    repositoryName?: string;
    tag?: string;

    // Registry credentials
    registryName?: string;
    username?: string;
    secret?: string;
}

export type ContainerRegistryImageSourceContext = ContainerRegistryImageSourceBaseContext & SetTelemetryProps<TelemetryProps>;

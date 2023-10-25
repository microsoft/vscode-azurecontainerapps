/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { AcrBuildSupportedOS } from "../commands/image/imageSource/buildImageInAzure/OSPickStep";
import type { ImageSource, SetEnvironmentVariableOption, SupportedRegistries } from "../constants";
import type { AzdTelemetryProps } from "./AzdTelemetryProps";
import { WorkspaceFileTelemetryProps } from "./WorkspaceFileTelemetryProps";

export interface ImageSourceTelemetryProps extends ContainerRegistryTelemetryProps, BuildImageInAzureTelemetryProps, EnvironmentVariableTelemetryProps {
    imageSource?: ImageSource;
}

export interface ContainerRegistryTelemetryProps {
    acrCount?: string;  // AcrListStep
    registryDomain?: SupportedRegistries | 'other';
    registryName?: string;
    hasRegistrySecrets?: 'true' | 'false';  // Helps us identify private third party registries
}

export interface BuildImageInAzureTelemetryProps extends Pick<AzdTelemetryProps, 'isAzdWorkspaceProject'>, Pick<WorkspaceFileTelemetryProps, 'dockerfileCount'> {
    imageBaseOs?: AcrBuildSupportedOS;
    outputImagesCount?: string;  // Number of images generated from the run
    // isAzdWorkspaceProject
    // dockerfileCount
}

export interface EnvironmentVariableTelemetryProps extends Pick<WorkspaceFileTelemetryProps, 'environmentVariableFileCount'> {
    setEnvironmentVariableOption?: SetEnvironmentVariableOption;  // EnvironmentVariablesListStep
    // environmentVariableFileCount
}

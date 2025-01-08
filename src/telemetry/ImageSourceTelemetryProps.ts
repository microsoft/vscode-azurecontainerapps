/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type AcrBuildSupportedOS } from "../commands/image/imageSource/buildImageInAzure/OSPickStep";
import { type SetEnvironmentVariableOption } from "../commands/image/imageSource/EnvFileListStep";
import { type ImageSource, type SupportedRegistries } from "../constants";
import { type AzdTelemetryProps } from "./AzdTelemetryProps";
import { type WorkspaceFileTelemetryProps } from "./WorkspaceFileTelemetryProps";

export interface ImageSourceTelemetryProps extends ContainerRegistryTelemetryProps, BuildImageInAzureTelemetryProps, EnvironmentVariableTelemetryProps {
    imageSource?: ImageSource;
}

export interface ContainerRegistryTelemetryProps {
    acrCount?: string;  // AcrListStep
    registryDomain?: SupportedRegistries | 'other';
    registryName?: string;
    hasRegistrySecrets?: 'true' | 'false';  // Helps us identify private third party registries

    // Recommended container registries
    sameRgAcrCount?: string; // number casted to string
}

export interface BuildImageInAzureTelemetryProps extends AzdTelemetryProps, Pick<WorkspaceFileTelemetryProps, 'dockerfileCount'> {
    imageBaseOs?: AcrBuildSupportedOS;
    outputImagesCount?: string;  // Number of images generated from the run
    sourceDepth?: string;  // Number of folders deep the source is from the root of the workspace
    buildCustomDockerfile?: 'true' | 'false';  // --platform error
    hasWorkspaceProjectOpen?: 'true' | 'false';
    // isAzdExtensionInstalled
    // isAzdWorkspaceProject
    // dockerfileCount
}

export interface EnvironmentVariableTelemetryProps extends Pick<WorkspaceFileTelemetryProps, 'environmentVariableFileCount'> {
    setEnvironmentVariableOption?: SetEnvironmentVariableOption;  // EnvFileListStep
    // environmentVariableFileCount
}

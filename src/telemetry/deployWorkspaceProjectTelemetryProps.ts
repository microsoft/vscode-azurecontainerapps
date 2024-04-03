/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { type AzdTelemetryProps } from "./AzdTelemetryProps";
import { type ImageSourceTelemetryProps } from "./ImageSourceTelemetryProps";
import { type IngressTelemetryProps } from "./IngressTelemetryProps";
import { type OverwriteConfirmTelemetryProps } from "./OverwriteConfirmTelemetryProps";
import { type WorkspaceFileTelemetryProps } from "./WorkspaceFileTelemetryProps";

export interface DeployWorkspaceProjectTelemetryProps extends DeployWorkspaceProjectInternalTelemetryProps {
    choseExistingWorkspaceConfiguration?: 'true' | 'false';
    defaultedRegistry?: 'true' | 'false';
}

export interface DeployWorkspaceProjectInternalTelemetryProps extends AzdTelemetryProps, ImageSourceTelemetryProps, OverwriteConfirmTelemetryProps, WorkspaceFileTelemetryProps, IngressTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;

    defaultedRegistryInternal?: 'true' | 'false';

    // Resources
    existingResourceGroup?: 'true' | 'false';
    existingEnvironment?: 'true' | 'false';
    existingRegistry?: 'true' | 'false';
    existingContainerApp?: 'true' | 'false';
    existingLocation?: 'true' | 'false';

    // Save settings
    hasNewSettings?: 'true' | 'false';  // ShouldSaveDeploySettingsPromptStep
    shouldSaveDeploySettings?: 'true' | 'false';  // ShouldSaveDeploySettingsPromptStep
    didSaveSettings?: 'true' | 'false';  // DeployWorkspaceProjectSaveSettingsStep - we swallow errors here, so log the outcome just in case

    // Recommended Managed Environment
    recommendedEnvCount?: string; // number casted to string
    usedRecommendedEnv?: 'true' | 'false';
}

export interface DeployWorkspaceProjectNotificationTelemetryProps {
    userAction?: 'canceled' | 'browse' | 'viewOutput';
}

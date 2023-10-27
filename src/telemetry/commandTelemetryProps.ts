/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import type { AzdTelemetryProps } from "./AzdTelemetryProps";
import type { EnvironmentVariableTelemetryProps, ImageSourceTelemetryProps } from "./ImageSourceTelemetryProps";
import type { WorkspaceFileTelemetryProps } from "./WorkspaceFileTelemetryProps";

export interface DeployImageApiTelemetryProps extends ImageSourceTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
    hasUnsupportedFeatures?: 'true';  // ContainerAppOverwriteConfirmStep
}

export interface DeployRevisionDraftTelemetryProps extends AzdTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
    commandUpdatesCount?: string;  // Updates via revision draft commands
    directUpdatesCount?: string;  // Direct updates via 'editContainerApp' & 'editDraft'
}

export interface DeployWorkspaceProjectTelemetryProps extends AzdTelemetryProps, ImageSourceTelemetryProps, WorkspaceFileTelemetryProps, IngressTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;

    // getDefaultContextValues
    hasWorkspaceProjectOpen?: 'true' | 'false';
    workspaceSettingsState?: 'none' | 'partial' | 'all';  // What level of workspace project settings did we detect on init?
    settingsOverride?: 'none' | 'triggered' | 'accepted';
    promptedForEnvironment?: 'true' | "false";
    promptDefaultNameReason?: 'invalid' | 'unavailable';

    // Resources
    existingResourceGroup?: 'true' | 'false';
    existingEnvironment?: 'true' | 'false';
    existingRegistry?: 'true' | 'false';
    existingContainerApp?: 'true' | 'false';
    existingLocation?: 'true' | 'false';

    // Update
    hasUnsupportedFeatures?: 'true' | 'false';  // ContainerAppOverwriteConfirmStep

    // Save settings
    noNewSettings?: 'true' | 'false';  // ShouldSaveDeploySettingsPromptStep
    shouldSaveDeploySettings?: 'true' | 'false';  // ShouldSaveDeploySettingsPromptStep
    didSaveSettings?: 'true' | 'false';  // DeployWorkspaceProjectSaveSettingsStep - we swallow errors here, so log the outcome just in case
}

export interface DeployWorkspaceProjectNotificationTelemetryProps {
    userAction?: 'canceled' | 'browse' | 'viewOutput';
}

export interface UpdateImageTelemetryProps extends AzdTelemetryProps, ImageSourceTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
    skippedRegistryCredentialUpdate?: 'true';
}

export interface IngressTelemetryProps {
    dockerfileExposePortRangeCount?: string;  // IngressPromptStep
    enableIngress?: 'true' | 'false'; //IngressPromptStep
    suggestedTargetPort?: string; //getDefaultPort
    targetPort?: string; //TargetPortInputStep
}

export interface CreateContainerAppTelemetryProps extends ImageSourceTelemetryProps, EnvironmentVariableTelemetryProps, AzdTelemetryProps, IngressTelemetryProps {
    // Ingress
    enableIngress?: 'true' | 'false'; //IngressPromptStep
    port?: string; //TargetPortInputStep
}

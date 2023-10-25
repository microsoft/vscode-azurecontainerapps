/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import type { AzdTelemetryProps } from "./AzdTelemetryProps";
import type { ImageSourceTelemetryProps } from "./ImageSourceTelemetryProps";
import type { OverwriteConfirmTelemetryProps } from "./OverwriteConfirmTelemetryProps";

export interface DeployImageApiTelemetryProps extends ImageSourceTelemetryProps, OverwriteConfirmTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
}

export interface DeployRevisionDraftTelemetryProps extends AzdTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;

    commandUpdatesCount?: string;  // Updates via revision draft commands
    directUpdatesCount?: string;  // Direct updates via 'editContainerApp' & 'editDraft'
}

export interface DeployWorkspaceProjectTelemetryProps extends AzdTelemetryProps, ImageSourceTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;

    // getDefaultContextValues
    dockerfileCount?: string;  // Shared property of 'ImageSourceTelemetryProps' but doesn't get initiated through the normal image source flow
    hasWorkspaceProjectOpen?: 'false';
    workspaceSettingsState?: 'none' | 'partial' | 'all';  // What level of workspace project settings did we detect on init?
    triggeredSettingsOverride?: 'true';
    acceptedSettingsOverride?: 'true';
    promptedForEnvironment?: 'true';
    promptDefaultNameReason?: 'invalid' | 'unavailable';

    // Resources
    existingResourceGroup?: 'true' | 'false';
    existingEnvironment?: 'true' | 'false';
    existingRegistry?: 'true' | 'false';
    existingContainerApp?: 'true' | 'false';
    existingLocation?: 'true' | 'false';
    confirmedResourceCreation?: 'true';

    managedEnvironmentCount?: string;

    // Ingress
    dockerfileExposePortRangeCount?: string;  // IngressPromptStep
    dockerfileExposePort?: string;  // IngressPromptStep

    // Update
    hasUnsupportedFeatures?: 'true';  // ContainerAppOverwriteConfirmStep

    // Save settings
    noNewSettings?: 'true';  // ShouldSaveDeploySettingsPromptStep
    shouldSaveSettings?: 'true' | 'false';  // ShouldSaveDeploySettingsPromptStep
    didSaveSettings?: 'true' | 'false';  // DeployWorkspaceProjectSaveSettingsStep - we swallow errors here, so log the outcome just in case
}

export interface DeployWorkspaceProjectNotificationTelemetryProps {
    userAction?: 'canceled' | 'browse' | 'viewOutput';
}

export interface UpdateImageTelemetryProps extends AzdTelemetryProps, ImageSourceTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;

    skippedRegistryCredentialUpdate?: 'true';
}

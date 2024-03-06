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

export interface DeployImageApiTelemetryProps extends ImageSourceTelemetryProps, OverwriteConfirmTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
}

export interface DeployRevisionDraftTelemetryProps extends AzdTelemetryProps, OverwriteConfirmTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
    commandUpdatesCount?: string;  // Updates via revision draft commands
    directUpdatesCount?: string;  // Direct updates via 'editContainerApp' & 'editDraft'
}
export interface DeployWorkspaceProjectTelemetryProps extends AzdTelemetryProps, ImageSourceTelemetryProps, OverwriteConfirmTelemetryProps, WorkspaceFileTelemetryProps, IngressTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;

    // getDefaultContextValues
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
    skippedRegistryCredentialUpdate?: 'true' | 'false';
}

export type CreateContainerAppTelemetryProps = ImageSourceTelemetryProps & AzdTelemetryProps & IngressTelemetryProps

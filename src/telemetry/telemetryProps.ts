/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { SetEnvironmentVariableOption } from "../constants";

export interface DeployWorkspaceProjectTelemetryProps {
    // Azd
    isAzdExtensionInstalled?: 'true';
    isAzdWorkspaceProject?: 'true';

    // getDefaultContextValues
    dockerfileCount?: string;  // selectWorkspaceFile
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

    // Environment variables
    environmentVariableFileCount?: string;  // selectWorkspaceFile
    setEnvironmentVariableOption?: SetEnvironmentVariableOption;  // EnvironmentVariablesListStep

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

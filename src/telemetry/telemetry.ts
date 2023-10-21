/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { SetEnvironmentVariableOption } from "../constants";

export interface DeployWorkspaceProjectTelemetryProps {
    // getDefaultContextValues
    dockerfileCount?: string;  // selectWorkspaceFile
    hasWorkspaceProjectOpen?: 'true' | 'false';  // Did the user already have a workspace project open when executing the command?
    workspaceSettingsState?: 'none' | 'partial' | 'all';  // Did we detect workspace project settings?
    triggeredSettingsOverride?: 'true'; // Did the starting tree item provided conflict with existing project settings?
    acceptedSettingsOverride?: 'true';  // Did the user proceed anyway?
    promptedForEnvironment?: 'true';  // Were we able to leverage existing resources or did we have to prompt for an environment?

    // Resources
    existingResourceGroup?: 'true' | 'false';
    existingEnvironment?: 'true' | 'false';
    existingRegistry?: 'true' | 'false';
    existingContainerApp?: 'true' | 'false';
    existingLocation?: 'true' | 'false';
    confirmedResourceCreation?: 'true';

    // Environment variables
    environmentVariableFileCount?: string;  // EnvironmentVariablesListStep => selectWorkspaceFile
    setEnvironmentVariableOption?: SetEnvironmentVariableOption;  // EnvironmentVariablesListStep

    // Ingress
    dockerfileExposePortRangeCount?: string;  // IngressPromptStep
    dockerfileExposePort?: string;  // IngressPromptStep

    // Update
    hasUnsupportedFeatures?: 'true';  // ContainerAppUpdateStep

    // Save settings
    noNewSettings?: 'true';  // ShouldSaveDeploySettingsPromptStep
    shouldSaveSettings?: 'true' | 'false';  // ShouldSaveDeploySettingsPromptStep
    didSaveSettings?: 'true' | 'false';  // DeployWorkspaceProjectSaveSettingsStep - we swallow errors here, so log the outcome just in case
}

export interface DeployWorkspaceProjectNotificationTelemetryProps {
    userAction?: 'canceled' | 'browse' | 'viewOutput';
}

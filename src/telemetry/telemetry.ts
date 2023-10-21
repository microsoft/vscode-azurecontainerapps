/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { SetEnvironmentVariableOption } from "../constants";

export interface DeployWorkspaceProjectTelemetryProps {
    // getDefaultContextValues
    dockerfileCount?: string;  // How many dockerfiles did the user choose from?
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
    environmentVariableFileCount?: string; // How many environment variable files were detected?
    setEnvironmentVariableOption?: SetEnvironmentVariableOption;

    // Ingress
    dockerfileExposePortRangeCount?: string;  // How many useable dockerfile expose port ranges were detected?
    dockerfileExposePort?: string;  // What port did we end up defaulting to?

    // Save settings
    shouldSaveSettings?: 'true' | 'false';  // The prompt the user confirmed
    didSaveSettings?: 'true' | 'false';  // We swallow any errors in this step, so log the outcome explicitly just in case
}

export interface DeployWorkspaceProjectNotificationTelemetryProps {
    userAction?: 'canceled' | 'browse' | 'viewOutput';
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { CustomTelemetryProps } from "../../telemetry/CustomTelemetryProps";
import type { ICreateContainerAppContext } from "../createContainerApp/ICreateContainerAppContext";
import type { IManagedEnvironmentContext } from "../createManagedEnvironment/IManagedEnvironmentContext";
import type { IBuildImageInAzureContext } from "../image/imageSource/buildImageInAzure/IBuildImageInAzureContext";
import type { CreateAcrContext } from "../image/imageSource/containerRegistry/acr/createAcr/CreateAcrContext";

// Use intersection typing instead of an interface here to bypass some minor (relatively trivial) type mismatch issues introduced by having to use the 'Partial' utility
export type DeployWorkspaceProjectContext = IManagedEnvironmentContext & ICreateContainerAppContext & CreateAcrContext & Partial<IBuildImageInAzureContext> & ExecuteActivityContext & DeployWorkspaceProjectTelemetryProps & {
    shouldSaveDeploySettings?: boolean;
};

interface TelemetryProps {
    hasWorkspaceProjectOpen?: 'true' | 'false';  // Did the user already have a workspace project open when executing the command?
    workspaceSettingsState?: 'none' | 'partial' | 'complete';  // Did we detect workspace project settings?
    triggeredSettingsOverride?: 'true'; // Did the starting tree item provided conflict with existing project settings?
    acceptedSettingsOverride?: 'true';  // Did the user proceed anyway?
    promptedForEnvironment?: 'true';
}

type DeployWorkspaceProjectTelemetryProps = CustomTelemetryProps<TelemetryProps>;

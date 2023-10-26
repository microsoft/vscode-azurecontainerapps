/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import type { DeployWorkspaceProjectTelemetryProps as TelemetryProps } from "../../telemetry/commandTelemetryProps";
import type { CreateContainerAppContext } from "../createContainerApp/CreateContainerAppContext";
import type { IManagedEnvironmentContext } from "../createManagedEnvironment/IManagedEnvironmentContext";
import { BuildImageInAzureImageSourceBaseContext } from "../image/imageSource/buildImageInAzure/BuildImageInAzureContext";
import type { CreateAcrContext } from "../image/imageSource/containerRegistry/acr/createAcr/CreateAcrContext";

// Use intersection typing instead of an interface here to bypass some minor (relatively trivial) type mismatch issues introduced by having to use the 'Partial' utility
export type DeployWorkspaceProjectContext = IManagedEnvironmentContext & CreateContainerAppContext & CreateAcrContext & Partial<BuildImageInAzureImageSourceBaseContext> & ExecuteActivityContext & DeployWorkspaceProjectTelemetryProps & {
    shouldSaveDeploySettings?: boolean;
};

type DeployWorkspaceProjectTelemetryProps = SetTelemetryProps<TelemetryProps>;

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { type DeployWorkspaceProjectTelemetryProps as TelemetryProps } from "../../telemetry/commandTelemetryProps";
import { type IContainerAppContext } from "../IContainerAppContext";
import { type CreateContainerAppBaseContext } from "../createContainerApp/CreateContainerAppContext";
import { type IManagedEnvironmentContext } from "../createManagedEnvironment/IManagedEnvironmentContext";
import { type BuildImageInAzureImageSourceBaseContext } from "../image/imageSource/buildImageInAzure/BuildImageInAzureImageSourceContext";
import { type CreateAcrContext } from "../image/imageSource/containerRegistry/acr/createAcr/CreateAcrContext";

// Use intersection typing instead of an interface here to bypass some minor (relatively trivial) type mismatch issues introduced by having to use the 'Partial' utility
export type DeployWorkspaceProjectContext =
    IContainerAppContext &
    Partial<IManagedEnvironmentContext> &
    Partial<CreateContainerAppBaseContext> &
    Partial<CreateAcrContext> &
    Partial<BuildImageInAzureImageSourceBaseContext> &
    Partial<ExecuteActivityContext> &
    DeployWorkspaceProjectTelemetryProps &
    {
        shouldSaveDeploySettings?: boolean;
    };

type DeployWorkspaceProjectTelemetryProps = SetTelemetryProps<TelemetryProps>;

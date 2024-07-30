/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type DeployWorkspaceProjectInternalTelemetryProps as TelemetryProps } from "../../../telemetry/deployWorkspaceProjectTelemetryProps";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { type CreateContainerAppBaseContext } from "../../createContainerApp/CreateContainerAppContext";
import { type CreateManagedEnvironmentContext } from "../../createManagedEnvironment/CreateManagedEnvironmentContext";
import { type BuildImageInAzureImageSourceBaseContext } from "../../image/imageSource/buildImageInAzure/BuildImageInAzureImageSourceContext";
import { type CreateAcrContext } from "../../registries/createAcr/CreateAcrContext";
import { type DeploymentConfiguration } from "../deploymentConfiguration/DeploymentConfiguration";

// Use intersection typing instead of an interface here to bypass some minor (relatively trivial) type mismatch issues introduced by having to use the 'Partial' utility
export type DeployWorkspaceProjectInternalBaseContext =
    IContainerAppContext &
    Partial<CreateManagedEnvironmentContext> &
    Partial<CreateContainerAppBaseContext> &
    Partial<CreateAcrContext> &
    Partial<BuildImageInAzureImageSourceBaseContext> &
    Pick<DeploymentConfiguration, 'configurationIdx'> &
    Partial<ExecuteActivityContext> &
    {
        shouldSaveDeploySettings?: boolean;
    };


export type DeployWorkspaceProjectInternalContext = DeployWorkspaceProjectInternalBaseContext & SetTelemetryProps<TelemetryProps>;


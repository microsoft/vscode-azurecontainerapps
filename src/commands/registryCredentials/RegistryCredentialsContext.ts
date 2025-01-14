/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type ContainerRegistryCredentialsTelemetryProps as TelemetryProps } from "../../telemetry/ImageSourceTelemetryProps";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { type DockerLoginRegistryCredentialsContext } from "./dockerLogin/DockerLoginRegistryCredentialsContext";
import { type ManagedIdentityRegistryCredentialsContext } from "./identity/ManagedIdentityRegistryCredentialsContext";
import { type RegistryCredentialType } from "./RegistryCredentialsAddConfigurationListStep";

export type CredentialTypeContext = DockerLoginRegistryCredentialsContext & ManagedIdentityRegistryCredentialsContext;

export interface RegistryCredentialsBaseContext extends CredentialTypeContext, ExecuteActivityContext {
    newRegistryCredentialType?: RegistryCredentialType;
    registryCredentials?: RegistryCredentials[];
    secrets?: Secret[];
}

export type RegistryCredentialsContext = RegistryCredentialsBaseContext & SetTelemetryProps<TelemetryProps>;

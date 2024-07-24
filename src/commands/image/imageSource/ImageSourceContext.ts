/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type EnvironmentVar, type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type ImageSource } from "../../../constants";
import { type ImageSourceTelemetryProps as TelemetryProps } from "../../../telemetry/ImageSourceTelemetryProps";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { type ManagedEnvironmentContext } from "../../ManagedEnvironmentContext";

export interface ImageSourceBaseContext extends ManagedEnvironmentContext, IContainerAppContext, ExecuteActivityContext {
    // ImageSourceListStep
    imageSource?: ImageSource;
    showQuickStartImage?: boolean;

    // Base image attributes used as a precursor for either creating or updating a container app
    image?: string;
    registries?: RegistryCredentials[];
    secrets?: Secret[];

    envPath?: string;
    environmentVariables?: EnvironmentVar[];
}

export type ImageSourceContext = ImageSourceBaseContext & SetTelemetryProps<TelemetryProps>;

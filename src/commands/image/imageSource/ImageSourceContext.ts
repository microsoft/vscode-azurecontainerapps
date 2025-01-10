/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type EnvironmentVar, type Template } from "@azure/arm-appcontainers";
import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type ImageSource } from "../../../constants";
import { type ImageSourceTelemetryProps as TelemetryProps } from "../../../telemetry/ImageSourceTelemetryProps";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { type RegistryCredentialsContext } from "../../registryCredentials/RegistryCredentialsContext";

export interface ImageSourceBaseContext extends RegistryCredentialsContext, IContainerAppContext, ExecuteActivityContext {
    // If a template is provided, prioritize data from this, else prioritize the latest container app template
    // Todo: In the future, we should migrate to always requiring a template be supplied in advance by individual commands
    template?: Template;

    // ImageSourceListStep
    imageSource?: ImageSource;
    showQuickStartImage?: boolean;

    containersIdx?: number;
    image?: string;

    envPath?: string;
    environmentVariables?: EnvironmentVar[];
}

export type ImageSourceContext = ImageSourceBaseContext & SetTelemetryProps<TelemetryProps>;

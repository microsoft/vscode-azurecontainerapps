/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type EnvironmentVar } from "@azure/arm-appcontainers";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type ContainerUpdateTelemetryProps as TelemetryProps } from "../../../telemetry/commandTelemetryProps";
import { type EnvironmentVariableAddContext } from "../addEnvironmentVariable/EnvironmentVariableAddContext";

export interface EnvironmentVariableEditBaseContext extends EnvironmentVariableAddContext {
    // Require the environment variable upfront so we can make edits
    environmentVariable: EnvironmentVar;
}

export type EnvironmentVariableEditContext = EnvironmentVariableEditBaseContext & SetTelemetryProps<TelemetryProps>;

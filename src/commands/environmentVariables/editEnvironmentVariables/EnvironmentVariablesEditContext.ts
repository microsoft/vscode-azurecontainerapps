/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type ContainerEditTelemetryProps as TelemetryProps } from "../../../telemetry/commandTelemetryProps";
import { type EnvironmentVariablesBaseContext } from "../EnvironmentVariablesContext";

export type EnvironmentVariablesEditBaseContext = EnvironmentVariablesBaseContext;
export type EnvironmentVariablesEditContext = EnvironmentVariablesEditBaseContext & SetTelemetryProps<TelemetryProps>;

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerEditTelemetryProps as TelemetryProps } from "../../telemetry/commandTelemetryProps";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { type ContainerEditBaseContext } from "../editContainer/ContainerEditContext";

export type EnvironmentVariablesBaseContext = ContainerEditBaseContext;
export type EnvironmentVariablesContext = EnvironmentVariablesBaseContext & SetTelemetryProps<TelemetryProps>;

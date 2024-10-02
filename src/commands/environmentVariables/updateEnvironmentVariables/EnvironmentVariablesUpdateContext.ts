/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type ContainerUpdateTelemetryProps as TelemetryProps } from "../../../telemetry/commandTelemetryProps";
import { type EnvironmentVariablesBaseContext } from "../EnvironmentVariablesContext";

export type EnvironmentVariablesUpdateBaseContext = EnvironmentVariablesBaseContext;
export type EnvironmentVariablesUpdateContext = EnvironmentVariablesUpdateBaseContext & SetTelemetryProps<TelemetryProps>;

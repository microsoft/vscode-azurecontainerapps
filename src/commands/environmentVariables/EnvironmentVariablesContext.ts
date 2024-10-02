/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerUpdateTelemetryProps as TelemetryProps } from "../../telemetry/commandTelemetryProps";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { type ContainerUpdateBaseContext } from "../updateContainer/ContainerUpdateContext";

export type EnvironmentVariablesBaseContext = ContainerUpdateBaseContext;
export type EnvironmentVariablesContext = EnvironmentVariablesBaseContext & SetTelemetryProps<TelemetryProps>;

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerEditTelemetryProps as TelemetryProps } from "../../../telemetry/commandTelemetryProps";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type ISecretContext } from "../../secret/ISecretContext";
import { type EnvironmentVariableEditBaseContext } from "../editEnvironmentVariable/EnvironmentVariableEditContext";

export interface EnvironmentVariableConvertBaseContext extends EnvironmentVariableEditBaseContext, ISecretContext {
    // Make newSecretValue required
    newSecretValue: string;
}

export type EnvironmentVariableConvertContext = EnvironmentVariableConvertBaseContext & SetTelemetryProps<TelemetryProps>;

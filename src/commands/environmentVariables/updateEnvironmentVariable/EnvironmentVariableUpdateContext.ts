/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type EnvironmentVar } from "@azure/arm-appcontainers";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type ContainerUpdateTelemetryProps as TelemetryProps } from "../../../telemetry/commandTelemetryProps";
import { type ISecretContext } from "../../secret/ISecretContext";
import { type EnvironmentVariablesBaseContext } from "../EnvironmentVariablesContext";
import { type EnvironmentVariableType } from "../addEnvironmentVariable/EnvironmentVariableTypeListStep";

export interface EnvironmentVariableUpdateBaseContext extends EnvironmentVariablesBaseContext, Pick<ISecretContext, 'secretName'> {
    newEnvironmentVariableType?: EnvironmentVariableType;
    newEnvironmentVariableName?: string;
    newEnvironmentVariableManualInput?: string;
    // secretName

    environmentVariable: EnvironmentVar;
}

export type EnvironmentVariableUpdateContext = EnvironmentVariableUpdateBaseContext & SetTelemetryProps<TelemetryProps>;

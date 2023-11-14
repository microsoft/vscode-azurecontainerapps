/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Template } from "@azure/arm-appcontainers";
import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type DeployRevisionDraftTelemetryProps as TelemetryProps } from "../../../telemetry/commandTelemetryProps";
import { type IContainerAppContext } from "../../IContainerAppContext";

interface DeployRevisionDraftBaseContext extends IContainerAppContext, ExecuteActivityContext {
    template: Template | undefined;
}

export type DeployRevisionDraftContext = DeployRevisionDraftBaseContext & SetTelemetryProps<TelemetryProps>;

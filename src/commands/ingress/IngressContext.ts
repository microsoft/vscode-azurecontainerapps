/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { IngressTelemetryProps as TelemetryProps } from "../../telemetry/commandTelemetryProps";
import type { IContainerAppContext } from "../IContainerAppContext";
import { PortRange } from "./tryGetDockerfileExposePorts";

export interface IngressBaseContext extends IContainerAppContext, ExecuteActivityContext {
    enableIngress?: boolean;
    enableExternal?: boolean;

    targetPort?: number;

    // For detecting an expose port using a workspace Dockerfile
    dockerfilePath?: string;
    dockerfileExposePorts?: PortRange[];
    alwaysPromptIngress?: boolean;
}

export type IngressContext = IngressBaseContext & SetTelemetryProps<TelemetryProps>

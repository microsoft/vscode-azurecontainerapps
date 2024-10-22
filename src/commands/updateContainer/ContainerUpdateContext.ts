/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { type ContainerUpdateTelemetryProps as TelemetryProps } from "../../telemetry/commandTelemetryProps";
import { type IContainerAppContext } from "../IContainerAppContext";
import { type ImageSourceBaseContext } from "../image/imageSource/ImageSourceContext";

export interface ContainerUpdateBaseContext extends IContainerAppContext, ImageSourceBaseContext, ExecuteActivityContext {
    containersIdx: number;
}

export type ContainerUpdateContext = ContainerUpdateBaseContext & SetTelemetryProps<TelemetryProps>;

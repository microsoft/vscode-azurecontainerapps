/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type DeployImageApiTelemetryProps as TelemetryProps } from "../../../telemetry/commandTelemetryProps";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type ImageSourceBaseContext } from "../../image/imageSource/ImageSourceContext";

export type DeployImageApiContext = ImageSourceBaseContext & ExecuteActivityContext & SetTelemetryProps<TelemetryProps>;

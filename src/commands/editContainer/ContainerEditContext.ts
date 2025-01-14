/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { type ContainerEditTelemetryProps as TelemetryProps } from "../../telemetry/commandTelemetryProps";
import { type ImageSourceBaseContext } from "../image/imageSource/ImageSourceContext";
import { type RevisionDraftContext } from "../revisionDraft/RevisionDraftContext";

export interface ContainerEditBaseContext extends RevisionDraftContext, ImageSourceBaseContext, ExecuteActivityContext {
    containersIdx: number;
}

export type ContainerEditContext = ContainerEditBaseContext & SetTelemetryProps<TelemetryProps>;

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Template } from "@azure/arm-appcontainers";
import { type DeployImageApiContext } from "../api/deployImageApi/DeployImageApiContext";

export interface DeployImageContext extends DeployImageApiContext {
    containersIdx: number;
    template: Template;
}

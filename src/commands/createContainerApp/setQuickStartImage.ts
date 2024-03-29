/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { quickStartImageName } from "../../constants";
import { type CreateContainerAppContext } from "./CreateContainerAppContext";

export function setQuickStartImage(context: Partial<CreateContainerAppContext>): void {
    context.image = quickStartImageName;
    context.enableIngress = true;
    context.enableExternal = true;
    context.targetPort = 80;
}

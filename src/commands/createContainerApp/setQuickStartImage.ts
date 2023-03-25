/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { quickStartImageName } from "../../constants";
import { IContainerAppContext } from "./IContainerAppContext";

export function setQuickStartImage(context: Partial<IContainerAppContext>): void {
    context.image = quickStartImageName;
    context.enableIngress = true;
    context.enableExternal = true;
    context.targetPort = 80;
}

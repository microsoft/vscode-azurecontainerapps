/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { quickStartImageName } from "../../constants";
import { ICreateContainerAppContext } from "./ICreateContainerAppContext";

export function setQuickStartImage(context: Partial<ICreateContainerAppContext>): void {
    context.image = quickStartImageName;
    context.enableIngress = true;
    context.enableExternal = true;
    context.targetPort = 80;
}

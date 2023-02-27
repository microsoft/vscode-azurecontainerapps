/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IContainerAppContext } from "./IContainerAppContext";

export function setQuickStartImage(context: IContainerAppContext): void {
    context.image = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest';
    context.enableIngress = true;
    context.enableExternal = true;
    context.targetPort = 80;
}

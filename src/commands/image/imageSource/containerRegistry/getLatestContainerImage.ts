/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp } from "@azure/arm-appcontainers";

export function getLatestContainerAppImage(containerApp: ContainerApp): string | undefined {
    // We are currently only supporting one active container image per app
    return containerApp.template?.containers?.[0]?.image;
}

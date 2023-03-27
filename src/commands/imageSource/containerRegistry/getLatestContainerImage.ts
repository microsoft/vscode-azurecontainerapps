/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerApp } from "@azure/arm-appcontainers";

export function getLatestContainerAppImage(containerApp: ContainerApp): string | undefined {
    // Currently only support single container
    return containerApp.template?.containers?.[0]?.image;
}

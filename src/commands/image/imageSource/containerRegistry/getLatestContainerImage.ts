/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp } from "@azure/arm-appcontainers";

export function getLatestContainerAppImage(containerApp: ContainerApp, containersIdx: number): string | undefined {
    return containerApp.template?.containers?.[containersIdx]?.image;
}

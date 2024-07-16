/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RoleAssignment } from "@azure/arm-authorization";
import { type Registry } from "@azure/arm-containerregistry";
import { type IContainerAppContext } from "../../IContainerAppContext";

export interface ContainerRegistryIdentityConnectionContext extends IContainerAppContext {
    registry?: Registry;
    registryRoleAssignment?: RoleAssignment;
}

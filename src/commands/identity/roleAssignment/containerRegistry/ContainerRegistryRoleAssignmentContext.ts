/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RoleAssignment } from "@azure/arm-authorization";
import { type Registry } from "@azure/arm-containerregistry";
import { type ManagedEnvironmentContext } from "../../../ManagedEnvironmentContext";

export interface ContainerRegistryRoleAssignmentContext extends ManagedEnvironmentContext {
    registry?: Registry;
    registryRoleAssignment?: RoleAssignment;
}

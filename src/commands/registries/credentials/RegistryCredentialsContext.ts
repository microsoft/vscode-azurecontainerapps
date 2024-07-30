/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { type RoleAssignment } from "@azure/arm-authorization";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { type ManagedEnvironmentContext } from "../../ManagedEnvironmentContext";
import { type AcrContext } from "../acr/AcrContext";

export interface RegistryCredentialsContext extends AcrContext, ManagedEnvironmentContext, IContainerAppContext {
    // Registry credentials
    registryCredentials?: RegistryCredentials[];
    secrets?: Secret[];

    // Managed identity
    principalId?: string;
    registryRoleAssignment?: RoleAssignment;
}

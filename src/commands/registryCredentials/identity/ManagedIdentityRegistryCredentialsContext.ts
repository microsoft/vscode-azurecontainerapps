/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials } from "@azure/arm-appcontainers";
import { type RoleAssignment } from "@azure/arm-authorization";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { type ManagedEnvironmentContext } from "../../ManagedEnvironmentContext";
import { type CreateAcrContext } from "../../image/imageSource/containerRegistry/acr/createAcr/CreateAcrContext";

export interface ManagedIdentityRegistryCredentialsContext extends CreateAcrContext, ManagedEnvironmentContext, IContainerAppContext {
    principalId?: string;
    registryRoleAssignment?: RoleAssignment;

    newRegistryCredential?: RegistryCredentials;
}

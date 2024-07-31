/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { type RegistryCredentialType } from "./RegistryCredentialAddConfigurationListStep";
import { type AdminUserRegistryCredentialsContext } from "./adminUser/AdminUserRegistryCredentialsContext";
import { type ManagedIdentityRegistryCredentialsContext } from "./identity/ManagedIdentityRegistryCredentialsContext";

export type CredentialTypeContext = AdminUserRegistryCredentialsContext & ManagedIdentityRegistryCredentialsContext;

export interface RegistryCredentialsContext extends CredentialTypeContext {
    newRegistryCredentialType?: RegistryCredentialType;
    registryCredentials?: RegistryCredentials[];
    secrets?: Secret[];
}

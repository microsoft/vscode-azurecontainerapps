/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials } from "@azure/arm-appcontainers";
import { type SupportedRegistries } from "../../../constants";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { type CreateAcrContext } from "../../image/imageSource/containerRegistry/acr/createAcr/CreateAcrContext";
import { type ManagedEnvironmentContext } from "../../ManagedEnvironmentContext";

export interface ManagedIdentityRegistryCredentialsContext extends CreateAcrContext, ManagedEnvironmentContext, IContainerAppContext {
    registryDomain?: SupportedRegistries;
    newRegistryCredential?: RegistryCredentials;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from "@azure/arm-appcontainers";
import { type SupportedRegistries } from "../../../constants";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { type CreateAcrContext } from "../../image/imageSource/containerRegistry/acr/createAcr/CreateAcrContext";

export interface DockerLoginRegistryCredentialsContext extends CreateAcrContext, IContainerAppContext {
    // These values are often pre-populated from the Docker extension via the deployImage API layer
    registryDomain?: SupportedRegistries;
    registryName?: string;
    username?: string;
    secret?: string;

    newRegistrySecret?: Secret;
    newRegistryCredential?: RegistryCredentials;

    suppressEnableAdminUserPrompt?: boolean;
}

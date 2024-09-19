/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { acrDomain, type SupportedRegistries } from "../../constants";
import { detectRegistryDomain } from "../../utils/imageNameUtils";
import { type RegistryCredentialsContext } from "./RegistryCredentialsContext";

export function getRegistryDomain(context: Partial<RegistryCredentialsContext>): SupportedRegistries | undefined {
    if (context.registryDomain) {
        return context.registryDomain;
    } else if (context.registry?.loginServer || context.registryName) {
        return detectRegistryDomain(context.registry?.loginServer || nonNullProp(context, 'registryName'));
    } else {
        // If no registries exist, we can assume we're creating a new ACR
        return acrDomain;
    }
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { acrDomain, dockerHubDomain } from "../../../constants";
import { nonNullValue } from "../../../utils/nonNull";
import { IContainerRegistryImageContext } from "./IContainerRegistryImageContext";

export function getLoginServer(context: IContainerRegistryImageContext): string {
    switch (context.registryDomain) {
        case acrDomain:
            return nonNullValue(context.registry?.loginServer);
        case dockerHubDomain:
            return `${dockerHubDomain}/${context.dockerHubNamespace}`
        default:
            return context.registryDomain || '';
    }
}

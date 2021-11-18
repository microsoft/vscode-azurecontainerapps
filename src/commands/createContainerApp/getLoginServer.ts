/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { acrDomain, dockerDomain } from "../../constants";
import { nonNullValue } from "../../utils/nonNull";
import { IDeployImageContext } from "../deployImage/IDeployImageContext";

export function getLoginServer(context: IDeployImageContext): string {
    switch (context.registryDomain) {
        case acrDomain:
            return nonNullValue(context.registry?.loginServer);
        case dockerDomain:
            return `${dockerDomain}/${context.dockerNamespace}`
        default:
            return context.registryDomain || '';
    }
}

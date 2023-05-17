/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IngressContext } from "./IngressContext";

export function isIngressEnabled(context: IngressContext): boolean {
    return !!context.containerApp?.configuration?.ingress;
}

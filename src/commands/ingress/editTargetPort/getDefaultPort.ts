/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { IngressContext } from "../IngressContext";

export function getDefaultPort(context: IngressContext, fallbackPort: number = 80): number {
    return context.containerApp?.configuration?.ingress?.targetPort || fallbackPort;
}

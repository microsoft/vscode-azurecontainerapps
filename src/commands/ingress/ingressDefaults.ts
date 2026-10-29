/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Ingress } from '@azure/arm-appcontainers';

export const enabledIngressDefaults: Pick<Ingress, 'transport' | 'allowInsecure' | 'traffic'> = {
    transport: 'auto',
    allowInsecure: false,
    traffic: [
        {
            weight: 100,
            latestRevision: true
        }
    ],
};

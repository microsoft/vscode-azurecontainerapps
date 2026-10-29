/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownIngressTransportMethod, type ContainerResources, type Ingress, type ManagedEnvironment, type Scale } from '@azure/arm-appcontainers';
import { enabledIngressDefaults } from '../ingress/ingressDefaults';

interface ContainerAppDefaults {
    ingress: Pick<Ingress, 'transport' | 'allowInsecure' | 'traffic'>;
    resources: ContainerResources;
    scale: Scale;
}

export function getContainerAppDefaults(environmentMode?: ManagedEnvironment['environmentMode']): ContainerAppDefaults {
    switch (environmentMode) {
        case 'Express':
            return {
                ingress: {
                    transport: KnownIngressTransportMethod.Http,
                    allowInsecure: false,
                },
                resources: { cpu: 0.5, memory: '1Gi' },
                scale: {
                    minReplicas: 0,
                    maxReplicas: 1,
                    rules: [
                        {
                            name: 'http-scaler',
                            http: { metadata: { concurrentRequests: '10' } },
                        }
                    ],
                },
            };
        default:
            return {
                ingress: { ...enabledIngressDefaults },
                resources: { cpu: 0.5, memory: '1Gi' },
                scale: { minReplicas: 0, maxReplicas: 1 },
            };
    }
}

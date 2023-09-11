/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { IngressContext, PortRange, getDefaultPort } from "../../extension.bundle";
import type { MockIngressContext } from "./MockIngressContext";

suite('getDefaultPort', async () => {
    test('correctly suggests when provided detected expose ports and no existing container app port', async () => {
        const context: MockIngressContext = {
            dockerfileExposePorts: [new PortRange(443), new PortRange(8080, 8090)]
        };
        assert.equal(getDefaultPort(context as IngressContext), 443);
    });

    test('correctly suggests deployed port when detected expose ports overlap with existing container app port', async () => {
        const context: MockIngressContext = {
            containerApp: { configuration: { ingress: { targetPort: 8081 } } },
            dockerfileExposePorts: [new PortRange(80), new PortRange(443), new PortRange(8080, 8090)]
        };
        assert.equal(getDefaultPort(context as IngressContext), 8081);
    });

    test('correctly suggests existing deploy port when no expose ports detected', async () => {
        const context: MockIngressContext = {
            containerApp: { configuration: { ingress: { targetPort: 3000 } } },
        };
        assert.equal(getDefaultPort(context as IngressContext), 3000);
    });

    test('correctly suggests fallback port when no other port numbers are available', async () => {
        assert.equal(getDefaultPort({} as IngressContext), 80);
    });
});

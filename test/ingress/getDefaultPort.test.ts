/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { IngressContext, PortRange, getDefaultPort } from "../../extension.bundle";
import type { MockIngressContext } from "./MockIngressContext";

suite('getDefaultPort', async () => {
    test('Correctly suggests a new port when Dockerfile expose ports are detected with no existing container app port', async () => {
        const context: MockIngressContext = {
            dockerfileExposePorts: [new PortRange(443), new PortRange(8080, 8090)]
        };
        assert.equal(getDefaultPort(context as IngressContext), 443);
    });

    test('Correctly suggests deployed port when Dockerfile expose ports are detected that overlap with existing container app port', async () => {
        const context: MockIngressContext = {
            containerApp: { configuration: { ingress: { targetPort: 8081 } } },
            dockerfileExposePorts: [new PortRange(80), new PortRange(443), new PortRange(8080, 8090)]
        };
        assert.equal(getDefaultPort(context as IngressContext), 8081);
    });

    test('Correctly suggests existing deploy port when no expose ports are detected', async () => {
        const context: MockIngressContext = {
            containerApp: { configuration: { ingress: { targetPort: 3000 } } },
        };
        assert.equal(getDefaultPort(context as IngressContext), 3000);
    });

    test('Correctly suggests fallback port when no other ports are available', async () => {
        assert.equal(getDefaultPort({} as IngressContext), 80);
    });
});

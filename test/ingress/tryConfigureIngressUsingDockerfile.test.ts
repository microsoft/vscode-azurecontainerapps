/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra } from "@microsoft/vscode-azext-utils";
import * as assert from "assert";
import * as path from "path";
import { IngressContext, PortRange, getDockerfileExposePorts, tryConfigureIngressUsingDockerfile } from "../../extension.bundle";
import type { MockIngressContext } from "./MockIngressContext";

const expectedSamplePorts: PortRange[][] = [
    [new PortRange(443), new PortRange(80)],
    [new PortRange(80), new PortRange(443)],
    [new PortRange(80), new PortRange(8080, 8090)],
    [new PortRange(80), new PortRange(8080, 8090)],
    [new PortRange(443)],
    [new PortRange(80), new PortRange(443), new PortRange(8080, 8090)],
    []
];

suite('tryConfigureIngressUsingDockerfile', async () => {
    test('self', async () => {
        const dockerfileSamplesPath: string = path.join(__dirname, 'dockerfileSamples');
        const dockerfileSamples = await AzExtFsExtra.readDirectory(dockerfileSamplesPath);

        const expectedResult: MockIngressContext[] = [
            { enableIngress: true, enableExternal: true, dockerfileExposePorts: expectedSamplePorts[0], targetPort: 443 },
            { enableIngress: undefined, enableExternal: undefined, dockerfileExposePorts: undefined, targetPort: undefined }, // no dockerfilePath
            { enableIngress: true, enableExternal: true, dockerfileExposePorts: expectedSamplePorts[2], targetPort: 80 },
            { enableIngress: undefined, enableExternal: undefined, dockerfileExposePorts: expectedSamplePorts[3], targetPort: undefined }, // alwaysPromptIngress
            { enableIngress: true, enableExternal: true, dockerfileExposePorts: expectedSamplePorts[4], targetPort: 443 },
            { enableIngress: true, enableExternal: true, dockerfileExposePorts: expectedSamplePorts[5], targetPort: 80 },
            { enableIngress: false, enableExternal: false, dockerfileExposePorts: undefined, targetPort: undefined }, // no expose
        ];

        for (const [i, ds] of dockerfileSamples.entries()) {
            const context: MockIngressContext = {
                dockerfilePath: i === 1 ? undefined : ds.fsPath,
                alwaysPromptIngress: i === 3
            };

            await tryConfigureIngressUsingDockerfile(context as IngressContext);

            assert.deepStrictEqual({
                enableIngress: context.enableIngress,
                enableExternal: context.enableExternal,
                dockerfileExposePortsLength: context.dockerfileExposePorts?.length,
                targetPort: context.targetPort
            }, {
                enableIngress: expectedResult[i].enableIngress,
                enableExternal: expectedResult[i].enableExternal,
                dockerfileExposePortsLength: expectedResult[i].dockerfileExposePorts?.length,
                targetPort: expectedResult[i].targetPort
            });
        }
    });

    test('getDockerfileExposePorts', async () => {
        const dockerfileSamplesPath: string = path.join(__dirname, 'dockerfileSamples');
        const dockerfileSamples = await AzExtFsExtra.readDirectory(dockerfileSamplesPath);

        for (const [i, ds] of dockerfileSamples.entries()) {
            const portRange: PortRange[] = await getDockerfileExposePorts(ds.fsPath) ?? [];

            for (const [j, pr] of portRange.entries()) {
                assert.equal(pr.start, expectedSamplePorts[i][j].start);
                assert.equal(pr.end, expectedSamplePorts[i][j].end);
            }
        }
    });
});

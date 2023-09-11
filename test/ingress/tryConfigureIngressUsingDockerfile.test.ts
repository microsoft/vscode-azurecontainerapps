/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra } from "@microsoft/vscode-azext-utils";
import * as assert from "assert";
import * as path from "path";
import { IngressContext, PortRange, getDockerfileExposePort, tryConfigureIngressUsingDockerfile } from "../../extension.bundle";
import type { MockIngressContext } from "./MockIngressContext";

suite('tryConfigureIngressUsingDockerfile', async () => {
    test('self', async () => {
        const dockerfileSamplesPath: string = path.join(__dirname, 'dockerfileSamples');
        const dockerfileSamples = await AzExtFsExtra.readDirectory(dockerfileSamplesPath);

        const expectedResult = [
            { enableIngress: true, enableExternal: true },
            { enableIngress: undefined, enableExternal: undefined }, // no dockerfilePath
            { enableIngress: true, enableExternal: true },
            { enableIngress: undefined, enableExternal: undefined }, // alwaysPromptIngress
            { enableIngress: true, enableExternal: true },
            { enableIngress: true, enableExternal: true },
            { enableIngress: false, enableExternal: false },
        ];

        for (const [i, ds] of dockerfileSamples.entries()) {
            const context: MockIngressContext = {
                dockerfilePath: i === 1 ? undefined : ds.fsPath,
                alwaysPromptIngress: i === 3
            };

            await tryConfigureIngressUsingDockerfile(context as IngressContext);

            assert.deepStrictEqual({ enableIngress: context.enableIngress, enableExternal: context.enableExternal }, expectedResult[i])
        }
    });

    test('getDockerfileExposePorts', async () => {
        const dockerfileSamplesPath: string = path.join(__dirname, 'dockerfileSamples');
        const dockerfileSamples = await AzExtFsExtra.readDirectory(dockerfileSamplesPath);

        const expectedResult: PortRange[][] = [
            [new PortRange(80), new PortRange(443)],
            [new PortRange(80), new PortRange(443)],
            [new PortRange(80), new PortRange(8080, 8090)],
            [new PortRange(80), new PortRange(8080, 8090)],
            [new PortRange(80)],
            [new PortRange(80), new PortRange(443), new PortRange(8080, 8090)],
            []
        ];

        for (const [i, ds] of dockerfileSamples.entries()) {
            const portRange: PortRange[] = await getDockerfileExposePort(ds.fsPath) ?? [];

            for (const [j, pr] of portRange.entries()) {
                assert.equal(pr.start, expectedResult[i][j].start);
                assert.equal(pr.end, expectedResult[i][j].end);
            }
        }
    });
});

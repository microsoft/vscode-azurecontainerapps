/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra } from "@microsoft/vscode-azext-utils";
import * as assert from "assert";
import { IngressContext } from "src/commands/ingress/IngressContext";
import { type Uri } from "vscode";
import { tryConfigureIngressUsingDockerfile } from "../../src/commands/ingress/IngressPromptStep";
import { getWorkspaceFolderUri } from "../testUtils";
import { wrapWithMockTelemetry } from "../wrapWithMockTelemetry";
import { type MockIngressContext } from "./MockIngressContext";
import { expectedSamplePorts } from "./tryGetDockerfileExposePorts.test";

suite('IngressPromptStep', async () => {
    test('tryConfigureIngressUsingDockerfile', async () => {
        const dockerfilesPath: Uri = getWorkspaceFolderUri('dockerfiles');
        const dockerfiles = await AzExtFsExtra.readDirectory(dockerfilesPath);

        const expectedResult: MockIngressContext[] = [
            { enableIngress: true, enableExternal: true, dockerfileExposePorts: expectedSamplePorts[0], targetPort: 443 },
            { enableIngress: undefined, enableExternal: undefined, dockerfileExposePorts: undefined, targetPort: undefined }, // no dockerfilePath
            { enableIngress: true, enableExternal: true, dockerfileExposePorts: expectedSamplePorts[2], targetPort: 80 },
            { enableIngress: undefined, enableExternal: undefined, dockerfileExposePorts: expectedSamplePorts[3], targetPort: undefined }, // alwaysPromptIngress=true
            { enableIngress: true, enableExternal: true, dockerfileExposePorts: expectedSamplePorts[4], targetPort: 443 },
            { enableIngress: true, enableExternal: true, dockerfileExposePorts: expectedSamplePorts[5], targetPort: 80 },
            { enableIngress: false, enableExternal: false, dockerfileExposePorts: undefined, targetPort: undefined }, // no expose
        ];

        for (const [i, ds] of dockerfiles.entries()) {
            const context: MockIngressContext = {
                dockerfilePath: i === 1 ? undefined : ds.fsPath,
                alwaysPromptIngress: i === 3
            };

            await tryConfigureIngressUsingDockerfile(wrapWithMockTelemetry(context) as IngressContext);

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
});

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { AzExtFsExtra } from "node_modules/@microsoft/vscode-azext-utils";
import { PortRange, tryGetDockerfileExposePorts } from "src/commands/ingress/tryGetDockerfileExposePorts";
import { type Uri } from "vscode";
import { getWorkspaceFolderUri } from "../testUtils";

/**
 * Expected port values for the ingress Dockerfile test samples
 */
export const expectedSamplePorts: PortRange[][] = [
    [new PortRange(443), new PortRange(80)],
    [new PortRange(80), new PortRange(443)],
    [new PortRange(80), new PortRange(8080, 8090)],
    [new PortRange(80), new PortRange(8080, 8090)],
    [new PortRange(443)],
    [new PortRange(80), new PortRange(443), new PortRange(8080, 8090)],
    []
];

suite('tryGetDockerfileExposePorts', async () => {
    test('Correctly detects all Dockerfile sample expose ports', async () => {
        const dockerfilesPath: Uri = getWorkspaceFolderUri('dockerfiles');
        const dockerfiles = await AzExtFsExtra.readDirectory(dockerfilesPath);

        for (const [i, ds] of dockerfiles.entries()) {
            const portRange: PortRange[] = await tryGetDockerfileExposePorts(ds.fsPath) ?? [];

            for (const [j, pr] of portRange.entries()) {
                assert.equal(pr.start, expectedSamplePorts[i][j].start);
                assert.equal(pr.end, expectedSamplePorts[i][j].end);
            }
        }
    });
});

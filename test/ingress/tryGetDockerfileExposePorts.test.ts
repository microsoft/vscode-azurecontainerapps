import * as assert from "assert";
import * as path from "path";
import { AzExtFsExtra, PortRange, tryGetDockerfileExposePorts } from "../../extension.bundle";

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
        const dockerfileSamplesPath: string = path.join(__dirname, 'dockerfileSamples');
        const dockerfileSamples = await AzExtFsExtra.readDirectory(dockerfileSamplesPath);

        for (const [i, ds] of dockerfileSamples.entries()) {
            const portRange: PortRange[] = await tryGetDockerfileExposePorts(ds.fsPath) ?? [];

            for (const [j, pr] of portRange.entries()) {
                assert.equal(pr.start, expectedSamplePorts[i][j].start);
                assert.equal(pr.end, expectedSamplePorts[i][j].end);
            }
        }
    });
});

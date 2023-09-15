/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra } from "@microsoft/vscode-azext-utils";

export async function tryGetDockerfileExposePorts(dockerfilePath: string): Promise<PortRange[] | undefined> {
    if (!await AzExtFsExtra.pathExists(dockerfilePath)) {
        return undefined;
    }

    const content: string = await AzExtFsExtra.readFile(dockerfilePath);
    const lines: string[] = content.split('\n');

    const portRanges: PortRange[] = [];
    for (const line of lines) {
        if (!/^EXPOSE/i.test(line.trim())) {
            continue;
        }

        // Identify all single port numbers that aren't for udp
        // Example formats: `3000` or `3000/tcp` but not `3000/udp`
        // Note: (?<=\s) prevents the last number in a range 3000-3010 from being selected
        const singlePorts: string[] = line.match(/(?<=\s)\d{2,5}(?!(\-)|(\/udp))\b/g) ?? [];
        for (const sp of singlePorts) {
            portRanges.push(new PortRange(parseInt(sp)));
        }

        // Identify all port ranges
        // Example format: `3000-3010`
        const portRange: string[] = line.match(/\d{2,5}\-\d{2,5}/g) ?? [];
        for (const pr of portRange) {
            const [start, end] = pr.split('-');
            portRanges.push(new PortRange(parseInt(start), parseInt(end)));
        }
    }

    return portRanges.length ? portRanges : undefined;
}

export class PortRange {
    private readonly _start: number;
    private readonly _end: number;

    constructor(start: number, end?: number) {
        this._start = start;
        this._end = end ? end : start;
    }

    get start(): number {
        return this._start;
    }

    get end(): number {
        return this._end;
    }

    includes(port: number): boolean {
        return port >= this.start && port <= this.end;
    }
}

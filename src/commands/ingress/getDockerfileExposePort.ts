/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra } from '@microsoft/vscode-azext-utils';

export class PortRange {
    private readonly start: number;
    private readonly end: number;

    constructor(start: number, end?: number) {
        this.start = start;
        this.end = end ? end : start;
    }

    includes(port: number): boolean {
        return port >= this.start && port <= this.end;
    }

    getStartPort(): number {
        return this.start;
    }
}

export async function getDockerfileExposePort(dockerfilePath: string): Promise<PortRange[] | undefined> {
    if (!await AzExtFsExtra.pathExists(dockerfilePath)) {
        return undefined;
    }

    const content: string = await AzExtFsExtra.readFile(dockerfilePath);
    const lines: string[] = content.split('\n');

    const portRanges: PortRange[] = [];
    for (const line of lines) {
        if (/^EXPOSE/i.test(line.trim())) {
            // Identify all single port numbers that aren't for UDP
            const singlePorts: string[] = line.match(/(?<=\s)\d{2,5}(?!(\-)|(\/udp))\b/g) ?? [];
            for (const sp of singlePorts) {
                portRanges.push(new PortRange(parseInt(sp)));
            }

            // Identify all port ranges
            const portRange: string[] = line.match(/\d{2,5}\-\d{2,5}/g) ?? [];
            for (const pr of portRange) {
                const [start, end] = pr.split('-');
                portRanges.push(new PortRange(parseInt(start), parseInt(end)));
            }
        }
    }

    return portRanges.length ? portRanges : undefined;
}

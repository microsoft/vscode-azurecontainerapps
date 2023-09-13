/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra } from '@microsoft/vscode-azext-utils';
import { ext } from '../../extensionVariables';
import { localize } from '../../utils/localize';
import type { IngressContext } from './IngressContext';
import { getDefaultPort } from './editTargetPort/getDefaultPort';

export async function tryConfigureIngressUsingDockerfile(context: IngressContext): Promise<void> {
    if (!context.dockerfilePath) {
        return;
    }

    context.dockerfileExposePorts = await getDockerfileExposePorts(context.dockerfilePath);

    if (context.alwaysPromptIngress) {
        return;
    }

    if (!context.dockerfileExposePorts) {
        context.enableIngress = false;
        context.enableExternal = false;
    } else if (context.dockerfileExposePorts) {
        context.enableIngress = true;
        context.enableExternal = true;
        context.targetPort = getDefaultPort(context);
    }

    // If a container app already exists, activity children will be added automatically in later execute steps
    // if (!context.containerApp) {
    //     context.activityChildren?.push(
    //         new GenericTreeItem(undefined, {
    //             contextValue: createActivityChildContext(['ingressPromptStep', activitySuccessContext]),
    //             label: context.enableIngress ?
    //                 localize('ingressEnableLabel', 'Enable ingress on port {0} (found Dockerfile configuration)', context.targetPort) :
    //                 localize('ingressDisableLabel', 'Disable ingress (found Dockerfile configuration)'),
    //             iconPath: activitySuccessIcon
    //         })
    //     );
    // }

    ext.outputChannel.appendLog(context.enableIngress ?
        localize('ingressEnabledLabel', 'Detected ingress on port {0} using Dockerfile configuration.', context.targetPort) :
        localize('ingressDisabledLabel', 'Detected no ingress using Dockerfile configuration.')
    );
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

export async function getDockerfileExposePorts(dockerfilePath: string): Promise<PortRange[] | undefined> {
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

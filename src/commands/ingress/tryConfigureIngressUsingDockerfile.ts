/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, GenericTreeItem } from '@microsoft/vscode-azext-utils';
import { activitySuccessContext, activitySuccessIcon } from '../../constants';
import { ext } from '../../extensionVariables';
import { createActivityChildContext } from '../../utils/activityUtils';
import { localize } from '../../utils/localize';
import { IngressContext } from './IngressContext';
import { getDefaultPort } from './editTargetPort/getDefaultPort';

export async function tryConfigureIngressUsingDockerfile(context: IngressContext): Promise<void> {
    if (!context.dockerfilePath) {
        return;
    }

    context.dockerfileExposePorts = await getDockerfileExposePort(context.dockerfilePath);

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
    if (context.activityChildren && !context.containerApp) {
        context.activityChildren.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['ingressPromptStep', activitySuccessContext]),
                label: context.enableIngress ?
                    localize('ingressEnableLabel', 'Enable ingress on port {0} (found Dockerfile configuration)', context.targetPort) :
                    localize('ingressDisableLabel', 'Disable ingress (found Dockerfile configuration)'),
                iconPath: activitySuccessIcon
            })
        );
    }

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

    getRange(): string {
        if (this.start === this.end) {
            return `${this.start}`;
        } else {
            return `${this.start}-${this.end}`;
        }
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
            // Identify all single port numbers that aren't for udp
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

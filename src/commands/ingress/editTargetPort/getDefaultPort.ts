/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { IngressContext } from "../IngressContext";

export function getDefaultPort(context: IngressContext, fallbackPort: number = 80): number {
    const currentDeploymentPort: number | undefined = context.containerApp?.configuration?.ingress?.targetPort;

    // If the new deployment's Dockerfile port range doesn't include the current deployed target port, suggest a new one in the appropriate EXPOSE range
    let dockerfilePortSuggestion: number | undefined;
    if (currentDeploymentPort && context.dockerfileExposePorts && !context.dockerfileExposePorts.some(p => p.includes(currentDeploymentPort))) {
        dockerfilePortSuggestion = context.dockerfileExposePorts[0].getStartPort();
    }

    return dockerfilePortSuggestion || currentDeploymentPort || fallbackPort;
}

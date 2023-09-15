/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { IngressContext } from "../IngressContext";

export function getDefaultPort(context: IngressContext, fallbackPort: number = 80): number {
    const currentDeploymentPort: number | undefined = context.containerApp?.configuration?.ingress?.targetPort;

    let dockerfilePortSuggestion: number | undefined;
    if (
        // If there's already a deployment port, don't suggest a new port if it's already a port within range of the current Dockerfile expose ports
        (currentDeploymentPort && context.dockerfileExposePorts && !context.dockerfileExposePorts.some(p => p.includes(currentDeploymentPort))) ||
        // If no deployment port but we found expose ports
        (!currentDeploymentPort && context.dockerfileExposePorts)
    ) {
        dockerfilePortSuggestion = context.dockerfileExposePorts[0].start;
    }

    return dockerfilePortSuggestion || currentDeploymentPort || fallbackPort;
}

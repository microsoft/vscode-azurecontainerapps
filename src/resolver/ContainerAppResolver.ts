/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { AppResource, AppResourceResolver } from "@microsoft/vscode-azext-utils/hostapi";
import { containerAppProvider, managedEnvironmentProvider } from "../constants";
import { ResolvedContainerAppResource } from "./ResolvedContainerAppResource";

export class ContainerAppResolver implements AppResourceResolver {
    public async resolveResource(subContext: ISubscriptionContext, resource: AppResource): Promise<ResolvedContainerAppResource | null> {
        if (resource)
    }

    public matchesResource(resource: AppResource): boolean {
        return this.isContainerApp(resource) ||
            this.isManagedEnvironment(resource);
    }

    public isContainerApp(resource: AppResource): boolean {
        return resource.type.toLowerCase() === containerAppProvider;
    }

    public isManagedEnvironment(resource: AppResource): boolean {
        return resource.type.toLowerCase() === managedEnvironmentProvider;
    }
}

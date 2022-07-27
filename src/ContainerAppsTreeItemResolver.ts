/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, IActionContext, ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { AppResource, AppResourceResolver, ResolvedAppResourceBase } from "@microsoft/vscode-azext-utils/hostapi";

export class ContainerAppsResolver implements AppResourceResolver {
    public async resolveResource(subContext: ISubscriptionContext, resource: AppResource): Promise<ResolvedAppResourceBase | null> {
        return await callWithTelemetryAndErrorHandling('resolveResource', async (_context: IActionContext) => {
            try {
                const client: ComputeManagementClient = await createComputeClient([context, subContext]);
                const vm: VirtualMachine = await client.virtualMachines.get(getResourceGroupFromId(nonNullProp(resource, 'id')), nonNullProp(resource, 'name'))
                const instanceView = await client.virtualMachines.instanceView(getResourceGroupFromId(nonNullProp(vm, 'id')), nonNullProp(vm, 'name'));

                return new VirtualMachineTreeItem(subContext, { ...resource, ...vm }, instanceView);
            } catch (e) {
                console.error({ ...context, ...subContext });
                throw e;
            }
        }) ?? null;
    }

    public matchesResource(_resource: AppResource): boolean {
        // return resource.type.toLowerCase() === 'microsoft.compute/virtualmachines';
        return true;
    }
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { ContainerAppsItem } from "../../tree/ContainerAppsBranchDataProvider";
import { localize } from '../../utils/localize';
import { pickContainerApp } from "../../utils/pickContainerApp";
import { updateIngressSettings } from "./updateIngressSettings";

export async function disableIngress(context: IActionContext, node?: ContainerAppsItem): Promise<void> {
    const { subscription, containerApp } = node ??= await pickContainerApp(context);

    await updateIngressSettings(context, {
        ingress: null,
        subscription: subscription,
        containerApp: containerApp,
        working: localize('disabling', 'Disabling ingress for container app "{0}"...', containerApp.name),
        workCompleted: localize('disableCompleted', 'Disabled ingress for container app "{0}"', containerApp.name),
    });
}

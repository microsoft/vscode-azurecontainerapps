/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp } from '@azure/arm-appcontainers';
import { IActionContext, openUrl } from '@microsoft/vscode-azext-utils';
import { ContainerAppItem, isIngressEnabled } from '../tree/ContainerAppItem';
import { localize } from '../utils/localize';
import { pickContainerApp } from '../utils/pickContainerApp';

export async function browseContainerAppNode(context: IActionContext, node?: ContainerAppItem): Promise<void> {
    node ??= await pickContainerApp(context)
    await browseContainerApp(node.containerApp);
}

export async function browseContainerApp(containerApp: ContainerApp): Promise<void> {
    if (isIngressEnabled(containerApp)) {
        return await openUrl(`https://${containerApp.configuration.ingress.fqdn}`);
    }

    throw new Error(localize('enableIngress', 'Enable ingress to perform this action.'));
}

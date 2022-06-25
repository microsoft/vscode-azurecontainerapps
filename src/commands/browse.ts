/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, openUrl } from '@microsoft/vscode-azext-utils';
import { appFilter } from '../constants';
import { ext } from '../extensionVariables';
import { ContainerAppResource } from '../resolver/ContainerAppResource';
import { ContainerAppExtParentTreeItem } from '../tree/ContainerAppExtParentTreeItem';
import { localize } from '../utils/localize';
import { ingressEnabled } from './containerApp/getRevisionMode';

export async function browse(context: IActionContext, node?: ContainerAppExtParentTreeItem<ContainerAppResource> | ContainerAppResource): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource(context, {
            filter: appFilter,
        }) as ContainerAppExtParentTreeItem<ContainerAppResource>;
    }

    // make sure that ingress is enabled
    if (!ingressEnabled(node.resource) || !node.resource.data.configuration?.ingress?.fqdn) {
        throw new Error(localize('enableIngress', 'Enable ingress to perform this action.'));
    }

    await openUrl(`https://${node.resource.data.configuration?.ingress?.fqdn}`);
}

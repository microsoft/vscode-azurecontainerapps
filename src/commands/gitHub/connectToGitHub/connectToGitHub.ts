/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, openUrl, type ITreeItemPickerContext } from "@microsoft/vscode-azext-utils";
import { type ResourceModelBase } from '@microsoft/vscode-azureresources-api';
import { ContainerAppItem, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from '../../../tree/ManagedEnvironmentItem';
import { createPortalUrl } from "../../../utils/createPortalUrl";
import { getManagedEnvironmentFromContainerApp } from '../../../utils/getResourceUtils';
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { isGitHubConnected } from "./isGitHubConnected";

export async function connectToGitHub(context: ITreeItemPickerContext, item?: Pick<ContainerAppItem, 'containerApp' | 'subscription'> & Partial<Pick<ContainerAppItem, 'isExpress'>>): Promise<void> {
    if (!item) {
        context.suppressCreatePick = true;
        item = await pickContainerApp(context, {
            environmentOptions: {
                filter: (_treeItem, element) => {
                    const environment: unknown = (element as { branchItem?: ResourceModelBase })?.branchItem ?? element;
                    return !ManagedEnvironmentItem.isManagedEnvironmentItem(environment) || !environment.isExpress;
                },
                noPicksMessage: localize('noStandardContainerAppsEnvironment', 'Current subscription has no Standard container apps environments'),
            },
            filter: (_treeItem, element) => {
                const app: unknown = (element as { branchItem?: ResourceModelBase })?.branchItem ?? element;
                return !ContainerAppItem.isContainerAppItem(app) || !app.isExpress;
            },
            noPicksMessage: localize('noStandardContainerApps', 'Selected container apps environment has no Standard apps'),
        });
    }

    const { subscription, containerApp } = item;

    // Make containerApp _required_
    const containerAppContext: IContainerAppContext & { containerApp: ContainerAppModel } = {
        ...context,
        ...createSubscriptionContext(subscription),
        subscription,
        containerApp
    };

    const isExpress = item.isExpress ?? (await getManagedEnvironmentFromContainerApp(containerAppContext, containerApp)).environmentMode === 'Express';
    if (isExpress) {
        throw new Error(localize('expressGitHubConnectionUnsupported', 'Connecting to a GitHub repository through the Azure Portal is not supported for Express Container Apps.'));
    }

    if (await isGitHubConnected(containerAppContext)) {
        throw new Error(localize('gitHubAlreadyConnected', '"{0}" is already connected to a GitHub repository.', containerApp.name));
    }

    /**
     * VS Code does not have sufficient scopes to handle CRUD on service principals & federated credentials.
     * Bump users to the portal to avoid providing an incomplete/partial connection experience.
     */
    const portalUrl: string = createPortalUrl(subscription, `${containerApp.id}/deployment`).toString(true /** skipEncoding */);
    await openUrl(portalUrl);
}

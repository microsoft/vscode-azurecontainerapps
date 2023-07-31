/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITreeItemPickerContext, createSubscriptionContext, openUrl } from "@microsoft/vscode-azext-utils";
import type { ContainerAppItem, ContainerAppModel } from "../../../tree/ContainerAppItem";
import { createPortalUrl } from "../../../utils/createPortalUrl";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { IContainerAppContext } from "../../IContainerAppContext";
import { isGitHubConnected } from "./isGitHubConnected";

export async function connectToGitHub(context: ITreeItemPickerContext, item?: Pick<ContainerAppItem, 'containerApp' | 'subscription'>): Promise<void> {
    if (!item) {
        context.suppressCreatePick = true;
        item = await pickContainerApp(context);
    }

    const { subscription, containerApp } = item;

    // Make containerApp _required_
    const containerAppContext: IContainerAppContext & { containerApp: ContainerAppModel } = {
        ...context,
        ...createSubscriptionContext(subscription),
        subscription,
        containerApp
    };

    if (await isGitHubConnected(containerAppContext)) {
        throw new Error(localize('gitHubAlreadyConnected', '"{0}" is already connected to a GitHub repository.', containerApp.name));
    }

    /**
     * VS Code does not have sufficient scopes to handle CRUD on service principals & federated credentials.
     * Bump users to the portal to avoid providing an incomplete/partial connection experience.
     */
    const portalUrl: string = createPortalUrl(subscription, `${containerApp.id}/continuousDeployment`).toString(true /** skipEncoding */);
    await openUrl(portalUrl);
}

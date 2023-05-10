/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { SourceControl } from "@azure/arm-appcontainers";
import { ITreeItemPickerContext, openUrl } from "@microsoft/vscode-azext-utils";
import type { ContainerAppsItem } from "../../tree/ContainerAppsBranchDataProvider";
import type { ActionsTreeItem } from "../../tree/gitHub/ActionsTreeItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { getContainerAppSourceControl } from "./connectToGitHub/getContainerAppSourceControl";

export async function openGitHubRepo(context: ITreeItemPickerContext, node?: ContainerAppsItem | ActionsTreeItem): Promise<void> {
    if (!node) {
        context.suppressCreatePick = true;
        node = await pickContainerApp(context);
    }

    const { subscription, containerApp } = node;

    const sourceControl: SourceControl | undefined = await getContainerAppSourceControl(context, subscription, containerApp);
    if (!sourceControl) {
        throw new Error(localize('repositoryNotConnected', '"{0}" is not connected to a GitHub repository.', containerApp.name));
    }

    await openUrl(`${sourceControl.repoUrl}/tree/${sourceControl.branch}`);
}

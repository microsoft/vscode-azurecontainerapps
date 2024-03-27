/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";
import * as vscode from "vscode";
import { type AzureResourceContext, type SimpleCommandConfig, type SkillCommandConfig } from "vscode-azure-agent-api";
import { type ContainerAppItem } from "../tree/ContainerAppItem";

const agentExtensionId = "ms-azuretools.vscode-azure-agent";

export async function getAgentCommands(): Promise<(SkillCommandConfig | SimpleCommandConfig)[]> {
    return [
        {
            type: "simple",
            name: "deplyWorkspace",
            commandId: "containerApps.fakeDeployWorkspace",
            displayName: "Deploy Workspace to Container App",
            intentDescription: "Good for when users ask to deploy their current workspace to a container app.",
        },
        {
            type: "simple",
            name: "restartContainerApp",
            commandId: "containerApps.fakeRestartContainerApp",
            displayName: "Restart Container App",
            intentDescription: "Good for when users ask to deploy their current workspace to a container app.",
        }
    ];
}

export async function askAgent(_context: IActionContext, item: ContainerAppItem): Promise<void> {
    const agentExtension = vscode.extensions.getExtension(agentExtensionId);
    if (agentExtension !== undefined) {
        const resourceContext: AzureResourceContext = {
            type: "microsoft.app/containerApps",
            name: item.containerApp.name,
            subscriptionId: item.subscription.subscriptionId,
            resourceGroup: item.resourceGroupName,
        };
        await agentExtension.activate();
        await vscode.commands.executeCommand(
            "azureAgent.setResourceContext",
            resourceContext,
            `@azure I'd like to talk about my ${item.containerApp.name} container app in my ${item.subscription.name} subscription`
        );
    }
}

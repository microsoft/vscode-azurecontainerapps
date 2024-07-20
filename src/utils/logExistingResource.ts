/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { activityInfoIcon, activitySuccessContext, GenericTreeItem, type ExecuteActivityContext, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../extensionVariables";
import { createActivityChildContext } from "./activity/activityUtils";
import { localize } from "./localize";

export function logExistingResourceGroup(context: IActionContext & Partial<ExecuteActivityContext>, resourceGroupName: string): void {
    context.activityChildren?.push(new GenericTreeItem(undefined, {
        contextValue: createActivityChildContext(['useExistingResourceGroupInfoItem', activitySuccessContext]),
        label: localize('useResourceGroup', 'Using resource group "{0}"', resourceGroupName),
        iconPath: activityInfoIcon,
    }));
    ext.outputChannel.appendLog(localize('usingResourceGroup', 'Using resource group "{0}".', resourceGroupName));
}

export function logExistingEnvironment(context: IActionContext & Partial<ExecuteActivityContext>, environmentName: string): void {
    context.activityChildren?.push(new GenericTreeItem(undefined, {
        contextValue: createActivityChildContext(['useExistingManagedEnvironmentInfoItem', activitySuccessContext]),
        label: localize('useManagedEnvironment', 'Using container apps environment "{0}"', environmentName),
        iconPath: activityInfoIcon,
    }));
    ext.outputChannel.appendLog(localize('usingManagedEnvironment', 'Using container apps environment "{0}".', environmentName));
}

export function logExistingContainerApp(context: IActionContext & Partial<ExecuteActivityContext>, containerAppName: string): void {
    context.activityChildren?.push(new GenericTreeItem(undefined, {
        contextValue: createActivityChildContext(['useExistingContainerAppInfoItem', activitySuccessContext]),
        label: localize('useContainerApp', 'Using container app "{0}"', containerAppName),
        iconPath: activityInfoIcon,
    }));
    ext.outputChannel.appendLog(localize('usingContainerApp', 'Using container app "{0}".', containerAppName));
}

export function logExistingContainerRegistry(context: IActionContext & Partial<ExecuteActivityContext>, registryName: string): void {
    context.activityChildren?.push(new GenericTreeItem(undefined, {
        contextValue: createActivityChildContext(['useExistingAcrInfoItem', activitySuccessContext]),
        label: localize('useAcr', 'Using container registry "{0}"', registryName),
        iconPath: activityInfoIcon,
    }));
    ext.outputChannel.appendLog(localize('usingAcr', 'Using Azure Container Registry "{0}".', registryName));
}

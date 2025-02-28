/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type Registry } from "@azure/arm-containerregistry";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, type ILocationWizardContext } from "@microsoft/vscode-azext-azureutils";
import { activityInfoIcon, AzureWizardPromptStep, createUniversallyUniqueContextValue, GenericTreeItem, type AzExtTreeItem, type ExecuteActivityContext, type IActionContext } from "@microsoft/vscode-azext-utils";
import { activityInfoContext } from "../constants";
import { ext } from "../extensionVariables";
import { localize } from "../utils/localize";

type StartingResourcesLogContext = IActionContext & Partial<ExecuteActivityContext> & ILocationWizardContext & {
    resourceGroup?: ResourceGroup,
    managedEnvironment?: ManagedEnvironment,
    registry?: Registry;
    containerApp?: ContainerApp
};

/**
 * Use to display primary Azure resource data to the output and activity log
 * i.e. resource group, managed environment, container app, location
 */
export class StartingResourcesLogStep<T extends StartingResourcesLogContext> extends AzureWizardPromptStep<T> {
    public hideStepCount: boolean = true;
    protected hasLogged: boolean = false;

    /**
     * Implement if you require additional context loading before resource logging
     */
    protected configureStartingResources?(context: T): void | Promise<void>;

    public async configureBeforePrompt(context: T): Promise<void> {
        if (this.hasLogged) {
            return;
        }
        await this.configureStartingResources?.(context);
        await this.logStartingResources(context);
    }

    public async prompt(): Promise<void> {
        // Don't prompt, just use to log starting resources
    }

    public shouldPrompt(): boolean {
        return false;
    }

    protected async logStartingResources(context: T): Promise<void> {
        const activityChildren: AzExtTreeItem[] = [];

        // Resource group
        if (context.resourceGroup) {
            context.telemetry.properties.existingResourceGroup = 'true';
            activityChildren.push(
                new GenericTreeItem(undefined, {
                    contextValue: createUniversallyUniqueContextValue(['useExistingResourceGroupInfoItem', activityInfoContext]),
                    label: localize('useResourceGroup', 'Using resource group "{0}"', context.resourceGroup.name),
                    iconPath: activityInfoIcon
                })
            );
            ext.outputChannel.appendLog(localize('usingResourceGroup', 'Using resource group "{0}".', context.resourceGroup.name));
        } else {
            context.telemetry.properties.existingResourceGroup = 'false';
        }

        // Managed environment
        if (context.managedEnvironment) {
            context.telemetry.properties.existingEnvironment = 'true';
            activityChildren.push(
                new GenericTreeItem(undefined, {
                    contextValue: createUniversallyUniqueContextValue(['useExistingManagedEnvironmentInfoItem', activityInfoContext]),
                    label: localize('useManagedEnvironment', 'Using managed environment "{0}"', context.managedEnvironment.name),
                    iconPath: activityInfoIcon
                })
            );
            ext.outputChannel.appendLog(localize('usingManagedEnvironment', 'Using managed environment "{0}".', context.managedEnvironment.name));
        } else {
            context.telemetry.properties.existingEnvironment = 'false';
        }

        // Container registry
        if (context.registry) {
            context.telemetry.properties.existingRegistry = 'true';
            activityChildren.push(
                new GenericTreeItem(undefined, {
                    contextValue: createUniversallyUniqueContextValue(['useExistingAcrInfoItem', activityInfoContext]),
                    label: localize('useAcr', 'Using container registry "{0}"', context.registry.name),
                    iconPath: activityInfoIcon
                })
            );
            ext.outputChannel.appendLog(localize('usingAcr', 'Using Azure Container Registry "{0}".', context.registry.name));
        } else {
            context.telemetry.properties.existingRegistry = 'false';
        }

        // Container app
        if (context.containerApp) {
            context.telemetry.properties.existingContainerApp = 'true';
            activityChildren.push(
                new GenericTreeItem(undefined, {
                    contextValue: createUniversallyUniqueContextValue(['useExistingContainerAppInfoItem', activityInfoContext]),
                    label: localize('useContainerApp', 'Using container app "{0}"', context.containerApp.name),
                    iconPath: activityInfoIcon
                })
            );
            ext.outputChannel.appendLog(localize('usingContainerApp', 'Using container app "{0}".', context.containerApp.name));
        } else {
            context.telemetry.properties.existingContainerApp = 'false';
        }

        // Location
        if (LocationListStep.hasLocation(context)) {
            context.telemetry.properties.existingLocation = 'true';
            const location: string = (await LocationListStep.getLocation(context)).name;
            ext.outputChannel.appendLog(localize('usingLocation', 'Using location: "{0}".', location));
        } else {
            context.telemetry.properties.existingLocation = 'false';
        }

        if (context.activityChildren) {
            // Always put these at the front (top) of the list
            context.activityChildren.unshift(...activityChildren);
        }

        this.hasLogged = true;
    }
}

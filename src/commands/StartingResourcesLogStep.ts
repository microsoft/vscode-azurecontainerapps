/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type Registry } from "@azure/arm-containerregistry";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, type ILocationWizardContext } from "@microsoft/vscode-azext-azureutils";
import { ActivityChildItem, ActivityChildType, activityInfoIcon, AzureWizardPromptStep, createContextValue, prependOrInsertAfterLastInfoChild, type ActivityInfoChild, type ExecuteActivityContext, type IActionContext } from "@microsoft/vscode-azext-utils";
import { activityInfoContext } from "../constants";
import { ext } from "../extensionVariables";
import { localize } from "../utils/localize";

type StartingResourcesLogContext = IActionContext & Partial<ExecuteActivityContext> & ILocationWizardContext & {
    resourceGroup?: ResourceGroup,
    managedEnvironment?: ManagedEnvironment,
    registry?: Registry;
    containerApp?: ContainerApp
};

const startingResourcesContext: string = 'startingResourcesLogStepItem';

/**
 * Use to display primary Azure resource data to the output and activity log
 * i.e. resource group, managed environment, container app, location
 */
export class StartingResourcesLogStep<T extends StartingResourcesLogContext> extends AzureWizardPromptStep<T> {
    public hideStepCount: boolean = true;

    /**
     * Implement if you require additional context loading before resource logging
     */
    protected configureStartingResources?(context: T): void | Promise<void>;

    public async configureBeforePrompt(context: T): Promise<void> {
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
        // Resource group
        if (context.resourceGroup) {
            context.telemetry.properties.existingResourceGroup = 'true';
            prependOrInsertAfterLastInfoChild(context,
                new ActivityChildItem({
                    contextValue: createContextValue([startingResourcesContext, activityInfoContext]),
                    label: localize('useResourceGroup', 'Use resource group "{0}"', context.resourceGroup.name),
                    activityType: ActivityChildType.Info,
                    iconPath: activityInfoIcon,
                    stepId: this.id,
                }) as ActivityInfoChild,
            );
            ext.outputChannel.appendLog(localize('usingResourceGroup', 'Using resource group "{0}".', context.resourceGroup.name));
        }
        context.telemetry.properties.existingResourceGroup = String(!!context.resourceGroup);

        // Managed environment
        if (context.managedEnvironment) {
            context.telemetry.properties.existingEnvironment = 'true';
            prependOrInsertAfterLastInfoChild(context,
                new ActivityChildItem({
                    label: localize('useManagedEnvironment', 'Use managed environment "{0}"', context.managedEnvironment.name),
                    contextValue: createContextValue([startingResourcesContext, activityInfoContext]),
                    activityType: ActivityChildType.Info,
                    iconPath: activityInfoIcon,
                    stepId: this.id,
                }) as ActivityInfoChild,
            );
            ext.outputChannel.appendLog(localize('usingManagedEnvironment', 'Using managed environment "{0}".', context.managedEnvironment.name));
        }
        context.telemetry.properties.existingEnvironment = String(!!context.managedEnvironment);

        // Container registry
        if (context.registry) {
            context.telemetry.properties.existingRegistry = 'true';
            prependOrInsertAfterLastInfoChild(context,
                new ActivityChildItem({
                    label: localize('useAcr', 'Use container registry "{0}"', context.registry.name),
                    contextValue: createContextValue([startingResourcesContext, activityInfoContext]),
                    activityType: ActivityChildType.Info,
                    iconPath: activityInfoIcon,
                    stepId: this.id,
                }) as ActivityInfoChild,
            );
            ext.outputChannel.appendLog(localize('usingAcr', 'Using Azure Container Registry "{0}".', context.registry.name));
        }
        context.telemetry.properties.existingRegistry = String(!!context.registry);

        // Container app
        if (context.containerApp) {
            context.telemetry.properties.existingContainerApp = 'true';
            prependOrInsertAfterLastInfoChild(context,
                new ActivityChildItem({
                    label: localize('useContainerApp', 'Use container app "{0}"', context.containerApp.name),
                    contextValue: createContextValue([startingResourcesContext, activityInfoContext]),
                    activityType: ActivityChildType.Info,
                    iconPath: activityInfoIcon,
                    stepId: this.id,
                }) as ActivityInfoChild,
            );
            ext.outputChannel.appendLog(localize('usingContainerApp', 'Using container app "{0}".', context.containerApp.name));
        }
        context.telemetry.properties.existingContainerApp = String(!!context.containerApp);

        // Location
        if (LocationListStep.hasLocation(context)) {
            context.telemetry.properties.existingLocation = 'true';
            const location: string = (await LocationListStep.getLocation(context)).name;
            ext.outputChannel.appendLog(localize('usingLocation', 'Using location: "{0}".', location));
        }
        context.telemetry.properties.existingLocation = String(!!LocationListStep.hasLocation(context));
    }
}

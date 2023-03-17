/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { EnvironmentVar, RegistryCredentials, Secret } from "@azure/arm-appcontainers";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ImageSourceValues } from "../../constants";
import { ContainerAppModel } from "../../tree/ContainerAppItem";

export interface IDeployBaseContext extends ISubscriptionActionContext {
    subscription: AzureSubscription;
    targetContainer?: ContainerAppModel;

    imageSource?: ImageSourceValues;
    buildType?: string;

    // Base image attributes used as a precursor for either creating or updating a container app
    image?: string;
    environmentVariables?: EnvironmentVar[];
    registries?: RegistryCredentials[];
    secrets?: Secret[];
}

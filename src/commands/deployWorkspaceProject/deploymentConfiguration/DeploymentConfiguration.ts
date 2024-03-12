/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type Registry } from "@azure/arm-containerregistry";
import { type ResourceGroup } from "@azure/arm-resources";
import { type WorkspaceFolder } from "vscode";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";

export interface DeploymentConfiguration {
    rootFolder?: WorkspaceFolder;
    dockerfilePath?: string;
    srcPath?: string;
    envPath?: string;
    resourceGroup?: ResourceGroup;
    managedEnvironment?: ManagedEnvironment;
    containerApp?: ContainerAppModel;
    containerRegistry?: Registry;
}

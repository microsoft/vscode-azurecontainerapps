/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type KnownSkuName, type Registry } from "@azure/arm-containerregistry";
import { type IResourceGroupWizardContext } from "@microsoft/vscode-azext-azureutils";
import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";

export interface CreateAcrContext extends IResourceGroupWizardContext, ExecuteActivityContext {
    newRegistryName?: string;
    newRegistrySku?: KnownSkuName;
    registry?: Registry;
}

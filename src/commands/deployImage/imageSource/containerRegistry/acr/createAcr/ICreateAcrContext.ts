/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName, Registry } from "@azure/arm-containerregistry";
import { IResourceGroupWizardContext } from "@microsoft/vscode-azext-azureutils";
import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";

export interface ICreateAcrContext extends IResourceGroupWizardContext, ExecuteActivityContext {
    newRegistryName?: string;
    sku?: KnownSkuName;
    registry?: Registry;
}

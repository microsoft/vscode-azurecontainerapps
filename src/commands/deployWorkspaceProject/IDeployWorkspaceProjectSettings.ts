/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export interface IDeployWorkspaceProjectSettings {
    // Container app names are unique to a resource group
    containerAppResourceGroupName: string;
    containerAppName: string;

    // Either unique globally or to a subscription
    acrName: string;
}

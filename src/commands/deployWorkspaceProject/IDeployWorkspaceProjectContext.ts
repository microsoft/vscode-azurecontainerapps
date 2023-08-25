/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { ICreateContainerAppContext } from "../createContainerApp/ICreateContainerAppContext";
import { IManagedEnvironmentContext } from "../createManagedEnvironment/IManagedEnvironmentContext";
import { IBuildImageInAzureContext } from "../deployImage/imageSource/buildImageInAzure/IBuildImageInAzureContext";
import { CreateAcrContext } from "../deployImage/imageSource/containerRegistry/acr/createAcr/CreateAcrContext";

// Purposefully using intersection typing instead of an interface here to bypass some minor (relatively trivial) type mismatch issues introduced by using the 'Partial' utility
export type IDeployWorkspaceProjectContext = IManagedEnvironmentContext & ICreateContainerAppContext & CreateAcrContext & Partial<IBuildImageInAzureContext> & ExecuteActivityContext & {
    shouldSaveWorkspaceSettings?: boolean;
};

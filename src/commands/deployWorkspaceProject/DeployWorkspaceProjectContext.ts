/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { ICreateContainerAppContext } from "../createContainerApp/ICreateContainerAppContext";
import type { IManagedEnvironmentContext } from "../createManagedEnvironment/IManagedEnvironmentContext";
import type { IBuildImageInAzureContext } from "../deployImage/imageSource/buildImageInAzure/IBuildImageInAzureContext";
import type { CreateAcrContext } from "../deployImage/imageSource/containerRegistry/acr/createAcr/CreateAcrContext";

// Use intersection typing instead of an interface here to bypass some minor (relatively trivial) type mismatch issues introduced by having to use the 'Partial' utility
export type DeployWorkspaceProjectContext = IManagedEnvironmentContext & ICreateContainerAppContext & CreateAcrContext & Partial<IBuildImageInAzureContext> & ExecuteActivityContext & {
    shouldSaveDeploySettings?: boolean;
};

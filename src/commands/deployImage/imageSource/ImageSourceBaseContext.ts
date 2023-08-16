/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { EnvironmentVar, RegistryCredentials, Secret } from "@azure/arm-appcontainers";
import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import type { ImageSource, ImageSourceValues } from "../../../constants";
import type { IContainerAppContext } from "../../IContainerAppContext";

export interface ImageSourceBaseContext extends IContainerAppContext, ExecuteActivityContext {
    // ImageSourceListStep
    imageSource?: ImageSourceValues;
    buildType?: ImageSource.LocalDockerBuild | ImageSource.RemoteAcrBuild;
    showQuickStartImage?: boolean;

    // Base image attributes used as a precursor for either creating or updating a container app
    image?: string;
    registries?: RegistryCredentials[];
    secrets?: Secret[];

    environmentVariables?: EnvironmentVar[];
}

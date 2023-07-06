/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { EnvironmentVar, RegistryCredentials, Secret } from "@azure/arm-appcontainers";
import type { ImageSource, ImageSourceValues } from "../../../constants";
import type { IContainerAppContext } from "../../IContainerAppContext";

export interface ImageSourceBaseContext extends IContainerAppContext {
    // ImageSourceListStep
    imageSource?: ImageSourceValues;
    buildType?: ImageSource.LocalDockerBuild | ImageSource.RemoteAcrBuild;
    showQuickStartImage?: boolean;

    // Base image attributes used as a precursor for either creating or updating a container app
    image?: string;
    environmentVariables?: EnvironmentVar[];
    registries?: RegistryCredentials[];
    secrets?: Secret[];
}

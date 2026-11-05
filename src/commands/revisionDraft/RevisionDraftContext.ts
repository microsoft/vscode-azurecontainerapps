/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IContainerAppContext } from "../IContainerAppContext";
import { type RegistryConfiguration } from "../registryCredentials/mergeRegistryConfiguration";

export interface RevisionDraftContext extends IContainerAppContext {
    isDraftCommand?: boolean;
    shouldDeployRevisionDraft?: boolean;
    registryConfiguration?: RegistryConfiguration;
}

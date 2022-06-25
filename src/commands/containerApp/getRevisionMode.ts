/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RevisionConstants } from "../../constants";
import { ContainerAppResource } from "../../resolver/ContainerAppResource";

export function getRevisionMode(ca: ContainerAppResource): string {
    return ca.data.configuration?.activeRevisionsMode?.toLowerCase() === 'single' ?
        RevisionConstants.single.data : RevisionConstants.multiple.data;
}

export function ingressEnabled(ca: ContainerAppResource): boolean {
    return !!ca.data.configuration?.ingress;
}

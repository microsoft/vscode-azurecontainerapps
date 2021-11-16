/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from "./utils/localize";

export const webProvider: string = 'Microsoft.Web';
export const containerAppProvider: string = `${webProvider}/containerApps`;

export namespace IngressConstants {
    export const external: string = localize('external', 'External');
    export const internal: string = localize('internal', 'Internal');
    export const externalDesc: string = localize('externalDesc', 'Accepting traffic from anywhere');
    export const internalDesc: string = localize('internalDesc', 'Only allowing traffic within your vNet');
}

export namespace RevisionConstants {
    export const multiple: string = localize('multiple', 'Multiple');
    export const single: string = localize('single', 'Single');
}

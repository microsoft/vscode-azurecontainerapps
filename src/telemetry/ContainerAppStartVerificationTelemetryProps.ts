/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export interface ContainerAppStartVerificationTelemetryProps {
    /**
     * Indicates the result of attempting to add logs during container app start verification.
     *
     * 1. `undefined` — Did not attempt to add logs.
     * 2. `false`     — Attempted to add logs but failed.
     * 3. `true`      — Successfully added logs.
     */
    addedContainerAppStartLogs?: 'true' | 'false';
    getLogsQueryError?: string;
    targetCloud?: string;
}

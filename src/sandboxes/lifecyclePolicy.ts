/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type LifecyclePolicy } from '@azure/containerapps-sandbox';

export interface AutoSuspendUpdate {
    enabled: boolean;
    interval?: number;
}

/** Applies an auto-suspend update without resetting unrelated lifecycle settings. */
export function updateAutoSuspendPolicy(current: LifecyclePolicy | undefined, update: AutoSuspendUpdate): LifecyclePolicy {
    const currentAutoSuspend = current?.autoSuspend;
    return {
        ...current,
        autoSuspend: update.enabled ? {
            ...currentAutoSuspend,
            enabled: true,
            interval: update.interval ?? currentAutoSuspend?.interval,
            mode: currentAutoSuspend?.mode ?? 'Memory',
        } : {
            ...currentAutoSuspend,
            enabled: false,
        },
    };
}

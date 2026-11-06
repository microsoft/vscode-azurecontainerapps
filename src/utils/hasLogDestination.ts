/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type AppLogsConfiguration } from '@azure/arm-appcontainers';

export function hasLogDestination(configuration: AppLogsConfiguration | undefined): boolean {
    return configuration?.destination !== 'none'
        && (!!configuration?.destination || !!configuration?.logAnalyticsConfiguration);
}

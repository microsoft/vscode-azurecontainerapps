/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function getContainerNameForImage(containerImageName: string): string {
    return containerImageName.substring(containerImageName.lastIndexOf('/') + 1).replace(/[^0-9a-zA-Z-]/g, '-');
}

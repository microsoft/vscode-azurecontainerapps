/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export interface IngressTelemetryProps {
    dockerfileExposePortRangeCount?: string;  // IngressPromptStep
    enableIngress?: 'true' | 'false'; //IngressPromptStep
    enableExternal?: 'true' | 'false'; // IngressPromptStep
    suggestedTargetPort?: string; //getDefaultPort
    targetPort?: string; //TargetPortInputStep
}

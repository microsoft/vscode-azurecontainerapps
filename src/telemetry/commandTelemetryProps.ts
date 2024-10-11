/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { type AzdTelemetryProps } from "./AzdTelemetryProps";
import { type ImageSourceTelemetryProps } from "./ImageSourceTelemetryProps";
import { type IngressTelemetryProps } from "./IngressTelemetryProps";
import { type OverwriteConfirmTelemetryProps } from "./OverwriteConfirmTelemetryProps";

export interface DeployImageApiTelemetryProps extends ImageSourceTelemetryProps, OverwriteConfirmTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
}

export interface DeployRevisionDraftTelemetryProps extends AzdTelemetryProps, OverwriteConfirmTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
    commandUpdatesCount?: string;  // Updates via revision draft commands
    directUpdatesCount?: string;  // Direct updates via 'editContainerApp' & 'editDraft'
}

export interface ContainerUpdateTelemetryProps extends AzdTelemetryProps, ImageSourceTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
    skippedRegistryCredentialUpdate?: 'true' | 'false';
}

export type CreateContainerAppTelemetryProps = ImageSourceTelemetryProps & AzdTelemetryProps & IngressTelemetryProps;

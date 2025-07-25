/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { type AzdTelemetryProps } from "./AzdTelemetryProps";
import { type ContainerAppStartVerificationTelemetryProps } from "./ContainerAppStartVerificationTelemetryProps";
import { type ContainerTelemetryProps } from "./ContainerTelemetryProps";
import { type ImageSourceTelemetryProps } from "./ImageSourceTelemetryProps";
import { type IngressTelemetryProps } from "./IngressTelemetryProps";
import { type OverwriteConfirmTelemetryProps } from "./OverwriteConfirmTelemetryProps";

export interface DeployImageApiTelemetryProps extends AzdTelemetryProps, ContainerTelemetryProps, ImageSourceTelemetryProps, OverwriteConfirmTelemetryProps, ContainerAppStartVerificationTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
}

export type DeployContainerAppTelemetryProps = AzdTelemetryProps & ImageSourceTelemetryProps & OverwriteConfirmTelemetryProps;

export interface DeployRevisionDraftTelemetryProps extends AzdTelemetryProps, OverwriteConfirmTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
    commandUpdatesCount?: string;  // Updates via revision draft commands
    directUpdatesCount?: string;  // Direct updates via 'editContainerApp' & 'editDraft'
}

export interface ContainerEditTelemetryProps extends AzdTelemetryProps, ContainerTelemetryProps, ImageSourceTelemetryProps, ContainerAppStartVerificationTelemetryProps {
    revisionMode?: KnownActiveRevisionsMode;
    skippedRegistryCredentialUpdate?: 'true' | 'false';
}

export type CreateContainerAppTelemetryProps = AzdTelemetryProps & ImageSourceTelemetryProps & IngressTelemetryProps;

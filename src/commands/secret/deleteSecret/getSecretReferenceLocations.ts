/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type Revision, type Template } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";

export interface SecretReferenceLocationOptions {
    includeCurrentTemplate?: boolean;
    activeRevisions?: Revision[];
}

export function getSecretReferenceLocations(secretName: string, containerAppEnvelope: ContainerApp, options: SecretReferenceLocationOptions = {}): string[] {
    const includeCurrentTemplate: boolean = options.includeCurrentTemplate ?? true;
    const activeRevisions: Revision[] = options.activeRevisions ?? [];
    const references: string[] = [];

    if (includeCurrentTemplate) {
        references.push(...collectTemplateReferences(secretName, containerAppEnvelope.template, 'current template'));
    }

    references.push(...collectRegistryReferences(secretName, containerAppEnvelope));

    for (const revision of activeRevisions.filter((rev) => rev.active)) {
        const revisionName = nonNullProp(revision, 'name');
        references.push(...collectTemplateReferences(secretName, revision.template, `revision "${revisionName}"`));
    }

    return references;
}

function collectTemplateReferences(secretName: string, template: Template | undefined, source: string): string[] {
    const references: string[] = [];

    for (const rule of template?.scale?.rules ?? []) {
        const ruleName: string = rule.name ?? 'unnamed';
        for (const auth of rule.azureQueue?.auth ?? []) {
            if (auth.secretRef === secretName) {
                references.push(`${source} Azure Queue scale rule "${ruleName}"`);
            }
        }
    }

    for (const container of template?.containers ?? []) {
        const containerName: string = container.name ?? 'unnamed';
        for (const env of container.env ?? []) {
            if (env.secretRef === secretName) {
                references.push(`${source} container "${containerName}" env "${env.name ?? 'unnamed'}"`);
            }
        }
    }

    return references;
}

function collectRegistryReferences(secretName: string, containerAppEnvelope: ContainerApp): string[] {
    return (containerAppEnvelope.configuration?.registries ?? [])
        .filter((registry) => registry.passwordSecretRef === secretName)
        .map((registry) => `registry "${registry.server ?? 'unknown'}" password secret`);
}

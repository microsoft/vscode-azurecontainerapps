/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ResourceModelBase } from '@microsoft/vscode-azureresources-api';
import { revisionModeMultipleContextValue, revisionRestartUnsupportedContextValue } from '../../constants';
import { ManagedEnvironmentItem } from '../../tree/ManagedEnvironmentItem';
import { localize } from '../../utils/localize';
import { type ContainerAppPickItemOptions } from '../../utils/pickItem/PickItemOptions';
import { type RevisionOperation } from './changeRevisionActiveState';

export function getRevisionCommandPickOptions(operation: RevisionOperation | 'editRevisionDraft'): ContainerAppPickItemOptions {
    const requiresMultipleRevisions = operation !== 'restartRevision';
    return {
        environmentOptions: {
            filter: (_treeItem, element) => {
                const environment: unknown = (element as { branchItem?: ResourceModelBase })?.branchItem ?? element;
                return !ManagedEnvironmentItem.isManagedEnvironmentItem(environment) || !environment.isExpress;
            },
            noPicksMessage: localize('noStandardContainerAppsEnvironment', 'Current subscription has no Standard container apps environments'),
        },
        filter: treeItem => {
            const values = treeItem.contextValue?.split(';') ?? [];
            return !values.includes(revisionRestartUnsupportedContextValue)
                && (!requiresMultipleRevisions || values.includes(revisionModeMultipleContextValue));
        },
        noPicksMessage: requiresMultipleRevisions
            ? localize('noMultipleRevisionContainerApps', 'Selected container apps environment has no Standard apps in multiple revisions mode')
            : localize('noStandardContainerApps', 'Selected container apps environment has no Standard apps'),
    };
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type PickFilter } from '@microsoft/vscode-azext-utils';

export interface RevisionDraftPickItemOptions extends PickItemOptions {
    // Automatically select the RevisionDraftItem if one exists
    autoSelectDraft?: boolean;
}

export interface RevisionPickItemOptions extends PickItemOptions {
    // Automatically select a RevisionItem without re-prompting the user
    selectByRevisionName?: string;
}

export interface ContainerAppPickItemOptions extends PickItemOptions {
    environmentOptions?: PickStepFilterOptions;
    containerAppOptions?: PickStepFilterOptions;
}

export interface FilteredPickItemOptions extends PickItemOptions, PickStepFilterOptions {
}

export interface PickStepFilterOptions {
    filter?: PickFilter['isFinalPick'];
    noPicksMessage?: string;
}

export interface PickItemOptions {
    title?: string;
    showLoadingPrompt?: boolean;
}

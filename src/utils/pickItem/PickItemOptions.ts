/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export interface RevisionDraftPickItemOptions extends PickItemOptions {
    // Automatically select the RevisionDraftItem if one exists
    autoSelectDraft?: boolean;
}

export interface RevisionPickItemOptions extends PickItemOptions {
    // Automatically select a RevisionItem without re-prompting the user
    selectByRevisionName?: string;
}

export interface PickItemOptions {
    title?: string;
    showLoadingPrompt?: boolean;
}

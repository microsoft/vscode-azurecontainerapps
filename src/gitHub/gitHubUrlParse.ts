/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

interface ParsedGitHubUrl {
    gitHubUrlReference?: string;
    ownerOrOrganization?: string;
    repositoryName?: string;
}

export function gitHubUrlParse(url?: string): ParsedGitHubUrl {
    if (!url) {
        return {};
    }

    const match: RegExpMatchArray | null = url.match(/github\.com\/(?<ownerOrOrganization>[^/]+)\/(?<repositoryName>[^/]+)/i);
    return {
        gitHubUrlReference: url,
        ownerOrOrganization: match?.groups?.ownerOrOrganization,
        repositoryName: match?.groups?.repositoryName
    };
}

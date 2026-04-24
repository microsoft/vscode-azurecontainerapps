/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IconRequest } from './types';
import { type PlanData, type TreeNode } from '../parsePlanMarkdown';

/** Walk every `tree` content block in a PlanData and emit icon requests for each node (and default open state for folders). */
export function collectIconRequests(plan: PlanData): IconRequest[] {
    const seen = new Set<string>();
    const requests: IconRequest[] = [];

    const add = (name: string, isFolder: boolean, isOpen: boolean) => {
        const key = `${isFolder ? 'F' : 'f'}:${isOpen ? '1' : '0'}:${name.toLowerCase()}`;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        requests.push({ name, isFolder, isOpen });
    };

    const walk = (nodes: TreeNode[]) => {
        for (const node of nodes) {
            if (node.isFolder) {
                // Request both expanded and collapsed forms so the webview can swap without a round-trip.
                add(node.name, true, true);
                add(node.name, true, false);
            } else {
                add(node.name, false, false);
            }
            if (node.children.length > 0) {
                walk(node.children);
            }
        }
    };

    for (const section of plan.sections) {
        for (const content of section.content) {
            if (content.type === 'tree') {
                add(content.root, true, true);
                add(content.root, true, false);
                walk(content.nodes);
            }
        }
    }

    return requests;
}

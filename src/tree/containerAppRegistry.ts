/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ext } from '../extensionVariables';
import { CONTAINER_APP_NAMESPACE_ENV, CONTAINER_APP_NAMESPACE_FLAT, type ContainerAppNamespace } from './containerAppNamespace';

/**
 * Fans out state-manager calls and `onDidChangeTreeData` refreshes across every branch
 * data provider that renders the container-app subtree (today: the managed-environment
 * tree and the standalone "Container Apps" / Resource Group tree).
 *
 * Command sites should call into this registry instead of `ext.state.*` directly for any
 * id that targets a node inside the container-app subtree. The registry knows which id
 * namespaces are in use (one per branch data provider) and applies each call to every
 * namespaced copy so the trees stay in sync without command sites needing to know they
 * exist.
 *
 * Calls that target ids OUTSIDE the container-app subtree (e.g., a managed environment
 * node, which only exists in one tree) should keep going through `ext.state.*` directly.
 */
class ContainerAppRegistry {
    /**
     * All namespaces under which container-app subtree items are rendered. Order is not
     * significant for `notifyChildrenChanged`, but it determines the nesting order of
     * the transient-state helpers (innermost callback runs once, outermost wrapping is
     * applied first).
     */
    private readonly namespaces: ContainerAppNamespace[] = [
        CONTAINER_APP_NAMESPACE_ENV,
        CONTAINER_APP_NAMESPACE_FLAT,
    ];

    /**
     * Fires the tree's "this subtree changed" signal for every registered namespace.
     *
     * @param canonicalId The bare ARM-style id (no namespace prefix) of the subtree
     *   root that changed — typically `containerApp.id`, but also accepts derived ids
     *   like `RevisionsItem.getRevisionsItemId(containerApp.id)`. The registry prepends
     *   each namespace before invoking the state manager.
     */
    notifyChildrenChanged(canonicalId: string): void {
        for (const ns of this.namespaces) {
            ext.state.notifyChildrenChanged(`${ns}${canonicalId}`);
        }
    }

    /**
     * Temporarily shows a description on the tree-item with `canonicalId` in *every*
     * registered namespace while `callback` runs. The callback runs exactly once,
     * inside the innermost wrapping.
     */
    async runWithTemporaryDescription<T>(canonicalId: string, description: string, callback: () => Promise<T>): Promise<T> {
        return this.wrapNested(callback, (inner, ns) => () =>
            ext.state.runWithTemporaryDescription(`${ns}${canonicalId}`, description, inner));
    }

    /**
     * Shows a "deleting" state on the tree-item with `canonicalId` in every registered
     * namespace while `callback` runs.
     */
    async showDeleting(canonicalId: string, callback: () => Promise<void>): Promise<void> {
        await this.wrapNested(callback, (inner, ns) => () =>
            ext.state.showDeleting(`${ns}${canonicalId}`, inner));
    }

    /**
     * Shows a transient "creating child" placeholder under `canonicalId` in every
     * registered namespace while `callback` runs.
     */
    async showCreatingChild<T>(canonicalId: string, label: string, callback: () => Promise<T>): Promise<T> {
        return this.wrapNested(callback, (inner, ns) => () =>
            ext.state.showCreatingChild(`${ns}${canonicalId}`, label, inner));
    }

    private async wrapNested<T>(
        callback: () => Promise<T>,
        wrap: (inner: () => Promise<T>, ns: ContainerAppNamespace) => () => Promise<T>,
    ): Promise<T> {
        // Nest each namespace's state-manager helper around the previous, so the
        // innermost (which actually invokes the user's callback) runs exactly once
        // and every namespace's transient UX is active for its full duration.
        let current = callback;
        for (const ns of this.namespaces) {
            current = wrap(current, ns);
        }
        return current();
    }
}

/**
 * Single process-wide registry. Stashed on `ext.containerAppRegistry` from `extension.ts`
 * for the standard "import { ext }" access pattern.
 */
export const containerAppRegistry = new ContainerAppRegistry();

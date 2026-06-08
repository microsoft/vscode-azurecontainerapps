/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

/**
 * Prefix applied to a container-app subtree's tree-element ids so the same logical app
 * can appear under multiple branch data providers (e.g. under its managed environment
 * and under the standalone Container Apps / Resource Group groupings) without colliding
 * on VS Code's globally-unique element-id requirement.
 *
 * The empty string is reserved for the env-rooted tree -- because its ids are bare ARM
 * resource ids, `revealAzureResource(armId)` walks the tree there (the host matches by
 * `startsWith(armId)`).
 *
 * The prefix is *only* used in tree-item ids. Model fields like `containerApp.id`,
 * `containerApp.managedEnvironmentId`, and `revision.id` keep their bare ARM values.
 */
export type ContainerAppNamespace = string;

/** Bare ARM ids; this is the reveal-target tree. */
export const CONTAINER_APP_NAMESPACE_ENV: ContainerAppNamespace = '';

/**
 * Standalone "Container Apps" group and Resource Group grouping share the same branch
 * data provider; both render under this namespace.
 */
export const CONTAINER_APP_NAMESPACE_FLAT: ContainerAppNamespace = '#flat';

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { SecretItem } from "../../tree/configurations/secrets/SecretItem";
import { SecretsItem } from "../../tree/configurations/secrets/SecretsItem";

export async function toggleSecretVisibility(_context: IActionContext, node: SecretItem): Promise<void> {
    node.toggleSecretVisibility();

    const secretsId: string = `${node.containerApp.id}/${SecretsItem.idSuffix}/${node.secret.name}`;
    ext.state.notifyChildrenChanged(secretsId);
}

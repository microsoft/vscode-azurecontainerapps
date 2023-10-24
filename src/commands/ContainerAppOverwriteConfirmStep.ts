/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import type { MessageItem } from "vscode";
import type { ContainerAppModel } from "../tree/ContainerAppItem";
import { localize } from "../utils/localize";
import type { IContainerAppContext } from "./IContainerAppContext";
import { UnsupportedContainerAppFeaturesStepBase } from "./UnsupportedContainerAppFeaturesStepBase";

export class ContainerAppOverwriteConfirmStep<T extends IContainerAppContext> extends UnsupportedContainerAppFeaturesStepBase<T> {
    public hideStepCount: boolean = true;

    public async prompt(context: T): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        let warning: string = localize('confirmDeploy', 'The latest deployment of container app "{0}" will be overwritten.', containerApp.name);
        if (this.hasUnsupportedFeatures(context)) {
            warning += '\n\n' + this.unsupportedFeaturesWarning;
        }

        const items: MessageItem[] = [{ title: localize('continue', 'Continue') }];
        await context.ui.showWarningMessage(warning, { modal: true, stepName: 'confirmDestructiveDeployment' }, ...items);
    }

    public shouldPrompt(context: T): boolean {
        return !!context.containerApp;
    }
}

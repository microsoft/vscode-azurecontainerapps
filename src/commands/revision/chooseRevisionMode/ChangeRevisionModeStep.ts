/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import type { ContainerAppModel } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../../utils/updateContainerApp";
import type { IChooseRevisionModeContext } from "./IChooseRevisionModeContext";

export class ChangeRevisionModeStep extends AzureWizardExecuteStep<IChooseRevisionModeContext> {
    public priority: number = 200;

    public async execute(context: IChooseRevisionModeContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        context.activityTitle = localize('changeRevisionTitle', 'Change container app "{0}" to {1} revisions mode.', containerApp.name, context.newRevisionMode?.toLowerCase());

        const changing: string = localize('changingRevision', 'Changing mode...');
        progress.report({ message: changing });

        await updateContainerApp(context, context.subscription, containerApp, { configuration: { activeRevisionsMode: context.newRevisionMode } });

        const changed: string = localize('changedRevision', 'Changed container app "{0}" to {1} revisions mode.', containerApp.name, context.newRevisionMode?.toLowerCase());
        ext.outputChannel.appendLog(changed);

        ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
    }

    public shouldExecute(context: IChooseRevisionModeContext): boolean {
        return !!context.newRevisionMode;
    }
}

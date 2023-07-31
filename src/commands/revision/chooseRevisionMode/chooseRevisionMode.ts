/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, createSubscriptionContext, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem } from "../../../tree/ContainerAppItem";
import type { RevisionsItem } from "../../../tree/revisionManagement/RevisionsItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { ChangeRevisionModeStep } from "./ChangeRevisionModeStep";
import { ChooseRevisionModeConfirmStep } from "./ChooseRevisionModeConfirmStep";
import { ChooseRevisionModeStep } from "./ChooseRevisionModeStep";
import type { IChooseRevisionModeContext } from "./IChooseRevisionModeContext";

export async function chooseRevisionMode(context: IActionContext, item?: ContainerAppItem | RevisionsItem): Promise<void> {
    item ??= await pickContainerApp(context);

    let hasRevisionDraft: boolean | undefined;
    if (item instanceof ContainerAppItem) {
        // A revision draft can exist but may be identical to the source, distinguishing the difference in single revisions mode
        // improves the user experience by allowing us to skip the confirm step, silently discarding drafts instead
        hasRevisionDraft = item.hasUnsavedChanges();
    } else {
        hasRevisionDraft = ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(item);
    }

    const wizardContext: IChooseRevisionModeContext = {
        ...context,
        ...createSubscriptionContext(item.subscription),
        ...(await createActivityContext()),
        containerApp: item.containerApp,
        subscription: item.subscription,
        hasRevisionDraft
    };

    const promptSteps: AzureWizardPromptStep<IChooseRevisionModeContext>[] = [
        new ChooseRevisionModeStep(),
        new ChooseRevisionModeConfirmStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<IChooseRevisionModeContext>[] = [
        new ChangeRevisionModeStep()
    ];

    const wizard: AzureWizard<IChooseRevisionModeContext> = new AzureWizard(wizardContext, {
        title: localize('changeRevisionModeTitle', 'Change container app revision mode.'),
        promptSteps,
        executeSteps
    });

    await wizard.prompt();

    // Only update it if it's actually different
    if (wizardContext.containerApp?.revisionsMode !== wizardContext.newRevisionMode) {
        await wizard.execute();

        // Discard any active revision drafts
        ext.revisionDraftFileSystem.discardRevisionDraft(item);
    }
}

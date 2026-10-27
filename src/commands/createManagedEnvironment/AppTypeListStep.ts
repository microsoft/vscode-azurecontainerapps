/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, openUrl, type ConfirmationViewProperty } from "@microsoft/vscode-azext-utils";
import { EnvironmentAppType } from "../../constants";
import { localize } from "../../utils/localize";
import { updateLoadingViewProgress } from "../../webviews/SharedViewState";
import { type ManagedEnvironmentCreateContext } from "./ManagedEnvironmentCreateContext";

export class AppTypeListStep<T extends ManagedEnvironmentCreateContext> extends AzureWizardPromptStep<T> {
    public async prompt(context: T): Promise<void> {
        const expressInfo: string = localize('expressInfo', '$(link-external) Learn more about express apps');
        const picks: IAzureQuickPickItem<EnvironmentAppType | undefined>[] = [
            {
                label: 'Express',
                detail: localize('expressDetails', 'Quick setup with platform-managed scaling defaults.'),
                data: EnvironmentAppType.Express,
            },
            {
                label: 'Standard',
                detail: localize('standardDetails', 'Full control over environment settings and features.'),
                data: EnvironmentAppType.Standard,
            },
            {
                label: expressInfo,
                data: undefined,
            }
        ];

        // Todo: Get the real aka.ms link
        const learnMoreLink: string = 'https://aka.ms/Cfqnrc';
        let pick: EnvironmentAppType | undefined;

        while (!pick) {
            pick = (await context.ui.showQuickPick(picks, {
                placeHolder: localize('selectAppType', 'Select an app type'),
                suppressPersistence: true,
                learnMoreLink,
            })).data;

            if (!pick) {
                await openUrl(learnMoreLink);
            }
        };

        context.newManagedEnvironmentAppType = pick;
        context.telemetry.properties.appType = pick;

        updateLoadingViewProgress(localize('selectedAppType', 'Selected app type'));
    }

    public shouldPrompt(context: T): boolean {
        return !context.newManagedEnvironmentAppType;
    }

    // Todo:
    public confirmationViewProperty(context: T): ConfirmationViewProperty {
        return {
            name: localize('environmentAppType', 'Environment App Type'),
            value: context.managedEnvironment?.name ?? context.newManagedEnvironmentName ?? '',
            contextPropertyName: 'environmentAppType',
        };
    }
}

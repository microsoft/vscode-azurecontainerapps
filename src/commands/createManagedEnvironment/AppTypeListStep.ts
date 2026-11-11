/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, openUrl, type ConfirmationViewProperty } from "@microsoft/vscode-azext-utils";
import { EnvironmentAppType } from "../../constants";
import { localize } from "../../utils/localize";
import { updateLoadingViewProgress } from "../../webviews/SharedViewState";
import { type ManagedEnvironmentCreateContext } from "./ManagedEnvironmentCreateContext";

const appTypeLabels: Record<EnvironmentAppType, string> = {
    [EnvironmentAppType.Express]: 'Express',
    [EnvironmentAppType.Standard]: 'Standard',
};

const environmentModeAppTypes = new Map<string, EnvironmentAppType>([
    ['Express', EnvironmentAppType.Express],
    ['WorkloadProfiles', EnvironmentAppType.Standard],
]);

export class AppTypeListStep<T extends ManagedEnvironmentCreateContext> extends AzureWizardPromptStep<T> {
    public async prompt(context: T): Promise<void> {
        const expressInfo: string = localize('expressInfo', '$(link-external) Learn more about express apps');
        const picks: IAzureQuickPickItem<EnvironmentAppType | undefined>[] = [
            {
                label: appTypeLabels[EnvironmentAppType.Express],
                detail: localize('expressDetails', 'Quick setup with platform-managed scaling defaults.'),
                data: EnvironmentAppType.Express,
            },
            {
                label: appTypeLabels[EnvironmentAppType.Standard],
                detail: localize('standardDetails', 'Full control over environment settings and features.'),
                data: EnvironmentAppType.Standard,
            },
            {
                label: expressInfo,
                data: undefined,
            }
        ];

        const learnMoreLink: string = 'https://aka.ms/aca-express-overview';
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

    public confirmationViewProperty(context: T): ConfirmationViewProperty {
        const appType = environmentModeAppTypes.get(context.managedEnvironment?.environmentMode ?? '') ?? context.newManagedEnvironmentAppType;
        return {
            name: localize('environmentAppType', 'Environment App Type'),
            value: appType ? appTypeLabels[appType] : '',
            contextPropertyName: 'newManagedEnvironmentAppType',
        };
    }
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, GoBackError, openUrl, UserCancelledError, type ConfirmationViewProperty, type IActionContext } from "@microsoft/vscode-azext-utils";
import * as vscode from 'vscode';
import { localize } from "../utils/localize";
import { ConfirmationViewController } from "./ConfirmationViewController";

export const SharedState = {
    itemsToClear: 0,
    cancelled: true,
    copilotClicked: false,
    editingPicks: false,
};

export class OpenConfirmationViewStep<T extends IActionContext> extends AzureWizardPromptStep<T> {
    private readonly viewConfig: () => ConfirmationViewProperty[];
    private readonly title: string;
    private readonly tabTitle: string;
    private readonly description: string;
    private readonly commandName: string;

    public constructor(title: string, tabTitle: string, description: string, commandName: string, viewConfig: () => ConfirmationViewProperty[]) {
        super();
        this.title = title;
        this.tabTitle = tabTitle
        this.description = description;
        this.viewConfig = viewConfig;
        this.commandName = commandName;
    }

    public async prompt(context: T): Promise<void> {
        const confirmationView = new ConfirmationViewController({
            title: this.title,
            tabTitle: this.tabTitle,
            description: this.description,
            commandName: this.commandName,
            items: this.viewConfig()
        });

        confirmationView.revealToForeground(vscode.ViewColumn.Active);

        await new Promise<void>((resolve, reject) => {
            confirmationView.onDisposed(async () => {
                try {
                    if (SharedState.itemsToClear > 0) {
                        context.telemetry.properties.editingPicks = 'true';
                        SharedState.editingPicks = true;
                        throw new GoBackError(SharedState.itemsToClear);
                    }

                    if (SharedState.cancelled) {
                        throw new UserCancelledError('openConfirmationViewStep');
                    }
                } catch (error) {
                    reject(error);
                } finally {
                    const greatButton: vscode.MessageItem = {
                        title: 'Great',
                    }
                    const notHelpfulButton: vscode.MessageItem = {
                        title: 'Unhelpful'
                    }
                    const surveyButton: vscode.MessageItem = {
                        title: localize('provideFeedback', 'Provide Feedback'),

                    }
                    const buttons = [greatButton, notHelpfulButton, surveyButton];

                    if (SharedState.editingPicks && SharedState.itemsToClear === 0 && SharedState.copilotClicked) {
                        resolve();
                        const message = localize('editingPicksMessage', 'How was your experience using copilot and revising your selections?');
                        const result = await vscode.window.showInformationMessage(message, ...buttons);
                        await confirmationViewButtonActions(context, result);
                    } else if (!SharedState.cancelled && !SharedState.copilotClicked && !SharedState.editingPicks) {
                        resolve();
                        const message = localize('confirmPMessage', 'How was your experience using the summary view?');
                        const result = await vscode.window.showInformationMessage(message, ...buttons);
                        await confirmationViewButtonActions(context, result);
                    } else if (SharedState.editingPicks && SharedState.itemsToClear === 0) {
                        resolve();
                        const message = localize('editingPicksMessage', 'How was your experience revising your selections?');
                        const result = await vscode.window.showInformationMessage(message, ...buttons);
                        await confirmationViewButtonActions(context, result);
                    } else if (SharedState.copilotClicked && !SharedState.cancelled) {
                        resolve();
                        const message = localize('copilotMessage', 'How was your experience using copilot and the summary view?');
                        const result = await vscode.window.showInformationMessage(message, ...buttons);
                        if (result === surveyButton) {
                            await confirmationViewButtonActions(context, result);
                        } else if (result === greatButton) {
                            context.telemetry.properties.copilotButtonHelpful = 'true';
                        } else if (result === notHelpfulButton) {
                            context.telemetry.properties.copilotButtonNotHelpful = 'true';
                        }
                    } else {
                        resolve();
                    }
                }
            });
        });
    }

    public shouldPrompt(): boolean {
        return this.viewConfig().length > 0;
    }
}

export async function confirmationViewButtonActions(context: IActionContext, result: vscode.MessageItem | undefined): Promise<void> {
    if (result) {
        if (result.title === 'Great') {
            context.telemetry.properties.confirmationViewHelpful = 'true';
        } else if (result.title === 'Unhelpful') {
            context.telemetry.properties.confirmationViewNotHelpful = 'true';
        } else if (result.title === 'Provide Feedback') {
            const confirmationViewSurveyLink = 'https://www.surveymonkey.com/r/DD5LC5Y'
            await openUrl(confirmationViewSurveyLink);
        }
    }
}

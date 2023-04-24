/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, nonNullValue } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { IStreamLogsContext } from "./IStreamLogsContext";
import { ILogStream, getActiveLogStreams } from "./logStreamRequest";

export class StreamListStep extends AzureWizardPromptStep<IStreamLogsContext> {
    public async prompt(context: IStreamLogsContext): Promise<void> {
        const placeHolder: string = localize('selectStream', 'Select a stream');
        const picks: IAzureQuickPickItem<ILogStream | undefined>[] = this.getPicks(context);
        if (picks.length > 1) {
            picks.push({ label: localize('stopAll', 'Stop all Streams'), data: undefined });
        }
        context.logStreamToStop = (await context.ui.showQuickPick(picks, { placeHolder, enableGrouping: true, suppressPersistence: true })).data;
    }

    public shouldPrompt(context: IStreamLogsContext): boolean {
        return !context.logStreamToStop;
    }

    private getPicks(context: IStreamLogsContext): IAzureQuickPickItem<ILogStream>[] {
        const logStreams = getActiveLogStreams(context);

        return Array.from(logStreams).map(l => {
            return {
                label: nonNullValue(l[1].data.container),
                group: l[1].data.replica,
                data: l[1] as ILogStream,
            };
        });
    }
}

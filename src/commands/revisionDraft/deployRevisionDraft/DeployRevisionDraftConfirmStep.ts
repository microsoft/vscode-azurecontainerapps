/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from "../../../utils/localize";
import { OverwriteConfirmStepBase } from "../../OverwriteConfirmStepBase";
import { type DeployRevisionDraftContext } from "./DeployRevisionDraftContext";

export class DeployRevisionDraftConfirmStep extends OverwriteConfirmStepBase<DeployRevisionDraftContext> {
    protected async promptCore(context: DeployRevisionDraftContext): Promise<void> {
        let warning: string = localize('deployRevisionWarning', 'This will deploy any unsaved changes to container app "{0}".', context.containerApp?.name);
        if (this.hasUnsupportedFeatures(context)) {
            warning += '\n\n' + this.unsupportedFeaturesWarning;
        }

        await context.ui.showWarningMessage(
            warning,
            { modal: true },
            { title: localize('continue', 'Continue') }
        );
    }

    public shouldPrompt(context: DeployRevisionDraftContext): boolean {
        return !!context.template;
    }
}

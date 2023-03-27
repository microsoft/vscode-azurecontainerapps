import { sendRequestWithTimeout } from "@microsoft/vscode-azext-azureutils";
import { nonNullValue } from "@microsoft/vscode-azext-utils";
import { TextDocumentContentProvider, Uri, window, workspace } from "vscode";
import { ext } from "../../../extensionVariables";
import { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
const contentScheme: string = 'image-error-log';

let _cachedContentProvider: ImageLogContentProvider | undefined;
export function getContentProvider(): ImageLogContentProvider {
    if (!_cachedContentProvider) {
        _cachedContentProvider = new ImageLogContentProvider();
        ext.context.subscriptions.push(workspace.registerTextDocumentContentProvider(contentScheme, _cachedContentProvider));
    }
    return _cachedContentProvider;
}

class ImageLogContentProvider implements TextDocumentContentProvider {
    private _contentMap: Map<string, string> = new Map<string, string>();

    public async openImageLog(context: IBuildImageInAzureContext): Promise<void> {
        const timeout = 15000;
        const logSasUrl = (await context.client.runs.getLogSasUrl(context.resourceGroupName, context.registryName, nonNullValue(context.run.runId))).logLink;
        const content = (await sendRequestWithTimeout(context, { method: 'GET', url: logSasUrl }, timeout, undefined)).bodyAsText;
        const uri: Uri = Uri.parse(`${contentScheme}:///${context.imageName}.log`);
        if (content) {
            this._contentMap.set(uri.toString(), content);
        }

        await window.showTextDocument(uri);
    }

    public async provideTextDocumentContent(uri: Uri): Promise<string> {
        const imageLogContent = nonNullValue(this._contentMap.get(uri.toString()));
        return imageLogContent
    }
}

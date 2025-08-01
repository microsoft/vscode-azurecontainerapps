/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call */
import { randomBytes } from 'crypto';
import * as path from 'path';
import * as vscode from 'vscode';
import { ext } from "../../extensionVariables";

const DEV_SERVER_HOST = 'http://localhost:8080';

/**
 * WebviewBaseController is a class that manages a vscode.Webview and provides
 * a way to communicate with it. It provides a way to register request handlers and reducers
 * that can be called from the webview. It also provides a way to post notifications to the webview.
 * @template Configuration The type of the configuration object that the webview will receive
 */
export abstract class WebviewBaseController<Configuration> implements vscode.Disposable {
    private _disposables: vscode.Disposable[] = [];
    private _isDisposed: boolean = false;

    // private _isFirstLoad: boolean = true;
    // private _loadStartTime: number = Date.now();
    private _onDisposed: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

    public readonly onDisposed: vscode.Event<void> = this._onDisposed.event;

    /**
     * Creates a new ReactWebviewPanelController
     * @param extensionContext The context of the extension-server
     * @param _webviewName The source file that the webview will use
     * @param configuration The initial state object that the webview will use
     */
    constructor(
        protected extensionContext: vscode.ExtensionContext,
        private _webviewName: string,
        protected configuration: Configuration,
    ) { }

    protected registerDisposable(disposable: vscode.Disposable) {
        this._disposables.push(disposable);
    }

    protected getDocumentTemplate(webview?: vscode.Webview) {
        const isProduction = ext.context.extensionMode === vscode.ExtensionMode.Production;
        const nonce = randomBytes(16).toString('base64');

        const filename = 'views.js';
        const uri = (...parts: string[]) => webview?.asWebviewUri(vscode.Uri.file(path.join(ext.context.extensionPath, ...parts))).toString(true);
        const srcUri = isProduction ? uri('dist', filename) : `${DEV_SERVER_HOST}/${filename}`;

        const codiconsUri = (...parts: string[]) => webview?.asWebviewUri(vscode.Uri.file(path.join(ext.context.extensionPath, ...parts))).toString(true);
        const codiconsSrcUri = isProduction ? codiconsUri('dist', 'icons', 'codicon.css') : codiconsUri('node_modules', '@vscode', 'codicons', 'dist', 'codicon.css');
        console.log(`codiconsSrcUri: ${codiconsSrcUri}`);
        console.log(`srcUri: ${srcUri}`);

        const csp = (
            isProduction
                ? [
                    `form-action 'none';`,
                    `default-src ${webview?.cspSource};`,
                    `script-src ${webview?.cspSource} 'nonce-${nonce}';`,
                    `style-src ${webview?.cspSource} vscode-resource: 'unsafe-inline';`,
                    `img-src ${webview?.cspSource} data: vscode-resource:;`,
                    `connect-src ${webview?.cspSource} ws:;`,
                    `font-src ${webview?.cspSource};`,
                    `worker-src ${webview?.cspSource} blob:;`,
                ]
                : [
                    `form-action 'none';`,
                    `default-src ${webview?.cspSource} ${DEV_SERVER_HOST};`,
                    `script-src ${webview?.cspSource} ${DEV_SERVER_HOST} 'nonce-${nonce}';`,
                    `style-src ${webview?.cspSource} ${DEV_SERVER_HOST} vscode-resource: 'unsafe-inline';`,
                    `img-src ${webview?.cspSource} ${DEV_SERVER_HOST} data: vscode-resource:;`,
                    `connect-src ${webview?.cspSource} ${DEV_SERVER_HOST} ws:;`,
                    `font-src ${webview?.cspSource} ${DEV_SERVER_HOST};`,
                    `worker-src ${webview?.cspSource} ${DEV_SERVER_HOST} blob:;`,
                ]
        ).join(' ');

        /**
         * Note to code maintainers:
         * encodeURIComponent(JSON.stringify(this.configuration)) below is crucial
         * We want to avoid the webview from crashing when the configuration object contains 'unsupported' bytes
         */

        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${codiconsSrcUri}" rel="stylesheet" />
                    <meta // noinspection JSAnnotator
                        http-equiv="Content-Security-Policy" content="${csp}" />
                </head>
                    <body>
                        <div id="root"></div>

                            <script type="module" nonce="${nonce}">
                                window.config = {
                                    ...window.config,
                                    __initialData: '${encodeURIComponent(JSON.stringify(this.configuration))}'
                            };

                                import { render } from "${srcUri}";
                                render('${this._webviewName}', acquireVsCodeApi());
                            </script>
                    </body>
                </html>`;
    }

    /**
     * Gets whether the controller has been disposed
     */
    public get isDisposed(): boolean {
        return this._isDisposed;
    }

    /**
     * Disposes the controller
     */
    public dispose() {
        this._onDisposed.fire();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        this._disposables.forEach((d) => d.dispose());
        this._isDisposed = true;
    }
}

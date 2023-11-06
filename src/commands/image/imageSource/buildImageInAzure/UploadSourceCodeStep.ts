/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { AzExtFsExtra, GenericTreeItem, nonNullValue, parseError } from '@microsoft/vscode-azext-utils';
import { exec } from 'child_process';
import * as path from 'path';
import type { Progress } from 'vscode';
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from '../../../../constants';
import { ext } from '../../../../extensionVariables';
import { fse } from '../../../../node/fs-extra';
import { tar } from '../../../../node/tar';
import { ExecuteActivityOutput, ExecuteActivityOutputStepBase } from '../../../../utils/activity/ExecuteActivityOutputStepBase';
import { createActivityChildContext } from '../../../../utils/activity/activityUtils';
import { createContainerRegistryManagementClient } from '../../../../utils/azureClients';
import { localize } from '../../../../utils/localize';
import { BuildImageInAzureImageSourceContext } from './BuildImageInAzureContext';

const vcsIgnoreList = ['.git', '.gitignore', '.bzr', 'bzrignore', '.hg', '.hgignore', '.svn'];

export class UploadSourceCodeStep extends ExecuteActivityOutputStepBase<BuildImageInAzureImageSourceContext> {
    public priority: number = 430;
    private _sourceFilePath: string;

    protected async executeCore(context: BuildImageInAzureImageSourceContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        context.registryName = nonNullValue(context.registry?.name);
        context.resourceGroupName = getResourceGroupFromId(nonNullValue(context.registry?.id));
        context.client = await createContainerRegistryManagementClient(context);
        /* relative path of src folder from rootFolder and what gets deployed */
        this._sourceFilePath = path.dirname(path.relative(context.rootFolder.uri.path, context.dockerfilePath));
        context.telemetry.properties.sourceDepth = this._sourceFilePath === '.' ? '0' : String(this._sourceFilePath.split(path.sep).length);

        const uploading: string = localize('uploadingSourceCode', 'Uploading source code...', this._sourceFilePath);
        progress.report({ message: uploading });
        const source: string = path.join(context.rootFolder.uri.fsPath, this._sourceFilePath);
        let items = await AzExtFsExtra.readDirectory(source);
        items = items.filter(i => {
            return !vcsIgnoreList.includes(i.name)
        });

        tar.c({ cwd: source }, items.map(i => i.name)).pipe(fse.createWriteStream(context.tarFilePath));

        const sourceUploadLocation = await context.client.registries.getBuildSourceUploadUrl(context.resourceGroupName, context.registryName);
        const uploadUrl: string = nonNullValue(sourceUploadLocation.uploadUrl);
        const relativePath: string = nonNullValue(sourceUploadLocation.relativePath);

        ext.outputChannel.appendLog('Tar File Path: ' + context.tarFilePath);
        ext.outputChannel.appendLog('List tar contents: ');

        // Try to list tar contents
        await new Promise<void>((res, rej) => {
            exec(`tar tvf ${context.tarFilePath}`, (e, stdout, stderr) => {
                if (e) {
                    const err = parseError(e);
                    ext.outputChannel.appendLog(err.message);
                    rej();
                }

                if (stderr) {
                    const err = parseError(stderr);
                    ext.outputChannel.appendLog(err.message);
                    rej();
                }

                ext.outputChannel.appendLog(stdout);
                res();
            });
        });

        ext.outputChannel.appendLog('Source Upload Location - Upload Url: ' + uploadUrl);
        ext.outputChannel.appendLog('Source Upload Location - Relative Path: ' + relativePath);

        const storageBlob = await import('@azure/storage-blob');
        const blobClient = new storageBlob.BlockBlobClient(uploadUrl);
        await blobClient.uploadFile(context.tarFilePath);

        context.uploadedSourceLocation = relativePath;
    }

    public shouldExecute(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.uploadedSourceLocation;
    }

    protected createSuccessOutput(context: BuildImageInAzureImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['uploadSourceCodeStep', activitySuccessContext]),
                label: localize('uploadSourceCodeLabel', 'Upload source code from "{1}" directory to registry "{0}"', context.registry?.name, this._sourceFilePath),
                iconPath: activitySuccessIcon
            }),
            message: localize('uploadedSourceCodeSuccess', 'Uploaded source code from "{1}" directory to registry "{0}" for remote build.', context.registry?.name, this._sourceFilePath)
        };
    }

    protected createFailOutput(context: BuildImageInAzureImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['uploadSourceCodeStep', activityFailContext]),
                label: localize('uploadSourceCodeLabel', 'Upload source code from "{1}" directory to registry "{0}"', context.registry?.name, this._sourceFilePath),
                iconPath: activityFailIcon
            }),
            message: localize('uploadedSourceCodeFail', 'Failed to upload source code from "{1}" directory to registry "{0}" for remote build.', context.registry?.name, this._sourceFilePath)
        };
    }
}

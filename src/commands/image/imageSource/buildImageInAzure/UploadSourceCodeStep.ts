/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type TransferProgressEvent } from '@azure/core-rest-pipeline';
import { type BlockBlobParallelUploadOptions } from '@azure/storage-blob';
import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { AzExtFsExtra, GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullValue } from '@microsoft/vscode-azext-utils';
import * as path from 'path';
import { type Progress } from 'vscode';
import { ext } from '../../../../extensionVariables';
import { fse } from '../../../../node/fs-extra';
import { tar } from '../../../../node/tar';
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from '../../../../utils/activity/ExecuteActivityOutputStepBase';
import { createActivityChildContext } from '../../../../utils/activity/activityUtils';
import { createContainerRegistryManagementClient } from '../../../../utils/azureClients';
import { localize } from '../../../../utils/localize';
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';
import { executeCli } from './executeCli';

const vcsIgnoreList = ['.git', '.gitignore', '.bzr', 'bzrignore', '.hg', '.hgignore', '.svn'];

export class UploadSourceCodeStep extends ExecuteActivityOutputStepBase<BuildImageInAzureImageSourceContext> {
    public priority: number = 430;
    /** Relative path of src folder from rootFolder and what gets deployed */
    private _sourceFilePath: string;

    protected async executeCore(context: BuildImageInAzureImageSourceContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this._sourceFilePath = context.rootFolder.uri.fsPath === context.srcPath ? '.' : path.relative(context.rootFolder.uri.fsPath, context.srcPath);
        context.telemetry.properties.sourceDepth = this._sourceFilePath === '.' ? '0' : String(this._sourceFilePath.split(path.sep).length);

        context.registryName = nonNullValue(context.registry?.name);
        context.resourceGroupName = getResourceGroupFromId(nonNullValue(context.registry?.id));
        context.client = await createContainerRegistryManagementClient(context);

        progress.report({ message: localize('uploadingSourceCode', 'Uploading source code...') });

        const source: string = path.join(context.rootFolder.uri.fsPath, this._sourceFilePath);
        let items = await AzExtFsExtra.readDirectory(source);
        items = items.filter(i => !vcsIgnoreList.includes(i.name));

        // Remove tarFile if it already exists
        if (await AzExtFsExtra.pathExists(context.tarFilePath)) {
            await AzExtFsExtra.deleteResource(context.tarFilePath);
        }

        tar.c({ cwd: source }, items.map(i => i.name)).pipe(fse.createWriteStream(context.tarFilePath));

        ext.outputChannel.appendLog(`Created tarFile: ${context.tarFilePath}`);
        ext.outputChannel.appendLog(`Tar file size: `);
        await executeCli(`command ls -lh ${context.tarFilePath}`);

        ext.outputChannel.appendLog(`Tar contents: `);
        await executeCli(`tar -tvzf ${context.tarFilePath}`);

        const sourceUploadLocation = await context.client.registries.getBuildSourceUploadUrl(context.resourceGroupName, context.registryName);
        const uploadUrl: string = nonNullValue(sourceUploadLocation.uploadUrl);

        const storageBlob = await import('@azure/storage-blob');
        const blobClient = new storageBlob.BlockBlobClient(uploadUrl);

        ext.outputChannel.appendLog('Beginning upload.');

        const uploadOptions: BlockBlobParallelUploadOptions = {
            onProgress: (p: TransferProgressEvent) => {
                ext.outputChannel.appendLog('Bytes uploaded: ' + p.loadedBytes.toString());
            }
        };
        const response = await blobClient.uploadFile(context.tarFilePath, uploadOptions);

        ext.outputChannel.appendLog('Source upload location: ');
        ext.outputChannel.appendLog(JSON.stringify(sourceUploadLocation));
        ext.outputChannel.appendLog(`Server upload response status: ${response._response.status}`);

        context.uploadedSourceLocation = sourceUploadLocation;
    }

    public shouldExecute(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.uploadedSourceLocation;
    }

    protected createSuccessOutput(context: BuildImageInAzureImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['uploadSourceCodeStepSuccessItem', activitySuccessContext]),
                label: localize('uploadSourceCodeLabel', 'Upload source code from "{1}" directory to registry "{0}"', context.registry?.name, this._sourceFilePath),
                iconPath: activitySuccessIcon
            }),
            message: localize('uploadedSourceCodeSuccess', 'Uploaded source code from "{1}" directory to registry "{0}" for remote build.', context.registry?.name, this._sourceFilePath)
        };
    }

    protected createFailOutput(context: BuildImageInAzureImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['uploadSourceCodeStepFailItem', activityFailContext]),
                label: localize('uploadSourceCodeLabel', 'Upload source code from "{1}" directory to registry "{0}"', context.registry?.name, this._sourceFilePath),
                iconPath: activityFailIcon
            }),
            message: localize('uploadedSourceCodeFail', 'Failed to upload source code from "{1}" directory to registry "{0}" for remote build.', context.registry?.name, this._sourceFilePath)
        };
    }
}

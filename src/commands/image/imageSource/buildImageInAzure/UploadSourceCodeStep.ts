/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { AzExtFsExtra, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullValue } from '@microsoft/vscode-azext-utils';
import * as path from 'path';
import { type Progress } from 'vscode';
import { fse } from '../../../../node/fs-extra';
import { tar } from '../../../../node/tar';
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from '../../../../utils/activity/ExecuteActivityOutputStepBase';
import { createActivityChildContext } from '../../../../utils/activity/activityUtils';
import { createContainerRegistryManagementClient } from '../../../../utils/azureClients';
import { localize } from '../../../../utils/localize';
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

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

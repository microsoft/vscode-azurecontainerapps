/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { AzExtFsExtra, AzureWizardExecuteStep, GenericTreeItem, nonNullValue } from '@microsoft/vscode-azext-utils';
import { Progress } from 'vscode';
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from '../../../../constants';
import { fse } from '../../../../node/fs-extra';
import { tar } from '../../../../node/tar';
import { ExecuteActivityOutput, createActivityChildContext, tryCatchActivityWrapper } from '../../../../utils/activityUtils';
import { createContainerRegistryManagementClient } from '../../../../utils/azureClients';
import { localize } from '../../../../utils/localize';
import type { IBuildImageInAzureContext } from './IBuildImageInAzureContext';

const vcsIgnoreList = ['.git', '.gitignore', '.bzr', 'bzrignore', '.hg', '.hgignore', '.svn'];

export class UploadSourceCodeStep extends AzureWizardExecuteStep<IBuildImageInAzureContext> {
    public priority: number = 430;
    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: IBuildImageInAzureContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.initSuccessOutput(context);
        this.initFailOutput(context);

        await tryCatchActivityWrapper(
            async () => {
                context.registryName = nonNullValue(context.registry?.name);
                context.resourceGroupName = getResourceGroupFromId(nonNullValue(context.registry?.id));
                context.client = await createContainerRegistryManagementClient(context);

                const uploading: string = localize('uploadingSourceCode', 'Uploading source code...');
                progress.report({ message: uploading });

                const source: string = context.rootFolder.uri.fsPath;
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
            },
            context, this.success, this.fail
        );
    }

    public shouldExecute(context: IBuildImageInAzureContext): boolean {
        return !context.uploadedSourceLocation;
    }

    private initSuccessOutput(context: IBuildImageInAzureContext): void {
        this.success.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['uploadSourceCodeStep', activitySuccessContext]),
            label: localize('uploadSourceCodeLabel', 'Upload source code to registry "{0}"', context.registry?.name),
            iconPath: activitySuccessIcon
        });
        this.success.output = localize('uploadedSourceCodeSuccess', 'Uploaded source code to registry "{0}" for remote build.', context.registry?.name);
    }

    private initFailOutput(context: IBuildImageInAzureContext): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['uploadSourceCodeStep', activityFailContext]),
            label: localize('uploadSourceCodeLabel', 'Upload source code to registry "{0}"', context.registry?.name),
            iconPath: activityFailIcon
        });
        this.fail.output = localize('uploadedSourceCodeFail', 'Failed to upload source code to registry "{0}" for remote build.', context.registry?.name);
    }
}

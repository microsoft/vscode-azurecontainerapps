/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { AzExtFsExtra, AzureWizardExecuteStep, GenericTreeItem, createContextValue, nonNullValue } from '@microsoft/vscode-azext-utils';
import { randomUUID } from 'crypto';
import { Progress, ThemeColor, ThemeIcon } from 'vscode';
import { activitySuccessContext } from '../../../../constants';
import { ext } from '../../../../extensionVariables';
import { fse } from '../../../../node/fs-extra';
import { tar } from '../../../../node/tar';
import { createContainerRegistryManagementClient } from '../../../../utils/azureClients';
import { localize } from '../../../../utils/localize';
import type { IBuildImageInAzureContext } from './IBuildImageInAzureContext';

const vcsIgnoreList = ['.git', '.gitignore', '.bzr', 'bzrignore', '.hg', '.hgignore', '.svn'];

export class UploadSourceCodeStep extends AzureWizardExecuteStep<IBuildImageInAzureContext> {
    public priority: number = 175;

    public async execute(context: IBuildImageInAzureContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        context.registryName = nonNullValue(context.registry?.name);
        context.resourceGroupName = getResourceGroupFromId(nonNullValue(context.registry?.id));
        context.client = await createContainerRegistryManagementClient(context);

        const uploading: string = localize('uploadingSourceCode', 'Uploading source code...');
        progress.report({ message: uploading });

        const source: string = context.rootFolder.uri.fsPath;
        let items = await AzExtFsExtra.readDirectory(source);
        items = items.filter(i => {
            return !vcsIgnoreList.includes(i.name)
        })

        tar.c({ cwd: source }, items.map(i => i.name)).pipe(fse.createWriteStream(context.tarFilePath));

        const sourceUploadLocation = await context.client.registries.getBuildSourceUploadUrl(context.resourceGroupName, context.registryName);
        const uploadUrl: string = nonNullValue(sourceUploadLocation.uploadUrl);
        const relativePath: string = nonNullValue(sourceUploadLocation.relativePath);

        const storageBlob = await import('@azure/storage-blob');
        const blobClient = new storageBlob.BlockBlobClient(uploadUrl);
        await blobClient.uploadFile(context.tarFilePath);

        context.uploadedSourceLocation = relativePath;

        const uploaded: string = localize('uploadedSourceCode', 'Uploaded source code to registry "{0}"', context.registryName);
        ext.outputChannel.appendLog(uploaded);

        if (context.activityChildren) {
            context.activityChildren.push(
                new GenericTreeItem(undefined, {
                    contextValue: createContextValue(['uploadSourceCodeStep', context.registryName, activitySuccessContext, randomUUID()]),
                    label: localize('uploadSourceCodeLabel', 'Upload source code to registry "{0}"', context.registryName),
                    iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
                })
            );
        }
    }

    public shouldExecute(context: IBuildImageInAzureContext): boolean {
        return !context.uploadedSourceLocation
    }
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { AzExtFsExtra, AzureWizardExecuteStep, nonNullValue } from '@microsoft/vscode-azext-utils';
import { fse } from '../../../node/fs-extra';
import { tar } from '../../../node/tar';
import { createContainerRegistryManagementClient } from '../../../utils/azureClients';
import { IBuildImageInAzureContext } from './IBuildImageInAzureContext';

const vcsIgnoreList = ['.git', '.gitignore', '.bzr', 'bzrignore', '.hg', '.hgignore', '.svn'];

export class UploadSourceCodeStep extends AzureWizardExecuteStep<IBuildImageInAzureContext> {
    public priority: number = 175;

    public async execute(context: IBuildImageInAzureContext): Promise<void> {
        context.registryName = nonNullValue(context.registry?.name);
        context.resourceGroupName = getResourceGroupFromId(nonNullValue(context.registry?.id));
        context.client = await createContainerRegistryManagementClient(context);

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
    }

    public shouldExecute(context: IBuildImageInAzureContext): boolean {
        return !context.uploadedSourceLocation
    }
}

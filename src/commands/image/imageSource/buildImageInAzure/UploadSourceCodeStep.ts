/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { AzExtFsExtra, GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullValue, type AzExtTreeItem } from '@microsoft/vscode-azext-utils';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import * as path from 'path';
import * as tar from 'tar';
import { ThemeColor, ThemeIcon, type Progress } from 'vscode';
import { ext } from '../../../../extensionVariables';
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from '../../../../utils/activity/ExecuteActivityOutputStepBase';
import { createActivityChildContext } from '../../../../utils/activity/activityUtils';
import { createContainerRegistryManagementClient } from '../../../../utils/azureClients';
import { localize } from '../../../../utils/localize';
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

const vcsIgnoreList = ['.git', '.gitignore', '.bzr', 'bzrignore', '.hg', '.hgignore', '.svn'];

export class UploadSourceCodeStep<T extends BuildImageInAzureImageSourceContext> extends ExecuteActivityOutputStepBase<T> {
    public priority: number = 430;
    /** Path to a directory containing a custom Dockerfile that we sometimes build and upload for the user */
    private _customDockerfileDirPath?: string;
    /** Relative path of src folder from rootFolder and what gets deployed */
    private _sourceFilePath: string;

    protected async executeCore(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this._sourceFilePath = context.rootFolder.uri.fsPath === context.srcPath ? '.' : path.relative(context.rootFolder.uri.fsPath, context.srcPath);
        context.telemetry.properties.sourceDepth = this._sourceFilePath === '.' ? '0' : String(this._sourceFilePath.split(path.sep).length);

        context.registryName = nonNullValue(context.registry?.name);
        context.resourceGroupName = getResourceGroupFromId(nonNullValue(context.registry?.id));
        context.client = await createContainerRegistryManagementClient(context);

        progress.report({ message: localize('uploadingSourceCode', 'Uploading source code...') });

        const source: string = path.join(context.rootFolder.uri.fsPath, this._sourceFilePath);
        let items = await AzExtFsExtra.readDirectory(source);
        items = items.filter(i => !vcsIgnoreList.includes(i.name));

        await this.buildCustomDockerfileIfNecessary(context);
        if (this._customDockerfileDirPath) {
            // Create an uncompressed tarball with the base project
            const tempTarFilePath: string = context.tarFilePath.replace(/\.tar\.gz/, '.tar');
            await tar.c({ cwd: source, file: tempTarFilePath }, items.map(i => path.relative(source, i.fsPath)));

            // Append/Overwrite the original Dockerfile with the custom one that was made
            await tar.r({ cwd: this._customDockerfileDirPath, file: tempTarFilePath }, [path.relative(source, context.dockerfilePath)]);

            // Create the final compressed version
            // Note: Noticed some hanging issues when using the async version to add existing tar archives;
            // however, the issues seem to disappear when utilizing the sync version
            tar.c({ cwd: tmpdir(), gzip: true, sync: true, file: context.tarFilePath }, [`@${path.basename(tempTarFilePath)}`]);

            try {
                // Remove temporarily created resources
                await AzExtFsExtra.deleteResource(tempTarFilePath);
                await AzExtFsExtra.deleteResource(this._customDockerfileDirPath, { recursive: true });
            } catch {
                // Swallow error, don't halt the deploy process just because we couldn't delete the temp files, provide a warning instead
                ext.outputChannel.appendLog(localize('errorDeletingTempFiles', 'Warning: Could not remove some of the following temporary files: "{0}", "{1}", try removing these manually later.', tempTarFilePath, this._customDockerfileDirPath));
            }
        } else {
            await tar.c({ cwd: source, gzip: true, file: context.tarFilePath }, items.map(i => path.relative(source, i.fsPath)));
        }

        const sourceUploadLocation = await context.client.registries.getBuildSourceUploadUrl(context.resourceGroupName, context.registryName);
        const uploadUrl: string = nonNullValue(sourceUploadLocation.uploadUrl);
        const relativePath: string = nonNullValue(sourceUploadLocation.relativePath);

        const storageBlob = await import('@azure/storage-blob');
        const blobClient = new storageBlob.BlockBlobClient(uploadUrl);
        await blobClient.uploadFile(context.tarFilePath);

        context.uploadedSourceLocation = relativePath;
    }

    public shouldExecute(context: T): boolean {
        return !context.uploadedSourceLocation;
    }

    /**
     * Checks and creates a custom Dockerfile if necessary to be used in place of the original
     * @populates this._customDockerfileDirPath
     */
    private async buildCustomDockerfileIfNecessary(context: T): Promise<void> {
        // Build a custom Dockerfile if it has ACR's unsupported `--platform` flag
        // See: https://github.com/microsoft/vscode-azurecontainerapps/issues/598
        const platformRegex: RegExp = /^(FROM.*)\s--platform=\S+(.*)$/gm;
        let dockerfileContent: string = await AzExtFsExtra.readFile(context.dockerfilePath);

        if (!platformRegex.test(dockerfileContent)) {
            return;
        }

        ext.outputChannel.appendLog(localize('removePlatformFlag', 'Detected a "--platform" flag in the Dockerfile. This flag is not supported in ACR. Attempting to provide a Dockerfile with the "--platform" flag removed.'));
        dockerfileContent = dockerfileContent.replace(platformRegex, '$1$2');

        const customDockerfileDirPath: string = path.join(tmpdir(), randomUUID());
        const dockerfileRelativePath: string = path.relative(context.srcPath, context.dockerfilePath);
        const customDockerfilePath = path.join(customDockerfileDirPath, dockerfileRelativePath);
        await AzExtFsExtra.writeFile(customDockerfilePath, dockerfileContent);

        this._customDockerfileDirPath = customDockerfileDirPath;
    }

    protected createSuccessOutput(context: T): ExecuteActivityOutput {
        let loadMoreChildrenImpl: (() => Promise<AzExtTreeItem[]>) | undefined;
        if (this._customDockerfileDirPath) {
            loadMoreChildrenImpl = () => {
                const removePlatformSuccessItem = new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(['removePlatformSuccessItem']),
                    label: localize('removePlatformFlag', 'Remove unsupported ACR "--platform" flag'),
                    iconPath: new ThemeIcon('dash', new ThemeColor('terminal.ansiWhite')),
                });
                return Promise.resolve([removePlatformSuccessItem]);
            };
        }

        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['uploadSourceCodeStepSuccessItem', activitySuccessContext]),
                label: localize('uploadSourceCodeLabel', 'Upload source code from "{1}" directory to registry "{0}"', context.registry?.name, this._sourceFilePath),
                iconPath: activitySuccessIcon,
                loadMoreChildrenImpl
            }),
            message: localize('uploadedSourceCodeSuccess', 'Uploaded source code from "{1}" directory to registry "{0}" for remote build.', context.registry?.name, this._sourceFilePath)
        };
    }

    protected createFailOutput(context: T): ExecuteActivityOutput {
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

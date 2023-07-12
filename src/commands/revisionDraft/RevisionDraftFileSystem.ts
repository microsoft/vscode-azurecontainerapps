/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Template } from "@azure/arm-appcontainers";
import { nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { Disposable, Event, EventEmitter, FileChangeEvent, FileChangeType, FileStat, FileSystemProvider, FileType, TextDocument, Uri, window, workspace } from "vscode";
import { URI } from "vscode-uri";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import type { ContainerAppsItem } from "../../tree/ContainerAppsBranchDataProvider";
import type { RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import type { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { localize } from "../../utils/localize";

const notSupported: string = localize('notSupported', 'This operation is not currently supported.');

export class RevisionDraftFile implements FileStat {
    type: FileType = FileType.File;
    size: number;
    ctime: number;
    mtime: number;

    contents: Uint8Array;

    constructor(contents: Uint8Array, readonly containerAppId: string, readonly baseRevisionName: string) {
        this.contents = contents;
        this.size = contents.byteLength;
        this.ctime = Date.now();
        this.mtime = Date.now();
    }
}

/**
 * File system provider that allows for reading/writing/deploying container app revision drafts
 *
 * Enforces a policy of one revision draft per container app
 */
export class RevisionDraftFileSystem implements FileSystemProvider {
    static readonly scheme: string = 'containerAppsRevisionDraft';

    private readonly emitter: EventEmitter<FileChangeEvent[]> = new EventEmitter<FileChangeEvent[]>();
    private readonly bufferedEvents: FileChangeEvent[] = [];
    private fireSoonHandle?: NodeJS.Timer;

    private draftStore: Map<string, RevisionDraftFile> = new Map();

    get onDidChangeFile(): Event<FileChangeEvent[]> {
        return this.emitter.event;
    }

    // Create
    createRevisionDraft(item: ContainerAppItem | RevisionItem | RevisionDraftItem): void {
        const uri: Uri = this.buildUriFromItem(item);
        if (this.doesUriExist(uri)) {
            return;
        }

        let file: RevisionDraftFile | undefined;
        if (item instanceof ContainerAppItem) {
            /**
             * Sometimes there are micro-differences present between the latest revision template and the container app template.
             * They end up being essentially equivalent, but not so equivalent as to always pass a deep copy test (which is how we detect unsaved changes).
             *
             * Since only container app template data is shown in single revision mode, and since revision data is not directly present on
             * the container app tree item without further changes, it is easier to just use the container app template
             * as the primary source of truth when in single revision mode.
             */
            const revisionContent: Uint8Array = Buffer.from(JSON.stringify(nonNullValueAndProp(item.containerApp, 'template'), undefined, 4));
            file = new RevisionDraftFile(revisionContent, item.containerApp.id, nonNullValueAndProp(item.containerApp, 'latestRevisionName'));
        } else {
            const revisionContent: Uint8Array = Buffer.from(JSON.stringify(nonNullValueAndProp(item.revision, 'template'), undefined, 4));
            file = new RevisionDraftFile(revisionContent, item.containerApp.id, nonNullValueAndProp(item.revision, 'name'));
        }

        this.draftStore.set(uri.path, file);
        this.fireSoon({ type: FileChangeType.Created, uri });
    }

    // Read
    parseRevisionDraft<T extends ContainerAppsItem>(item: T): Template | undefined {
        const uri: URI = this.buildUriFromItem(item);
        if (!this.doesUriExist(uri)) {
            return undefined;
        }

        return JSON.parse(this.readFile(uri).toString()) as Template;
    }

    readFile(uri: Uri): Uint8Array {
        const contents = this.draftStore.get(uri.path)?.contents;
        return contents ? Buffer.from(contents) : Buffer.from('');
    }

    doesContainerAppsItemHaveRevisionDraft<T extends ContainerAppsItem>(item: T): boolean {
        const uri: Uri = this.buildUriFromItem(item);
        return this.doesUriExist(uri);
    }

    getRevisionDraftFile<T extends ContainerAppsItem>(item: T): RevisionDraftFile | undefined {
        const uri: Uri = this.buildUriFromItem(item);
        return this.draftStore.get(uri.path);
    }

    stat(uri: Uri): FileStat {
        const file: RevisionDraftFile | undefined = this.draftStore.get(uri.path);

        if (file) {
            return {
                type: file.type,
                ctime: file.ctime,
                mtime: file.mtime,
                size: file.size
            };
        } else {
            return { type: FileType.File, ctime: 0, mtime: 0, size: 0 };
        }
    }

    // Update
    async editRevisionDraft(item: ContainerAppItem | RevisionItem | RevisionDraftItem): Promise<void> {
        const uri: Uri = this.buildUriFromItem(item);
        if (!this.doesUriExist(uri)) {
            this.createRevisionDraft(item);
        }

        const textDoc: TextDocument = await workspace.openTextDocument(uri);
        await window.showTextDocument(textDoc);
    }

    writeFile(uri: Uri, contents: Uint8Array): void {
        const file: RevisionDraftFile | undefined = this.draftStore.get(uri.path);
        if (!file || file.contents === contents) {
            return;
        }

        file.contents = contents;
        file.size = contents.byteLength;
        file.mtime = Date.now();

        this.draftStore.set(uri.path, file);
        this.fireSoon({ type: FileChangeType.Changed, uri });

        // Any new changes to the draft file can cause the states of a container app's children to change (e.g. displaying "Unsaved changes")
        ext.state.notifyChildrenChanged(file.containerAppId);
    }

    // Delete
    discardRevisionDraft<T extends ContainerAppsItem>(item: T): void {
        const uri: Uri = this.buildUriFromItem(item);
        if (!this.doesUriExist(uri)) {
            return;
        }

        this.delete(uri);
    }

    delete(uri: Uri): void {
        this.draftStore.delete(uri.path);
        this.fireSoon({ type: FileChangeType.Deleted, uri });
    }

    // Helpers
    private buildUriFromItem<T extends ContainerAppsItem>(item: T): Uri {
        return URI.parse(`${RevisionDraftFileSystem.scheme}:/${item.containerApp.name}.json`);
    }

    private doesUriExist(uri: Uri): boolean {
        return !!this.draftStore.get(uri.path);
    }

    // Adapted from: https://github.com/microsoft/vscode-extension-samples/blob/master/fsprovider-sample/src/fileSystemProvider.ts
    fireSoon(...events: FileChangeEvent[]): void {
        this.bufferedEvents.push(...events);

        if (this.fireSoonHandle) {
            clearTimeout(this.fireSoonHandle);
        }

        this.fireSoonHandle = setTimeout(() => {
            this.emitter.fire(this.bufferedEvents);
            this.bufferedEvents.length = 0;
        }, 5);
    }

    watch(): Disposable {
        return new Disposable((): void => { /** Do nothing */ });
    }

    readDirectory(): [string, FileType][] {
        throw new Error(notSupported);
    }

    createDirectory(): void {
        throw new Error(notSupported);
    }

    rename(): void {
        throw new Error(notSupported);
    }
}

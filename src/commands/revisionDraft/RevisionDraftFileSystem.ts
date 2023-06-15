import type { Template } from "@azure/arm-appcontainers";
import { nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { Disposable, Event, EventEmitter, FileChangeEvent, FileChangeType, FileStat, FileSystemProvider, FileType, Memento, TextDocument, Uri, window, workspace } from "vscode";
import { URI } from "vscode-uri";
import type { ContainerAppsItem } from "../../tree/ContainerAppsBranchDataProvider";
import type { RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import type { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { localize } from "../../utils/localize";

const notSupported: string = localize('notSupported', 'This operation is not currently supported.');

class File implements FileStat {
    type: FileType = FileType.File;
    size: number;
    ctime: number;
    mtime: number;

    baseRevisionName: string;
    contents: Uint8Array;

    constructor(contents: Uint8Array, baseRevisionName: string) {
        this.baseRevisionName = baseRevisionName;
        this.contents = contents;
        this.size = contents.byteLength;
        this.ctime = Date.now();
        this.mtime = Date.now();
    }
}

/**
 * File system provider that allows for reading/writing/deploying container app revision drafts
 * Stores drafts in VS Code's global state (Memento) storage
 *
 * Enforces a policy of one revision draft per container app
 */
export class RevisionDraftFileSystem implements FileSystemProvider {
    static scheme: string = 'containerAppsRevisionDraft';

    private readonly emitter: EventEmitter<FileChangeEvent[]> = new EventEmitter<FileChangeEvent[]>();
    private readonly bufferedEvents: FileChangeEvent[] = [];
    private fireSoonHandle?: NodeJS.Timer;

    constructor(private localStorage: Memento) { }

    get onDidChangeFile(): Event<FileChangeEvent[]> {
        return this.emitter.event;
    }

    // Create / Update..
    async createOrEditRevisionDraftFromItem(item: RevisionItem | RevisionDraftItem): Promise<void> {
        const uri: Uri = this.buildUriFromItem(item);

        if (!this.doesUriExist(uri)) {
            const revisionContent: Uint8Array = Buffer.from(JSON.stringify(nonNullValueAndProp((item as RevisionItem).revision, 'template'), undefined, 4));
            const file: File = new File(revisionContent, nonNullValueAndProp((item as RevisionItem).revision, 'name'));

            await this.localStorage.update(uri.path, file);
            this.fireSoon({ type: FileChangeType.Created, uri });
        }

        const textDoc: TextDocument = await workspace.openTextDocument(uri);
        await window.showTextDocument(textDoc);
    }

    async writeFile(uri: Uri, contents: Uint8Array): Promise<void> {
        const file: File | undefined = this.localStorage.get<File>(uri.path);
        if (!file) {
            return;
        }

        file.contents = contents;
        file.size = contents.byteLength;
        file.mtime = Date.now();

        await this.localStorage.update(uri.path, file);
        this.fireSoon({ type: FileChangeType.Changed, uri });
    }

    // Read..
    getParsedRevisionDraftUsingItem<T extends ContainerAppsItem>(item: T): Template {
        const uri: URI = this.buildUriFromItem(item);
        if (!this.doesUriExist(uri)) {
            throw new Error(localize('noRevisionDraft', 'Unable to locate a draft for the current revision.'));
        }

        return JSON.parse(this.readFile(uri).toString()) as Template;
    }

    readFile(uri: Uri): Uint8Array {
        const contents = this.localStorage.get<File>(uri.path)?.contents;
        return contents ? Buffer.from(contents) : Buffer.from('');
    }

    doesContainerAppsItemHaveRevisionDraft<T extends ContainerAppsItem>(item: T): boolean {
        const uri: Uri = this.buildUriFromItem(item);
        return this.doesUriExist(uri);
    }

    getBaseRevisionNameUsingItem<T extends ContainerAppsItem>(item: T): string | undefined {
        const uri: Uri = this.buildUriFromItem(item);
        return this.localStorage.get<File>(uri.path)?.baseRevisionName;
    }

    stat(uri: Uri): FileStat {
        const file: File | undefined = this.localStorage.get<File>(uri.path);

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

    // Delete..
    async discardRevisionDraftUsingItem<T extends ContainerAppsItem>(item: T): Promise<void> {
        const uri: Uri = this.buildUriFromItem(item);
        if (!this.doesUriExist(uri)) {
            return;
        }

        await this.delete(uri);
    }

    async delete(uri: Uri): Promise<void> {
        await this.localStorage.update(uri.path, undefined);
        this.fireSoon({ type: FileChangeType.Deleted, uri });
    }

    // Helpers..
    private buildUriFromItem<T extends ContainerAppsItem>(item: T): Uri {
        return URI.parse(`${RevisionDraftFileSystem.scheme}:/${item.containerApp.name}.json`);
    }

    private doesUriExist(uri: Uri): boolean {
        return !!this.localStorage.get<File>(uri.path);
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

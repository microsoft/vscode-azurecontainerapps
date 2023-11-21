import { AzExtParentTreeItem, type AzExtTreeItem, type IActionContext } from "@microsoft/vscode-azext-utils";
import { TreeItemCollapsibleState } from "vscode";

export interface GenericParentTreeItemOptions {
    childTypeLabel?: string;
    contextValue: string;
    label: string;
    initialCollapsibleState?: TreeItemCollapsibleState;
    suppressMaskLabel?: boolean;

    compareChildrenImpl?(item1: AzExtTreeItem, item2: AzExtTreeItem): number;
    loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): AzExtTreeItem[] | Promise<AzExtTreeItem[]>;
}

export class GenericParentTreeItem extends AzExtParentTreeItem {
    contextValue: string;
    suppressMaskLabel?: boolean;

    readonly childTypeLabel?: string;
    readonly label: string;
    readonly initialCollapsibleState: TreeItemCollapsibleState;
    readonly parent: AzExtParentTreeItem | undefined;

    constructor(parent: AzExtParentTreeItem | undefined, readonly options: GenericParentTreeItemOptions) {
        super(parent);
        this.contextValue = options.contextValue;
        this.suppressMaskLabel = options.suppressMaskLabel;
        this.childTypeLabel = options.childTypeLabel;
        this.label = options.label;
        this.initialCollapsibleState = options.initialCollapsibleState === TreeItemCollapsibleState.Expanded ?
            TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed;
        this.compareChildrenImpl = options.compareChildrenImpl ?? (() => 0);
    }

    async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        // The abstract class requires that loadMoreChildrenImpl be immediately defined before the constructor is run
        // So just call the options method directly here
        return await this.options.loadMoreChildrenImpl(clearCache, context);
    }

    hasMoreChildrenImpl(): boolean {
        return false;
    }
}

import { IGenericTreeItemOptions } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { TreeElementBase } from '../tree/ContainerAppsBranchDataProvider';

export interface GenericItemOptions extends IGenericTreeItemOptions {
    commandArgs?: unknown[];
}

export function createGenericItem(options: GenericItemOptions): TreeElementBase {

    let commandArgs = options.commandArgs;
    const item = {
        id: options.id,
        getTreeItem(): vscode.TreeItem {
            return {
                ...options,
                command: options.commandId ? {
                    title: '',
                    command: options.commandId,
                    arguments: commandArgs,
                } : undefined,
            }
        }
    };

    commandArgs ??= [item];

    return item;
}

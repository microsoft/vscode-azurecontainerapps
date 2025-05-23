/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Button, createTableColumn, DataGrid, DataGridBody, DataGridCell, DataGridRow, TableCellLayout, Tooltip, type OnSelectionChangeData, type SelectionItemId, type TableColumnDefinition } from '@fluentui/react-components';
import { Sparkle16Filled } from '@fluentui/react-icons';
import * as React from 'react';
import { useContext, useState, type JSX } from 'react';
import './confirmationView.scss';
import { type ConfirmationViewControllerType } from './ConfirmationViewController';
import { useConfiguration } from './webview-client/useConfiguration';
import { WebviewContext } from './WebviewContext';

type Item = {
    name: string;
    value: string;
}

function createNewSetWithItem(set: Set<SelectionItemId>, first: boolean): Set<SelectionItemId> {
    if (first) {
        const firstElement = Array.from(set)[0];
        return new Set([firstElement]);
    } else {
        const lastElement = Array.from(set)[set.size - 1];
        return new Set([lastElement]);
    }
}

export const ConfirmationView = (): JSX.Element => {
    const [title, setTitle] = useState('Confirm');
    const [selectedItems, setSelectedItems] = useState<Set<SelectionItemId>>(new Set());
    const { vscodeApi } = useContext(WebviewContext);

    const configuration = useConfiguration<ConfirmationViewControllerType>();
    const confirmClicked = () => {
        const selectedItemIndex = Number(Array.from(selectedItems)[0]);
        const itemsToClear = configuration.length - selectedItemIndex;
        vscodeApi.postMessage({
            command: 'confirm',
            itemsToClear: itemsToClear
        });
        console.log(itemsToClear);
    };

    const copilotClicked = (name: string, value: string) => {
        vscodeApi.postMessage({
            command: 'copilot',
            itemsToClear: 0,
            name: name,
            value: value
        });
    }

    const cancelClicked = () => {
        vscodeApi.postMessage({
            command: 'cancel'
        })
    };

    const onChange = (_ev: React.MouseEvent<HTMLInputElement, MouseEvent>, data: OnSelectionChangeData) => {
        setTitle(data.selectedItems.size > 0 ? 'Edit' : 'Confirm');
        setSelectedItems(data.selectedItems.size > 0 ? createNewSetWithItem(data.selectedItems, false) : createNewSetWithItem(data.selectedItems, true));
    }

    const columnSizingOptions = {
        name: {
            defaultWidth: 200,
            minWidth: 200,
        },
        value: {
            defaultWidth: 200,
            minWidth: 200,
        }
    }

    const columns: TableColumnDefinition<Item>[] = [
        createTableColumn<Item>({
            columnId: 'name',
            renderCell: (item: Item) => {
                return <TableCellLayout >{item.name}</TableCellLayout >;
            },
        }),
        createTableColumn<Item>({
            columnId: 'value',
            renderCell: (item: Item) => {
                return <TableCellLayout className='value'> {item.value}
                    <Tooltip content='Ask Copilot' relationship='label'>
                        <Button
                            appearance='transparent' icon={<Sparkle16Filled />} onClick={(event) => {
                                event.stopPropagation();
                                copilotClicked(item.name, item.value);
                            }}>
                        </Button>
                    </Tooltip>
                </TableCellLayout >;
            },
        })
    ]

    const DataGridComponent: React.FC<{
        context: ConfirmationViewControllerType,
        selectedItems?: Set<SelectionItemId> | undefined,
        onSelectionChange: (_ev: React.MouseEvent<HTMLInputElement, MouseEvent>, data: OnSelectionChangeData) => void,
    }> = ({ context, selectedItems, onSelectionChange },) => {
        return (
            <DataGrid
                items={context}
                columns={columns}
                onSelectionChange={onSelectionChange}
                selectionMode='multiselect'
                selectedItems={selectedItems}
                columnSizingOptions={columnSizingOptions}
                resizableColumns
                resizableColumnsOptions={{
                    autoFitColumns: false,
                }}>
                <DataGridBody<Item>>
                    {({ item, rowId }) => (
                        <DataGridRow<Item>
                            key={rowId}>
                            {({ renderCell }) => (
                                <DataGridCell>{renderCell(item)}</DataGridCell>
                            )}
                        </DataGridRow>
                    )}
                </DataGridBody>
            </DataGrid >
        );
    };

    return (
        <div className='confirmationView'>
            <div className='header'>
                <h1>
                    Confirm + Deploy
                </h1>
                <div>Please select an input you would like to change. Otherwise click "Confirm" to deploy.</div>
            </div>

            <div className='viewContent'>
                <DataGridComponent context={configuration} selectedItems={selectedItems} onSelectionChange={onChange} />
                <div className='buttonsView'>
                    <Button appearance='primary' onClick={confirmClicked} size='large' >
                        {title}
                    </Button>
                    <Button appearance='secondary' onClick={cancelClicked} size='large' >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}

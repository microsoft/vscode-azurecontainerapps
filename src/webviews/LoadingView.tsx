/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Spinner } from "@fluentui/react-components";
import { useEffect, useState } from 'react';
import './styles/loadingView.scss';
import { LoadingViewCommands } from './webviewConstants';

type LoadingViewProgressItem = {
    name: string;
    completed: boolean;
}

type ProgressMessage = {
    command: LoadingViewCommands.AddProgressItem;
    name: string;
};

export const LoadingView = () => {
    const [progressItems, setProgressItems] = useState<LoadingViewProgressItem[]>([]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent<ProgressMessage>) => {
            const message = event.data;
            if (message.command === LoadingViewCommands.AddProgressItem) {
                setProgressItems(prev => [
                    ...prev,
                    { name: message.name, completed: true }
                ]);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className='loadingView'>
            <div className='loadingContent'>
                <Spinner labelPosition="below" label="Generating Copilot responses..." />
                {progressItems.length > 0 && (
                    <div className='progressList'>
                        {progressItems.map((item, index) => (
                            <div key={index} className='progressItem'>
                                <span className='checkmark codicon codicon-check'></span>
                                <span className='itemName'>{item.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


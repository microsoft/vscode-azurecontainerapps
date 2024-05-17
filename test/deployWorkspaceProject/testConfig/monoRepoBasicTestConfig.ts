/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type DeployWorkspaceProjectTestConfig } from "./DeployWorkspaceProjectTestConfig";

export const monoRepoBasicTestConfig: DeployWorkspaceProjectTestConfig = [
    // Deploy app1
    {
        inputs: [
            'app1/Dockerfile',
            new RegExp('Create new container apps environment', 'i'),
            'Continue',
            'my-test-env',
            'app1',
            './app1',
            'app1/.env.example',
            'East US',
            'Save'
        ],
        expected: {

        },
        dotVSCodeSettings: {
            containerApps: {
                deploymentConfigurations: [

                ]
            }
        }
    }
];

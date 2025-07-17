/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as assert from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ActivityBar, type ExtensionsViewItem, type ExtensionsViewSection } from 'vscode-extension-tester';

function getPackageJson(): any {
    // get the content of the current project's package.json
    const packageJsonPath = join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson;
}

// sample test code on how to look for an extension
describe('Example extension view tests', () => {
    let helloExtension: ExtensionsViewItem;

    before(async function () {
        this.timeout(15000);
        // open the extensions view
        const view = await (await new ActivityBar().getViewControl('Extensions'))?.openView();
        await view?.getDriver().wait(async function () {
            return (await view.getContent().getSections()).length > 0;
        });

        // we want to find the hello-world extension (this project)
        // first we need a view section, best place to get started is the 'Installed' section
        const extensions = (await view?.getContent().getSection('Installed')) as ExtensionsViewSection;

        const packageJson = getPackageJson();

        // search for the extension, you can use any syntax vscode supports for the search field
        // it is best to prepend @installed to the extension name if you don't want to see the results from marketplace
        // also, getting the name directly from package.json seem like a good idea
        await extensions.getDriver().wait(async function () {
            helloExtension = (await extensions.findItem(`@installed ${packageJson.displayName}`)) as ExtensionsViewItem;
            return helloExtension !== undefined;
        });
    });

    it('Check the extension info', async () => {
        // now we have the extension item, we can check it shows all the fields we want
        const author = await helloExtension.getAuthor();
        const version = await helloExtension.getVersion();

        const packageJson = getPackageJson();

        // in this case we are comparing the results against the values in package.json
        assert.equal(author, packageJson.publisher);
        assert.equal(version, packageJson.version);
    });
});

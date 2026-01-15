/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { getImageNameWithoutTag } from "src/utils/imageNameUtils";

suite('imageNameUtils', () => {
    test('getImageNameWithoutTag', () => {
        const testValues: string[] = [
            '',
            'myimage:latest',
            'repository/name:1.0.0',
            'custom-registry.com/myimage:v2',
            'library/ubuntu:20.04',
            'project/service-name:dev-build',
            'docker.io/library/nginx:stable',
            'my-repo/my-service:release-candidate',
            'anotherrepo/anotherimage:test',
            'image_without_tag',
            'my-image:with:multiple:colons',
            'some-registry.io/nested/repo/image:12345',
            'edgecase-without-tag:',
            'dockerhub.com/image-name:alpha-beta',
            'registry.example.com:5000/repo/image:tagname',
            'private-repo/myimage:',
            'test-image-with-special-characters:beta@123',
            'path/to/image:no-colon-in-name',
            'simple-image:another:tag',
            'example.com:8080/repo/image:v3'
        ];

        const expectedValues: string[] = [
            '',
            'myimage',
            'repository/name',
            'custom-registry.com/myimage',
            'library/ubuntu',
            'project/service-name',
            'docker.io/library/nginx',
            'my-repo/my-service',
            'anotherrepo/anotherimage',
            'image_without_tag',
            'my-image:with:multiple',
            'some-registry.io/nested/repo/image',
            'edgecase-without-tag',
            'dockerhub.com/image-name',
            'registry.example.com:5000/repo/image',
            'private-repo/myimage',
            'test-image-with-special-characters',
            'path/to/image',
            'simple-image:another',
            'example.com:8080/repo/image'
        ];

        for (let i = 0; i < testValues.length; i++) {
            assert.equal(getImageNameWithoutTag(testValues[i]), expectedValues[i]);
        }
    });
});

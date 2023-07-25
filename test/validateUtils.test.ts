import * as assert from 'assert';
import { validateUtils } from '../extension.bundle';

type LowerCaseAlphanumericWithSymbolsParams = {
    value: string;
    symbols?: string;
};

suite('validateUtils', () => {
    test('isLowerCaseAlphanumericWithSymbols', () => {
        const trueValues: LowerCaseAlphanumericWithSymbolsParams[] = [
            { value: 'hello123' },
            { value: 'hello-world' },
            { value: 'hello-world', symbols: '-' },
            { value: 'hello@world', symbols: '@%' },
            { value: 'a' },
            { value: '123' },
            { value: '12-3' },
            { value: 'he-ll-o' },
            { value: '123-8.@9', symbols: '-.@' },
            { value: 'he!l@l#$o', symbols: '!@#$' }
        ];

        for (const { value, symbols } of trueValues) {
            assert.equal(validateUtils.isLowerCaseAlphanumericWithSymbols(value, symbols), true);
        }

        const falseValues: LowerCaseAlphanumericWithSymbolsParams[] = [
            { value: 'hello_world' },
            { value: 'Hello123' },
            { value: '' },
            { value: 'A' },
            { value: 'hello123-' },
            { value: '-hello123' },
            { value: '12.3' },
            { value: '123-8.@9', symbols: '-.' },
            { value: 'he!l@l#o$', symbols: '!@#$' }
        ];

        for (const { value, symbols } of falseValues) {
            assert.equal(validateUtils.isLowerCaseAlphanumericWithSymbols(value, symbols), false);
        }
    });
});

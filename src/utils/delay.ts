/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export async function delay(ms: number): Promise<void> {
    await new Promise<void>((resolve: () => void): NodeJS.Timer => setTimeout(resolve, ms));
}

/**
 * Delays execution using exponential backoff, but will not exceed the max elapsed time in ms.
 *
 * @param attempt The current attempt number (starting from 1).
 * @param baseDelayMs The base delay in milliseconds.
 * @param maxElapsedLimitMs The maximum elapsed delay in milliseconds.
 */
export async function delayWithExponentialBackoff(attempt: number, baseDelayMs: number, maxElapsedLimitMs: number): Promise<void> {
    const elapsedTimeMs = baseDelayMs * (Math.pow(2, attempt - 1) - 1);
    const nextDelayTickMs = baseDelayMs * Math.pow(2, attempt - 1);
    const maxWaitAdjustedMs = maxElapsedLimitMs - elapsedTimeMs;

    if (maxWaitAdjustedMs <= 0) {
        return;
    }

    await Promise.race([
        delay(nextDelayTickMs),
        delay(maxWaitAdjustedMs),
    ]);
}

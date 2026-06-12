/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { execFile } from 'child_process';
import { localize } from '../utils/localize';
import { type AutoSuspendPolicy, type CreateSandboxOptions, type PublicDiskImage, type Sandbox, type SandboxGroup, type SandboxGroupRef, type SandboxLifecycle, type SandboxRef, type Subscription } from './acaSandboxTypes';
import { augmentedPath, resolveExecutable } from './cliPath';

export const acaCliInstallUrl: string = 'https://aka.ms/aca-cli-install';

/** Result of running an external process. */
export interface ProcessResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

/**
 * Runs an external executable with the given args. Implementations MUST invoke the process
 * without a shell (args passed as an array) to avoid shell-injection. Injectable so tests
 * can mock process execution without spawning real binaries.
 *
 * The runner should reject with an error carrying a `code` of `'ENOENT'` when the executable
 * cannot be found, mirroring Node's `child_process` behavior.
 */
export type ProcessRunner = (file: string, args: string[]) => Promise<ProcessResult>;

export interface AcaSandboxCliOptions {
    /** Process runner. Defaults to an `execFile`-based implementation with `shell: false`. */
    runner?: ProcessRunner;
    /** Path/name of the `aca` executable. Defaults to `aca` (`aca.exe` on Windows). */
    acaPath?: string;
    /** Path/name of the `az` executable. Defaults to `az` (`az.cmd` on Windows). */
    azPath?: string;
}

const defaultRunner: ProcessRunner = (file: string, args: string[]): Promise<ProcessResult> => {
    return new Promise<ProcessResult>((resolve, reject) => {
        // GUI-launched VS Code (e.g. from the Dock) does not inherit the shell PATH, so resolve
        // the executable against common install locations and pass an augmented PATH to the child.
        const resolvedFile = resolveExecutable(file);
        const env = { ...process.env, PATH: augmentedPath() };
        execFile(resolvedFile, args, { shell: false, env, maxBuffer: 1024 * 1024 * 64 }, (error, stdout, stderr) => {
            if (error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
                reject(error);
                return;
            }
            resolve({
                stdout: stdout ?? '',
                stderr: stderr ?? '',
                exitCode: error ? ((error as { code?: number }).code ?? 1) : 0,
            });
        });
    });
};

/**
 * Thin client over the external `aca` (Azure Container Apps) and `az` CLIs used to manage
 * sandbox microVMs. There is no TypeScript SDK for sandboxes, so all integration is via
 * shelling out. Exported and designed for reuse by follow-up features (e.g. an integrated
 * sandbox terminal).
 */
export class AcaSandboxCli {
    private readonly runner: ProcessRunner;
    private readonly acaPath: string;
    private readonly azPath: string;

    constructor(options: AcaSandboxCliOptions = {}) {
        this.runner = options.runner ?? defaultRunner;
        const isWindows = process.platform === 'win32';
        this.acaPath = options.acaPath?.trim() || (isWindows ? 'aca.exe' : 'aca');
        this.azPath = options.azPath?.trim() || (isWindows ? 'az.cmd' : 'az');
    }

    /** Enumerates enabled subscriptions via `az account list`. */
    public async listSubscriptions(): Promise<Subscription[]> {
        const stdout = await this.runAz(['account', 'list', '-o', 'json']);
        const subscriptions = parseJsonArray<Subscription>(stdout);
        return subscriptions.filter(s => !s.state || s.state === 'Enabled');
    }

    /** Lists sandbox groups in a subscription via `aca sandboxgroup list`. */
    public async listGroups(subscriptionId: string): Promise<SandboxGroup[]> {
        const stdout = await this.runAca(['sandboxgroup', 'list', '-s', subscriptionId, '-o', 'json']);
        return parseJsonArray<SandboxGroup>(stdout);
    }

    /** Lists sandboxes within a group via `aca sandbox list`. */
    public async listSandboxes(group: SandboxGroupRef): Promise<Sandbox[]> {
        const stdout = await this.runAca(['sandbox', 'list', ...groupArgs(group), '-o', 'json']);
        return parseJsonArray<Sandbox>(stdout);
    }

    /** Lists public disk images available to a group via `aca sandboxgroup disk list-public`. */
    public async listPublicDiskImages(group: SandboxGroupRef): Promise<PublicDiskImage[]> {
        const stdout = await this.runAca(['sandboxgroup', 'disk', 'list-public', ...groupArgs(group), '-o', 'json']);
        return parseJsonArray<PublicDiskImage>(stdout);
    }

    /**
     * Creates a sandbox in a group via `aca sandbox create`. Returns the created sandbox when the
     * CLI emits JSON, or `undefined` when it returns a non-object response.
     */
    public async createSandbox(group: SandboxGroupRef, options: CreateSandboxOptions): Promise<Sandbox | undefined> {
        const args: string[] = ['sandbox', 'create', ...groupArgs(group), '--disk', options.disk];
        if (options.cpu) {
            args.push('--cpu', options.cpu);
        }
        if (options.memory) {
            args.push('--memory', options.memory);
        }
        args.push('-o', 'json');
        const stdout = await this.runAca(args);
        return tryParseJsonObject<Sandbox>(stdout);
    }

    /** Gets a single sandbox via `aca sandbox get`. */
    public async getSandbox(ref: SandboxRef): Promise<Sandbox> {
        const stdout = await this.runAca(['sandbox', 'get', ...sandboxArgs(ref), '-o', 'json']);
        return parseJsonObject<Sandbox>(stdout);
    }

    /** Shows the lifecycle policy via `aca sandbox lifecycle show`. */
    public async showLifecycle(ref: SandboxRef): Promise<SandboxLifecycle> {
        const stdout = await this.runAca(['sandbox', 'lifecycle', 'show', ...sandboxArgs(ref), '-o', 'json']);
        return parseJsonObject<SandboxLifecycle>(stdout);
    }

    /** Suspends a sandbox via `aca sandbox stop`. */
    public async stop(ref: SandboxRef): Promise<void> {
        await this.runAca(['sandbox', 'stop', ...sandboxArgs(ref)]);
    }

    /** Resumes a sandbox via `aca sandbox resume`. */
    public async resume(ref: SandboxRef): Promise<void> {
        await this.runAca(['sandbox', 'resume', ...sandboxArgs(ref)]);
    }

    /** Deletes a sandbox via `aca sandbox delete --yes`. */
    public async delete(ref: SandboxRef): Promise<void> {
        await this.runAca(['sandbox', 'delete', ...sandboxArgs(ref), '--yes']);
    }

    /** Snapshots a sandbox via `aca sandbox snapshot --name <name>`. */
    public async snapshot(ref: SandboxRef, snapshotName: string): Promise<void> {
        await this.runAca(['sandbox', 'snapshot', ...sandboxArgs(ref), '--name', snapshotName]);
    }

    /**
     * Runs a one-shot command inside a sandbox via `aca sandbox exec -c <command>` and returns
     * its stdout. An optional `workingDirectory` is passed through as `--working-directory`.
     */
    public async exec(ref: SandboxRef, command: string, options?: { workingDirectory?: string }): Promise<string> {
        const args: string[] = ['sandbox', 'exec', ...sandboxArgs(ref), '-c', command];
        if (options?.workingDirectory) {
            args.push('--working-directory', options.workingDirectory);
        }
        return this.runAca(args);
    }

    /**
     * Sets the auto-suspend policy via `aca sandbox lifecycle set`.
     * Pass `enabled: false` to disable; otherwise an `idleTimeoutSeconds` is required.
     */
    public async setAutoSuspend(ref: SandboxRef, policy: { enabled: boolean; idleTimeoutSeconds?: number; mode?: string }): Promise<void> {
        const args: string[] = ['sandbox', 'lifecycle', 'set', ...sandboxArgs(ref)];
        if (policy.enabled) {
            args.push('--auto-suspend', 'enable');
            if (policy.idleTimeoutSeconds !== undefined) {
                args.push('--idle-timeout-seconds', String(policy.idleTimeoutSeconds));
            }
            if (policy.mode) {
                args.push('--mode', policy.mode);
            }
        } else {
            args.push('--auto-suspend', 'disable');
        }
        await this.runAca(args);
    }

    private async runAca(args: string[]): Promise<string> {
        return this.run(this.acaPath, args, true);
    }

    private async runAz(args: string[]): Promise<string> {
        return this.run(this.azPath, args, false);
    }

    private async run(file: string, args: string[], isAca: boolean): Promise<string> {
        let result: ProcessResult;
        try {
            result = await this.runner(file, args);
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
                throw new Error(isAca ?
                    localize('acaNotFound', 'The "aca" CLI could not be found. Install the Azure Container Apps CLI to manage sandboxes: {0}', acaCliInstallUrl) :
                    localize('azNotFound', 'The Azure CLI ("az") could not be found. Install it and run "az login" to manage sandboxes.'));
            }
            throw error;
        }

        if (result.exitCode !== 0) {
            const stderr = (result.stderr || result.stdout || '').trim();
            if (isAuthFailure(stderr)) {
                throw new Error(localize('acaAuthFailure', 'Authentication failed while running the sandbox CLI. Run "az login" (or "aca auth login") and try again.\n\n{0}', stderr));
            }
            const command = `${isAca ? 'aca' : 'az'} ${args.join(' ')}`;
            throw new Error(localize('acaCliFailed', 'Command "{0}" failed with exit code {1}.\n\n{2}', command, result.exitCode, stderr));
        }

        return result.stdout;
    }
}

function groupArgs(group: SandboxGroupRef): string[] {
    return ['-s', group.subscriptionId, '-g', group.resourceGroup, '--group', group.groupName];
}

function sandboxArgs(ref: SandboxRef): string[] {
    return [...groupArgs(ref), '--id', ref.sandboxId];
}

function isAuthFailure(stderr: string): boolean {
    return /\b(login|auth|authenticat|credential|token|unauthorized|forbidden|az login)\b/i.test(stderr);
}

function parseJsonArray<T>(stdout: string): T[] {
    const value = parseJson(stdout);
    if (value === undefined) {
        return [];
    }
    return Array.isArray(value) ? value as T[] : [];
}

function parseJsonObject<T>(stdout: string): T {
    const value = parseJson(stdout);
    if (value === undefined || value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(localize('acaParseError', 'The sandbox CLI returned an unexpected (non-object) response.'));
    }
    return value as T;
}

/**
 * Like {@link parseJsonObject} but never throws: returns `undefined` when the output is not a
 * JSON object. Tolerates leading/trailing non-JSON noise (e.g. progress or log lines that some
 * `aca` commands print before the JSON payload) by extracting the embedded object.
 */
function tryParseJsonObject<T>(stdout: string): T | undefined {
    const value = tryParseJson(stdout);
    if (value === undefined || value === null || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    return value as T;
}

/** Best-effort JSON parse that returns `undefined` instead of throwing, tolerating surrounding noise. */
function tryParseJson(stdout: string): unknown {
    const trimmed = (stdout ?? '').trim();
    if (!trimmed) {
        return undefined;
    }
    try {
        return JSON.parse(trimmed);
    } catch {
        // Fall back to extracting an embedded object/array when the CLI emits extra text.
        const start = trimmed.search(/[[{]/);
        const end = Math.max(trimmed.lastIndexOf(']'), trimmed.lastIndexOf('}'));
        if (start !== -1 && end > start) {
            try {
                return JSON.parse(trimmed.slice(start, end + 1));
            } catch {
                return undefined;
            }
        }
        return undefined;
    }
}

function parseJson(stdout: string): unknown {
    const trimmed = (stdout ?? '').trim();
    if (!trimmed) {
        return undefined;
    }
    try {
        return JSON.parse(trimmed);
    } catch {
        throw new Error(localize('acaJsonParseError', 'Failed to parse JSON output from the sandbox CLI.'));
    }
}

/**
 * Parses an ARM sandbox-group id into a {@link SandboxGroupRef}. Returns `undefined`
 * when the id is not a recognizable sandbox-group resource id.
 */
export function parseSandboxGroupId(id: string): SandboxGroupRef | undefined {
    const match = /\/subscriptions\/([^/]+)\/resourceGroups\/([^/]+)\/providers\/Microsoft\.App\/sandboxGroups\/([^/]+)/i.exec(id ?? '');
    if (!match) {
        return undefined;
    }
    return {
        subscriptionId: match[1],
        resourceGroup: match[2],
        groupName: match[3],
    };
}

export { type AutoSuspendPolicy, type CreateSandboxOptions, type PublicDiskImage, type Sandbox, type SandboxGroup, type SandboxGroupRef, type SandboxLifecycle, type SandboxRef, type Subscription };

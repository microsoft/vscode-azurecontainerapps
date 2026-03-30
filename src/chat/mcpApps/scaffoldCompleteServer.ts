/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    registerAppResource,
    registerAppTool,
    RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";

function createServer(): McpServer {
    const server = new McpServer({
        name: "Azure Container Apps Assistant",
        version: "1.0.0",
    });

    registerScaffoldComplete(server);

    return server;
}

function registerScaffoldComplete(server: McpServer): void {
    const resourceUri = "ui://scaffold-complete/scaffold-complete.html";

    const htmlPath = path.join(__dirname, "scaffoldCompleteApp.html");
    const html = fs.readFileSync(htmlPath, "utf-8");

    let resolveChoice: ((choice: string) => void) | null = null;

    server.tool(
        "report_scaffold_choice",
        "Internal: called by the scaffold complete UI when the user picks an option.",
        { choice: z.string().describe("The action the user chose: 'debug'") },
        async ({ choice }) => {
            if (resolveChoice) {
                resolveChoice(choice);
                resolveChoice = null;
            }
            return { content: [{ type: "text" as const, text: `Choice received: ${choice}` }] };
        },
    );

    registerAppTool(
        server,
        "ask_scaffold_next_step",
        {
            title: "Scaffold Complete",
            description:
                "After scaffolding a project, shows the user a card with the option to set up local development. Returns which option the user chose.",
            inputSchema: {},
            annotations: { readOnlyHint: true },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _meta: { ui: { resourceUri } },
        },
        async () => {
            const choice = await new Promise<string>((resolve) => {
                resolveChoice = resolve;
            });

            return {
                content: [
                    {
                        type: "text" as const,
                        text: "The user chose to set up local development. Help them set up and start a local debug session for their project using the /local-dev skill.",
                    },
                ],
            };
        },
    );

    registerAppResource(
        server,
        resourceUri,
        resourceUri,
        { mimeType: RESOURCE_MIME_TYPE },
        async () => {
            return {
                contents: [
                    {
                        uri: resourceUri,
                        mimeType: RESOURCE_MIME_TYPE,
                        text: html,
                    },
                ],
            };
        },
    );
}

async function main() {
    const server = createServer();
    await server.connect(new StdioServerTransport());
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

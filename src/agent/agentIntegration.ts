/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { OperationalInsightsManagementClient, type Table, type Workspace } from "@azure/arm-operationalinsights";
import { type TokenCredential } from "@azure/core-auth";
import { Durations, LogsQueryClient, LogsQueryResultStatus, type LogsTable } from "@azure/monitor-query";
import { NotSignedInError } from "@microsoft/vscode-azext-azureauth";
// eslint-disable-next-line import/no-internal-modules
import { getSessionFromVSCode } from "@microsoft/vscode-azext-azureauth/out/src/getSessionFromVSCode";
import { type IActionContext } from "@microsoft/vscode-azext-utils";
import * as vscode from "vscode";
import { type QueryAzureResourceGraphResult, type SimpleCommandConfig, type SkillCommandArgs, type SkillCommandConfig } from "vscode-azure-agent-api";
import * as z from "zod";
import { type ContainerAppItem } from "../tree/ContainerAppItem";

type ContainerAppLookupResult = {
    result: "success";
    containerAppDetails: {
        name: string;
        subscriptionId: string;
        resourceGroup: string;
    }
} | {
    result: "none-found";
    argQuery: string | undefined;
} | {
    result: "multiple-found";
    queryResult: QueryAzureResourceGraphResult;
};

type QueryableTable = Omit<Table, "name" | "schema"> & { name: NonNullable<Table["name"]>, schema: NonNullable<Table["schema"]> };
type QueryTaskTableFound = { taskState: "TableFound"; table: QueryableTable; userQuestion: string; };
type QueryTaskGenerateAndRunQueryFailed = Omit<QueryTaskTableFound, "taskState"> & { taskState: "GenerateAndRunQueryFailed", table: QueryableTable; query: undefined; resultRows: undefined; };
type QueryTaskGenerateAndRunQuerySucceeded = Omit<QueryTaskTableFound, "taskState"> & { taskState: "GenerateAndRunQuerySucceeded", table: QueryableTable; query: string; resultRows: LogsTable["rows"]; };
type QueryTaskSummarizationFailed = Omit<QueryTaskGenerateAndRunQuerySucceeded, "taskState"> & { taskState: "SummarizationFailed", table: QueryableTable; query: string; resultRows: LogsTable["rows"]; markdownSummary: undefined; quesetionAnswerSummary: undefined; };
type QueryTaskSummarizationSucceeded = Omit<QueryTaskGenerateAndRunQuerySucceeded, "taskState"> & { taskState: "SummarizationSucceeded", table: QueryableTable; query: string; resultRows: LogsTable["rows"]; markdownSummary: string; userQuestionAnswer: string; };
type QueryTask = QueryTaskTableFound | QueryTaskGenerateAndRunQueryFailed | QueryTaskGenerateAndRunQuerySucceeded | QueryTaskSummarizationFailed | QueryTaskSummarizationSucceeded;

export async function getAgentCommands(): Promise<(SkillCommandConfig | SimpleCommandConfig)[]> {
    return [
        {
            type: "skill",
            name: "queryContainerAppLogs",
            commandId: "containerApps.agentPocSkill",
            displayName: "Query Container App Logs",
            intentDescription: "Good for when users ask for help looking at container app logs, retrieving information from container app logs, querying container app logs, or ask for information that could be found in the logs of their container app.",
        },
        {
            type: "simple",
            name: "deplyWorkspace",
            commandId: "containerApps.fakeDeployWorkspace",
            displayName: "Deploy Workspace to Container App",
            intentDescription: "Good for when users ask to deploy their current workspace to a container app.",
        },
        {
            type: "simple",
            name: "restartContainerApp",
            commandId: "containerApps.fakeRestartContainerApp",
            displayName: "Restart Container App",
            intentDescription: "Good for when users ask to deploy their current workspace to a container app.",
        }
    ];
}

export async function askAgent(_context: IActionContext, item: ContainerAppItem): Promise<void> {
    await vscode.commands.executeCommand("workbench.action.chat.open", { query: `@azure I'd like to talk about my ${item.containerApp.name} container app in my ${item.subscription.name} subscription` });
}

export async function poc(context: IActionContext, args: SkillCommandArgs) {
    const containerAppLookupResult = await lookupContainerApp(context, args);
    if (containerAppLookupResult.result === "none-found") {
        args.agentRequest.responseStream.markdown(`I'm sorry, I couldn't find any container apps that match the criteria you provided.`);
        if (containerAppLookupResult.argQuery !== undefined) {
            args.agentRequest.responseStream.markdown(`I looked for resources using the following Azure Resource Graph query:\n\n\`\`\`kusto\n${containerAppLookupResult.argQuery}\n\`\`\``);
        }
    } else if (containerAppLookupResult.result === "multiple-found") {
        args.agentRequest.responseStream.markdown(`I found multiple container apps that match the criteria you provided:\n\n`);
        await args.agent.verbatimLanguageModelInteraction(
            `Format data from the user a markdown table. Tables should only contain columns for 'Container App Name', and 'Resource Group'. Only return the table itself, do not include any other messages to the user.`,
            { ...args.agentRequest, userPrompt: JSON.stringify(containerAppLookupResult.queryResult.response.data) },
            { includeHistory: "none" }
        );
        args.agentRequest.responseStream.markdown(`\n\nPlease refine your query to be more specific.`);
    } else {
        const containerAppDetails = containerAppLookupResult.containerAppDetails;
        const getCredentialResult = await getTokenCredentialFromContainerAppDetails(args, containerAppDetails);
        if (getCredentialResult === undefined) {
            args.agentRequest.responseStream.markdown(`I'm sorry, I am unable to access a subscription with ID ${containerAppDetails.subscriptionId}.`);
            return;
        }

        args.agentRequest.responseStream.progress(`Connecting to Log Analytics...`);
        const logAnalyticsWorkspace = await getContainerAppLogAnalyticsWorkspace(args, containerAppDetails, getCredentialResult.credential);
        if (logAnalyticsWorkspace === undefined || logAnalyticsWorkspace.name === undefined || logAnalyticsWorkspace.customerId === undefined) {
            args.agentRequest.responseStream.markdown(`I'm sorry, I couldn't connect to the Log Analytics workspace associated with the container app.`);
            return;
        }

        const userQuestion = await getUserQuestion(args);
        const queryTasks: { [tableName: string]: QueryTask } = {};

        const tables = await getContainerAppsTables(containerAppDetails, logAnalyticsWorkspace, getCredentialResult.credential);
        tables.forEach((table) => queryTasks[table.name] = { taskState: "TableFound", table: table, userQuestion: userQuestion });
        if (Object.keys(queryTasks).length === 0) {
            args.agentRequest.responseStream.markdown(`I'm sorry, I couldn't find any Log Analytics tables associated with the container app.`);
            return;
        }

        args.agentRequest.responseStream.progress(`Querying Log Analytics tables...`);
        await Promise.all(Object.entries(queryTasks).map(async ([tableName, queryTask]) => {
            if (queryTask.taskState === "TableFound") {
                const queryResult = await queryContainerAppsTableForUserQuestion(args, logAnalyticsWorkspace, tableName, queryTask.table, queryTask.userQuestion, getCredentialResult.tenantId);
                if (!queryResult) {
                    queryTasks[tableName] = { ...queryTask, taskState: "GenerateAndRunQueryFailed", query: undefined, resultRows: undefined };
                } else {
                    queryTasks[tableName] = { ...queryTask, taskState: "GenerateAndRunQuerySucceeded", query: queryResult.query, resultRows: queryResult.resultRows };
                }
            }
        }));
        if (Object.values(queryTasks).every((v) => v.taskState !== "GenerateAndRunQuerySucceeded")) {
            args.agentRequest.responseStream.markdown(`I'm sorry, I wasn't able to find any recent errors for your ${containerAppDetails.name} container app.`);
            return;
        }

        args.agentRequest.responseStream.progress(`Summarizing query results...`);
        await Promise.all(Object.entries(queryTasks).map(async ([tableName, queryTask]) => {
            if (queryTask.taskState === "GenerateAndRunQuerySucceeded") {
                const markdownTable = (await getQueryResultMarkdownTableSummary(args, queryTask.table, queryTask.resultRows)) || "";
                const questionAnswerSummary = (await getQueryResultQuestionAnswerSummary(args, queryTask.table, queryTask.resultRows, queryTask.userQuestion)) || "";
                if (!markdownTable && !questionAnswerSummary) {
                    queryTasks[tableName] = { ...queryTask, taskState: "SummarizationFailed", markdownSummary: undefined, quesetionAnswerSummary: undefined };
                } else {
                    queryTasks[tableName] = { ...queryTask, taskState: "SummarizationSucceeded", markdownSummary: markdownTable, userQuestionAnswer: questionAnswerSummary };
                }
            }
        }));
        if (Object.values(queryTasks).every((v) => v.taskState !== "SummarizationSucceeded")) {
            args.agentRequest.responseStream.markdown(`I'm sorry, I wasn't able to find any recent errors for your ${containerAppDetails.name} container app.`);
            return;
        }

        args.agentRequest.responseStream.markdown(`Here's some information I have gathered from the logs of your ${containerAppDetails.name} container app:`);
        await Promise.all(Object.entries(queryTasks).map(async ([tableName, queryTask]) => {
            if (queryTask.taskState === "SummarizationSucceeded") {
                if (queryTask.markdownSummary.length > 0) {
                    args.agentRequest.responseStream.markdown(`\n\nFrom the **${tableName}** logs table I found the following:\n\n`);
                    args.agentRequest.responseStream.markdown(queryTask.markdownSummary);
                }
                if (queryTask.userQuestionAnswer.length > 0) {
                    args.agentRequest.responseStream.markdown(`\n\nFor what you're asking about, it looks like the following is happening:\n\n`);
                    args.agentRequest.responseStream.markdown(queryTask.userQuestionAnswer);
                }
                args.agentRequest.responseStream.markdown(`\n\nThe query I used to find this information :\n\n\`\`\`kusto\n${queryTask.query}\n\`\`\``);
                args.agentRequest.responseStream.markdown(`\nIf you'd like to look at these results futher, you can use the above query, or write your own query, in Log Analytics.`);
                args.agentRequest.responseStream.button({ title: "Open Log Analytics", command: "" });
            }
        }));
    }
}

async function lookupContainerApp(context: IActionContext, args: SkillCommandArgs): Promise<ContainerAppLookupResult> {
    try {
        const conversationAsString = await args.agent.getConversationAsString(args.agentRequest);
        const containerAppLookupInfo = await args.agent.getTypeChatTranslation(
            { "ContainerAppLookupInfo": getZodContainerAppInfoSchema() },
            "ContainerAppLookupInfo",
            { ...args.agentRequest, userPrompt: conversationAsString }
        );
        args.agent.outputChannel.debug(`Looking up container app with ContainerAppLookupInfo: ${JSON.stringify(containerAppLookupInfo)}`);
        const argQueryPromptObject = JSON.stringify({ ...containerAppLookupInfo, limit: 5, project: ["name", "subscriptionId", "resourceGroup"] });
        const argQueryResult = await args.agent.queryAzureResourceGraph(context, JSON.stringify(argQueryPromptObject), args.agentRequest);

        if (argQueryResult?.response.count === 0 || argQueryResult?.response.count === undefined) {
            return { result: "none-found", argQuery: argQueryResult?.query };
        } else if (argQueryResult?.response.count > 1) {
            return { result: "multiple-found", queryResult: argQueryResult };
        }

        const unknownPropertyValue = "unknown";
        const dataArray = Array.isArray(argQueryResult?.response.data) ? argQueryResult?.response.data : [];
        const firstData = dataArray.at(0) as object;
        const firstContainerApp: { name: string, subscriptionId: string, resourceGroup: string } = {
            ...{ name: unknownPropertyValue, subscriptionId: unknownPropertyValue, resourceGroup: unknownPropertyValue },
            ...(firstData || {})
        };

        if (Object.values(firstContainerApp).some((value) => value === unknownPropertyValue)) {
            return { result: "none-found", argQuery: argQueryResult?.query };
        }
        return { result: "success", containerAppDetails: firstContainerApp };
    } catch (e) {
        args.agent.outputChannel.error(`Failed to looking up container app: ${JSON.stringify(e)}`);
        return { result: "none-found", argQuery: undefined };
    }
}

function getZodContainerAppInfoSchema() {
    const ContainerAppLookupInfoSchema = z.object({
        resourceType: z.literal("microsoft.app/containerapps"),
        name: z.string().optional(),
        subscriptionId: z.string().optional(),
        subscriptionName: z.string().optional(),
        resourceGroupName: z.string().optional(),
        region: z.string().optional(),
    });
    return ContainerAppLookupInfoSchema;
}

async function getTokenCredentialFromContainerAppDetails(args: SkillCommandArgs, containerAppDetails: { subscriptionId: string }): Promise<{ credential: TokenCredential, tenantId: string } | undefined> {
    const subscriptionProvider = args.agent.subscriptionProvider;
    const isSignedIn = await subscriptionProvider.isSignedIn();
    if (!isSignedIn) {
        await subscriptionProvider.signIn();
    }

    const subscriptions = await subscriptionProvider.getSubscriptions(true);
    const matchingSubscription = subscriptions.find(sub => sub.subscriptionId === containerAppDetails.subscriptionId);
    if (matchingSubscription === undefined || matchingSubscription.credential === undefined || matchingSubscription.tenantId === undefined) {
        return undefined;
    }

    const tokenCredential = matchingSubscription?.credential;
    return { credential: tokenCredential, tenantId: matchingSubscription.tenantId };
}

async function getContainerAppLogAnalyticsWorkspace(args: SkillCommandArgs, containerAppDetails: { subscriptionId: string, resourceGroup: string, name: string }, credential: TokenCredential): Promise<(Workspace & { customerId: string, name: string }) | undefined> {
    try {
        const operationalinsightsManagementClient = new OperationalInsightsManagementClient(credential, containerAppDetails.subscriptionId);
        const contianerAppsClient = new ContainerAppsAPIClient(credential, containerAppDetails.subscriptionId);

        const containerApp = await contianerAppsClient.containerApps.get(containerAppDetails.resourceGroup, containerAppDetails.name);
        const environmentId = containerApp.environmentId;
        const environmentName = environmentId?.split("/").pop();
        if (!environmentName) {
            return undefined;
        }

        const managedEnvironment = await contianerAppsClient.managedEnvironments.get(containerAppDetails.resourceGroup, environmentName);
        const appLogsConfig = managedEnvironment.appLogsConfiguration;

        if (appLogsConfig === undefined || appLogsConfig.destination !== "log-analytics") {
            return;
        } else if (appLogsConfig.destination === "log-analytics") {
            const logAnalyticsConfiguration = appLogsConfig.logAnalyticsConfiguration;
            const customerId = logAnalyticsConfiguration?.customerId;

            const workspaceIterator = operationalinsightsManagementClient.workspaces.list();
            for await (const workspace of workspaceIterator) {
                if (workspace.customerId === customerId && workspace.customerId !== undefined && workspace.name !== undefined) {
                    return workspace as (Workspace & { customerId: string, name: string });
                }
            }
        }
    } catch (e) {
        args.agent.outputChannel.error(`Failed to get Log Analytics workspace: ${JSON.stringify(e)}`);
    }

    return undefined;
}

async function getUserQuestion(args: SkillCommandArgs): Promise<string> {
    const defaultReturnValue = args.agentRequest.userPrompt;
    try {
        const conversationAsString = await args.agent.getConversationAsString(args.agentRequest);
        const copilotResponse = await args.agent.getResponseAsStringLanguageModelInteraction(`You are an expert in analyzing a conversation between an assistant and a user, where the user is asking the assistant a for information about, or question about, their container app for which the answer can be found in the logs of the container app. You will be provided you with the conversation, and you will summarize and extract the information/question that the user is asking. The extracted information/question should refer to the user's container app simply as "my container app". Only respond with the information/question. Do not include any other content in your response. Provide the information/question as if you are the user. For example, do not say "The user wants to know", instead say "I want to know"`, { ...args.agentRequest, userPrompt: conversationAsString });
        return copilotResponse !== undefined && copilotResponse.length > 0 ? copilotResponse : defaultReturnValue;
    } catch (e) {
        args.agent.outputChannel.error(`Failed to get logs question: ${JSON.stringify(e)}`);
        return defaultReturnValue;
    }
}

async function getContainerAppsTables(containerAppDetails: { resourceGroup: string, name: string, subscriptionId: string }, workspace: Workspace & { customerId: string, name: string }, credential: TokenCredential): Promise<QueryableTable[]> {
    // const standardContainerAppTableNames = ["AppRequests", "Usage", "ContainerAppConsoleLogs_CL", "ContainerAppSystemLogs_CL"];
    const standardContainerAppTableNames = ["AppRequests", "ContainerAppSystemLogs_CL"];
    const result: QueryableTable[] = [];
    const operationalinsightsManagementClient = new OperationalInsightsManagementClient(credential, containerAppDetails.subscriptionId);
    const tablesIterator = operationalinsightsManagementClient.tables.listByWorkspace(containerAppDetails.resourceGroup, workspace.name);
    for await (const table of tablesIterator) {
        if (table.name !== undefined && standardContainerAppTableNames.includes(table.name)) {
            if (table.name === "AppRequests" && table.schema?.standardColumns !== undefined) {
                table.schema = { ...table.schema, standardColumns: table.schema?.standardColumns?.filter((c) => c.name !== "RequestId") };
            }
            if (table.schema !== undefined && table.name !== undefined) {
                result.push({ ...table, name: table.name, schema: table.schema } as QueryableTable);
            }
        }
    }
    return result;
}

async function queryContainerAppsTableForUserQuestion(args: SkillCommandArgs, workspace: Workspace & { customerId: string, name: string }, tableName: string, table: QueryableTable, userQuestion: string, tenantId: string): Promise<{ query: string, resultRows: LogsTable["rows"] } | undefined> {
    try {
        const typeChatGetContainerAppLogsTableQueryResult = await args.agent.getTypeChatTranslation(
            { "ContainerAppLogsTableQuery": getZodGetContainerAppLogsQuerySchema() },
            "ContainerAppLogsTableQuery",
            { ...args.agentRequest, userPrompt: `You are an expert in writing kusto queries for logs of container apps. I will give you information which includes: the name and schema of a table which contains logs for my container app, and an information/a question I want answered by information in the logs table. You will then determine if the table is relevant for the information/question I have, and if so, write a kusto query to find any logs in the table which help me find the information/answer the question. The query does not need to worry about time ranges. The query should try to limit what columns are projected to only columns which are helpful to what I am interested in. If I am interested in anything related to errors, problems, or issues, and the table has a column with stack traces, that column should be included. If the table has a generic properties, include that column as well. The query should limit the results to 5 rows. Here is the information: ${JSON.stringify({ tableName: tableName, schema: table.schema, userQuestion: userQuestion })}` }
        );
        const containerAppLogsTableQuery = typeChatGetContainerAppLogsTableQueryResult?.tableIsRelevantForUserQuestion ? typeChatGetContainerAppLogsTableQueryResult.kustoQueryToAnswerQuestion : undefined;
        if (containerAppLogsTableQuery !== undefined) {
            args.agent.outputChannel.debug(`Querying Log Analytics table ${tableName} with query:\n${containerAppLogsTableQuery}`);
            const dataPlaneCredential = {
                getToken: async (scopes?: string | string[]) => {
                    const session = await getSessionFromVSCode(scopes, tenantId, { createIfNone: false, silent: true });
                    if (!session) {
                        throw new NotSignedInError();
                    }
                    return {
                        token: session.accessToken,
                        expiresOnTimestamp: 0
                    };
                }
            }

            const logsQueryClient = new LogsQueryClient(dataPlaneCredential);
            const result = await logsQueryClient.queryWorkspace(workspace.customerId, containerAppLogsTableQuery, { duration: Durations.sevenDays });
            args.agent.outputChannel.debug(`Query result for Log Analytics table ${tableName}: ${JSON.stringify(result)}`);
            if (result.status === LogsQueryResultStatus.Success) {
                const resultRows = result.tables[0]?.rows || [];
                if (resultRows.length > 0) {
                    return { query: containerAppLogsTableQuery, resultRows: result.tables[0]?.rows };
                }
            }
        }
    } catch (e) {
        args.agent.outputChannel.error(`Failed to query Log Analytics table: ${JSON.stringify(e)}`);
    }

    return undefined;
}

function getZodGetContainerAppLogsQuerySchema() {
    const ContainerAppLogsTableQuerySchema = z.union([
        z.object({
            tableIsRelevantForUserQuestion: z.literal(false),
        }),
        z.object({
            tableIsRelevantForUserQuestion: z.literal(true),
            kustoQueryToAnswerQuestion: z.string().optional(),
        })
    ]);
    return ContainerAppLogsTableQuerySchema;
}

async function getQueryResultMarkdownTableSummary(args: SkillCommandArgs, table: Table, resultRows: LogsTable["rows"]): Promise<string | undefined> {
    const copilotResponse = await args.agent.getResponseAsStringLanguageModelInteraction(
        `The user is going to give you a table schema, and rows that were queried from the table. These rows contain information about errors the user is interested in. Create a markdown table representation of these rows to help the user see the error information contained in the rows. The table should only have columns which are helpful for the purpose of identifying and troubleshooting errors. Only return the table itself, do not include any other messages to the user.`,
        { ...args.agentRequest, userPrompt: JSON.stringify({ tableSchema: table.schema, resultRows: resultRows }) },
    );
    if (copilotResponse !== undefined) {
        const containerAppLogsGetMarkdownTableFromQueryResult = await args.agent.getTypeChatTranslation(
            { "ContainerAppLogsGetMarkdownTableFromQueryResult": getZodContainerAppLogsGetMarkdownTableFromQueryResultSchema() },
            "ContainerAppLogsGetMarkdownTableFromQueryResult",
            { ...args.agentRequest, userPrompt: copilotResponse }
        );
        return containerAppLogsGetMarkdownTableFromQueryResult?.maybeMarkdownTable;
    }
    return undefined;
}

function getZodContainerAppLogsGetMarkdownTableFromQueryResultSchema() {
    const ContainerAppLogsGetMarkdownTableFromQueryResultSchema = z.object({
        maybeMarkdownTable: z.string().optional(),
    });
    return ContainerAppLogsGetMarkdownTableFromQueryResultSchema;
}

async function getQueryResultQuestionAnswerSummary(args: SkillCommandArgs, table: Table, resultRows: LogsTable["rows"], userQuestion: string): Promise<string | undefined> {
    const copilotResponse = await args.agent.getResponseAsStringLanguageModelInteraction(
        `The user is going to give you a table schema, rows that were queried from the table, and a question/information that the user wants answered given information contained in the rows. Provide an answer for the user based on the information contained in the rows. Only return the answer, do not include any other content in your response.`,
        { ...args.agentRequest, userPrompt: JSON.stringify({ tableSchema: table.schema, resultRows: resultRows, userQuestion: userQuestion }) },
    );
    return copilotResponse;
}

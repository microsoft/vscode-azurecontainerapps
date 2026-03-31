/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type DeploymentPlanData } from "../../webviews/DeploymentPlanView";
import { DeploymentPlanViewController } from "../../webviews/DeploymentPlanViewController";
import * as vscode from "vscode";

let currentDeploymentPlanViewController: DeploymentPlanViewController | undefined;

const sampleDeploymentPlanData: DeploymentPlanData = {
    status: "Awaiting Approval",
    mode: "MODERNIZE — deploy existing full-stack app to Azure",
    subscription: "meganmott dev",
    location: "East US",
    locationCode: "eastus",
    mermaidDiagram: `graph TD
    Browser -->|HTTPS| SWA[Azure Static Web Apps<br/>React / Vite frontend]
    SWA -->|/api/* proxy| FN[Azure Functions App<br/>Node.js 20 · TypeScript]
    FN -->|Managed Identity| KV[Azure Key Vault<br/>Cosmos connection string]
    FN -->|Cosmos SDK| DB[(Azure Cosmos DB<br/>NoSQL · Serverless)]

    style SWA fill:#0078d4,color:#fff
    style FN fill:#0078d4,color:#fff
    style KV fill:#0078d4,color:#fff
    style DB fill:#0078d4,color:#fff`,
    workspaceScan: {
        headers: ["Component", "Technology", "Azure Target"],
        rows: [
            ["src/web", "React 18, Vite, TypeScript", "Azure Static Web Apps"],
            ["src/functions", "Azure Functions v4, Node.js, TypeScript", "Azure Functions (linked to SWA)"],
            ["src/shared", "TypeScript library", "Built + bundled (no separate service)"],
            ["Cosmos DB", "@azure/cosmos SDK, connection string env var", "Azure Cosmos DB for NoSQL (serverless)"],
            ["Web → API routing", "Vite /api proxy in dev", "SWA native /api proxy at runtime"],
        ],
    },
    decisions: {
        headers: ["Decision", "Choice", "Rationale"],
        rows: [
            ["Recipe", "AZD + Bicep", "Both tools installed; AZD is the recommended default for end-to-end deploy"],
            ["Functions plan", "Consumption", "Cost-efficient for low-to-medium workloads"],
            ["Cosmos DB capacity", "Serverless", "No sustained throughput; ideal for dev/compliance calendar usage"],
            ["Frontend hosting", "Azure Static Web Apps (SWA)", "Native Vite/React support; built-in /api proxy to linked Functions app"],
            ["Secrets", "Key Vault + SWA/Functions app settings", "Cosmos connection string stored in Key Vault; referenced via @Microsoft.KeyVault(...)"],
            ["Identity", "System-assigned Managed Identity on Functions app", "Grants Functions access to Key Vault without storing credentials in config"],
        ],
    },
    resources: {
        headers: ["Resource", "Name pattern", "SKU / Tier"],
        rows: [
            ["Resource Group", "rg-compliance-<env>", "—"],
            ["Static Web Apps", "swa-compliance-<env>", "Free"],
            ["Functions App", "func-compliance-<env>", "Consumption (Y1)"],
            ["App Service Plan", "asp-compliance-<env>", "[Consumption — auto-created by Functions]"],
            ["Storage Account", "stcompliance<env>", "Standard LRS (required by Functions)"],
            ["Cosmos DB account", "cosmos-compliance-<env>", "Serverless, NoSQL"],
            ["Key Vault", "kv-compliance-<env>", "Standard"],
            ["Log Analytics Workspace", "log-compliance-<env>", "PerGB2018"],
            ["Application Insights", "appi-compliance-<env>", "—"],
        ],
    },
};

export function openDeploymentPlanView(): void {
    if (currentDeploymentPlanViewController) {
        currentDeploymentPlanViewController.updateDeploymentPlanData(sampleDeploymentPlanData);
        currentDeploymentPlanViewController.revealToForeground(vscode.ViewColumn.Active);
        return;
    }

    currentDeploymentPlanViewController = new DeploymentPlanViewController(sampleDeploymentPlanData);
    currentDeploymentPlanViewController.revealToForeground(vscode.ViewColumn.Active);

    currentDeploymentPlanViewController.panel.onDidDispose(() => {
        currentDeploymentPlanViewController = undefined;
    });
}

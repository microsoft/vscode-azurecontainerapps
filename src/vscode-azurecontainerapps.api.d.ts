import { type IActionContext } from "@microsoft/vscode-azext-utils";

export interface DeployWorkspaceProjectApiOptionsContract {
    // Existing resources
    subscriptionId?: string;
    resourceGroupId?: string;

    // Workspace deployment paths (absolute fs path)
    rootPath?: string;
    srcPath?: string;
    dockerfilePath?: string;

    // Options
    skipContainerAppCreation?: boolean;
    shouldSaveDeploySettings?: boolean;
}

export interface DeployWorkspaceProjectResults {
    resourceGroupId?: string;
    logAnalyticsWorkspaceId?: string;
    managedEnvironmentId?: string;
    containerAppId?: string;

    // ACR
    registryId?: string;
    registryLoginServer?: string;
    registryUsername?: string;
    registryPassword?: string;
    imageName?: string;
}

export declare function deployWorkspaceProjectApi(context: IActionContext, deployWorkspaceProjectOptions: DeployWorkspaceProjectApiOptionsContract): Promise<DeployWorkspaceProjectResults>;

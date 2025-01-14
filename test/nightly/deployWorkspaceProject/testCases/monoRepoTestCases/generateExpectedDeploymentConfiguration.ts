import * as path from "path";
import { type DeploymentConfigurationSettings } from "../../../../../extension.bundle";
import { type StringOrRegExpProps } from "../../../../typeUtils";

export function generateExpectedDeploymentConfiguration(sharedResourceName: string, acrResourceName: string, appResourceName: string): StringOrRegExpProps<DeploymentConfigurationSettings> {
    return {
        label: appResourceName,
        type: 'AcrDockerBuildRequest',
        dockerfilePath: path.join(appResourceName, 'Dockerfile'),
        srcPath: appResourceName,
        envPath: path.join(appResourceName, '.env.example'),
        resourceGroup: sharedResourceName,
        containerApp: appResourceName,
        containerRegistry: new RegExp(`${acrResourceName}.{6}`, 'i'),
    };
}

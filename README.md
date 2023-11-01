# Azure Container Apps for Visual Studio Code

<!-- region exclude-from-marketplace -->

[![Version](https://img.shields.io/visual-studio-marketplace/v/ms-azuretools.vscode-azurecontainerapps.svg)](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurecontainerapps) [![Installs](https://img.shields.io/visual-studio-marketplace/i/ms-azuretools.vscode-azurecontainerapps.svg)](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurecontainerapps) [![Build Status](https://dev.azure.com/ms-azuretools/AzCode/_apis/build/status/vscode-azurecontainerapps?branchName=main)](https://dev.azure.com/ms-azuretools/AzCode/_build/latest?definitionId=39&branchName=main)


<!-- endregion exclude-from-marketplace -->

Use the Azure Containers extension to quickly create and deploy containerized apps directly from VS Code. Check out the [Azure Samples repository](https://aka.ms/ContainerAppsSamples) to view sample projects.

> Sign up today for your free Azure account and receive 12 months of free popular services, $200 free credit and 25+ always free services 👉 [Start Free](https://azure.microsoft.com/free/open-source).

## Support for [vscode.dev](https://vscode.dev/)

![Create a quickstart container app with vscode.dev](resources/readme/vscode_dev_demo.gif)

The Azure Container Apps extension now supports running on [vscode.dev](https://vscode.dev/) and [github.dev](http://github.dev/).  This means you can use the extension to manage your resources directly from the browser!

The following functionalities are not supported in the web version of the extension:
- Deploying to ACA through the Docker extension
- Deploying via `Build from project remotely using Azure Container Registry`

## Create your first container app

Please follow this great onboarding [tutorial](https://aka.ms/container-apps/vscode) to create your first container app!


<!-- region exclude-from-marketplace -->

## Deploy Project from Workspace

We've introduced a new command to simplify the process of deploying a local workspace project to a container app!  By analyzing your project directory, we automatically detect any Dockerfiles and generate all the necessary Azure resources required for creating a containerized application (monorepo support coming soon).  Some steps may be omitted based on the state of your workspace project.

1.  Navigate to the `Azure` view and select the `Deploy Project from Workspace...` button in the local workspace section:

    <img src='resources/readme/deploy-workspace-project.png' alt='Select the Deploy Project from Workspace button' width=700px />

    _(If you do not have a workspace project open, you will be prompted to open one and restart the command)_

1.  If prompted, select a Dockerfile.

1.  Select or create a container apps environment.

1.  Confirm modal popup of resources to be created.

1.  If prompted, provide a name to be used to create new resources.

1.  If prompted, select an environment variables file.

1.  If prompted, select a location where new resources will be created.

1.  Choose to save the deployment configuration in your workspace project settings.

    _(These can be used later for easy re-deployment)_

<br />

__Expand the activity log for a summary of the results__:

<img src='resources/readme/deploy-workspace-project-activity.png' alt='Deploy Project from Workspace activity log' width=700px />

<br />

__Note__: We also have entry-points on the container apps environment item (`Create Container App from Workspace`) and the container app item (`Deploy Workspace to Container App`).  These commands can be used to automatically target project deployment to existing resources.

## Contributing

There are a couple of ways you can contribute to this repo:

* **Ideas, feature requests and bugs**: We are open to all ideas and we want to get rid of bugs! Use the Issues section to either report a new issue, provide your ideas or contribute to existing threads.
* **Documentation**: Found a typo or strangely worded sentences? Submit a PR!
* **Code**: Contribute bug fixes, features or design changes:
  * Clone the repository locally and open in VS Code.
  * Run "Extensions: Show Recommended Extensions" from the [command palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) and install all extensions listed under "Workspace Recommendations"
  * Open the terminal (press <kbd>CTRL</kbd>+ <kbd>\`</kbd>) and run `npm install`.
  * To build, press <kbd>F1</kbd> and type in `Tasks: Run Build Task`.
  * Debug: press <kbd>F5</kbd> to start debugging the extension.

### Legal

Before we can accept your pull request you will need to sign a **Contribution License Agreement**. All you need to do is to submit a pull request, then the PR will get appropriately labelled (e.g. `cla-required`, `cla-norequired`, `cla-signed`, `cla-already-signed`). If you already signed the agreement we will continue with reviewing the PR, otherwise system will tell you how you can sign the CLA. Once you sign the CLA all future PR's will be labeled as `cla-signed`.

### Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

<!-- endregion exclude-from-marketplace -->

## Telemetry

VS Code collects usage data and sends it to Microsoft to help improve our products and services. Read our [privacy statement](https://go.microsoft.com/fwlink/?LinkID=528096&clcid=0x409) to learn more. If you don’t wish to send usage data to Microsoft, you can set the `telemetry.enableTelemetry` setting to `false`. Learn more in our [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

## Lifecycle

The Azure Container Apps extension for VS Code follows the [Modern Lifecycle Policy](https://docs.microsoft.com/lifecycle/policies/modern). Follow instructions [here](https://code.visualstudio.com/docs/editor/extension-gallery) to get the latest updates of the extension.

## License

[MIT](LICENSE.md)

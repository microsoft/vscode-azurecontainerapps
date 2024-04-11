# Azure Container Apps for Visual Studio Code



Use the Azure Containers extension to quickly create and deploy containerized apps directly from VS Code. Check out the [Azure Samples repository](https://aka.ms/ContainerAppsSamples) to view sample projects.

> Sign up today for your free Azure account and receive 12 months of free popular services, $200 free credit and 25+ always free services 👉 [Start Free](https://azure.microsoft.com/free/open-source).

## Create your first container app

Use the `Deploy Project from Workspace...` command to simplify the process of deploying a local workspace project to a container app!  By analyzing your project directory, we automatically detect any Dockerfiles and generate all the necessary Azure resources required for creating a containerized application (monorepo support now included!).

Please follow our onboarding walkthrough to get started. You can access the walkthrough using either of the following methods:
* Click the workspace container apps icon and run `Open Walkthrough`

    <img height="200px" src="resources/readme/getting-started-walkthrough.png">

* Open through the command palette `F1 > Azure Container Apps: Open Walkthrough`


You can re-run the command with your saved workspace settings to quickly re-deploy your project to any previously saved Azure resources.

__Note__: We also have entry-points on the container apps environment item (`Create Container App from Workspace`) and the container app item (`Deploy Workspace to Container App`).  These commands offer an alternative way to quickly target project deployment to existing resources.

## Edit and deploy your app

_Draft support has only been added for these actions: Scaling commands, Update Container Image..., Edit Container App (Advanced)_

1. Make a supported edit to your container app. In this example we will be editing the scaling range.
1. Changes made to your container app will be reflected by the appended "*" and the "Unsaved changes" tag added to the container app

    ![unsavedChanges](resources/readme/unsavedChanges.png)

1. More changes can be made and deployed together!
1. Deploy these changes to your container app by clicking the cloud icon located next to your container app

    ![deployDraft](resources/readme/deployDraft.png)
1. Once your deployment has completed your changes should accurately be reflected in the Azure view!



## Telemetry

VS Code collects usage data and sends it to Microsoft to help improve our products and services. Read our [privacy statement](https://go.microsoft.com/fwlink/?LinkID=528096&clcid=0x409) to learn more. If you don’t wish to send usage data to Microsoft, you can set the `telemetry.enableTelemetry` setting to `false`. Learn more in our [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

## Lifecycle

The Azure Container Apps extension for VS Code follows the [Modern Lifecycle Policy](https://docs.microsoft.com/lifecycle/policies/modern). Follow instructions [here](https://code.visualstudio.com/docs/editor/extension-gallery) to get the latest updates of the extension.

## License

[MIT](LICENSE.md)

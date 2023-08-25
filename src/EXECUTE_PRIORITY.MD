# Execute Step Priority

## I. Create/Update/Deploy

When creating resources, execute steps should occupy certain priority ranges to ensure creation happens in the required order.
Keep 0 - 190 clear for Azure Tools common execute steps (e.g. VerifyProvidersStep, ResourceGroupCreateStep, etc.).

### 1. Managed Environment

<b>Priority Range</b>: 200 - 290

#### Steps

- LogAnalyticsCreateStep: 220
- ManagedEnvironmentCreateStep: 250

### 2. Azure Container Registry

<b>Priority Range</b>: 300 - 390

#### Steps

- RegistryCreateStep: 350

### 3. Image Source

<b>Priority Range</b>: 400 - 490

#### Build Image in Azure Steps

- TarFileStep: 420
- UploadSourceCodeStep: 430
- RunStep: 440
- BuildImageStep: 450
- ContainerRegistryImageConfigureStep: 470
- ContainerAppUpdateStep: 480 (temporary, only gets called when a container app already exists)

#### Container Registry Steps

- ContainerRegistryImageConfigureStep: 470
- ContainerAppUpdateStep: 480 (temporary, only gets called when a container app already exists)

### 4. Environment Variables

<b>Priority Range</b>: 500 - 590

#### Steps

Reserved

### 5. Ingress

<b>Priority Range</b>: 600 - 690

#### Steps

- EnableIngressStep: 650
- DisableIngressStep: 650

- TargetPortUpdateStep: 650 (single command only)
- ToggleIngressVisibilityStep: 650 (single command only)

### 6. Container App

<b>Priority Range</b>: 700 - 790

#### Steps

ContainerAppCreateStep: 750

### 7. Unallocated Space

<b>Priority Range</b>: 800 - 1390

#### Steps

Reserved for other commands TBD: Scaling, secrets, revision, logstream, GitHub, etc.

### 8. Deploy

<b>Priority Range</b>: 1400 - 1490

#### Steps

DeployRevisionDraftStep: 1450
DeployWorkspaceProjectSaveSettingsStep 1480

## II. Delete Steps

When deleting, resources typically the priority ranges will change as the dependencies are inverted when compared to the create steps.

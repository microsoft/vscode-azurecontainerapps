# Execute Step Priority

## I. Create, Update, or Deploy

When creating or updating resources, execute steps should occupy certain priority ranges to ensure creation happens in the required sequential order.
0 - 190 should be kept clear for Azure Tools common execute steps (e.g. VerifyProvidersStep, ResourceGroupCreateStep, etc.).

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

#### Container Registry Steps

- ContainerRegistryImageConfigureStep: 470

#### Common Steps

- ContainerAppUpdateStep: 480 (Todo - investigate decoupling this command from imageSource when revision draft update support is added)

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

- ContainerAppCreateStep: 750

### 7. Secrets

<b>Priority Range</b>: 800 - 890

#### Steps

- SecretCreateStep: 820
- SecretDeleteStep: 850
- SecretUpdateStep: 850

### 8. Unallocated Space

<b>Priority Range</b>: 900 - 1090

#### Steps

- Reserved for future commands TBD.

### 9. Scaling

<b>Priority Range</b>: 1100 - 1190

#### Steps

- AddScaleRuleStep: 1120

### 10. Unallocated Space

<b>Priority Range</b>: 1200 - 1390

#### Steps

- Reserved for future commands TBD.

### 11. Deploy

<b>Priority Range</b>: 1400 - 1490

#### Steps

- DeployRevisionDraftStep: 1450

## II. Delete Steps

When deleting, resources typically the priority ranges will change as the dependencies are inverted when compared to the create steps.

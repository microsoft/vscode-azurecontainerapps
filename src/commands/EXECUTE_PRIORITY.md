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

<b>Priority Range</b>: 300 - 350

#### Steps

- RegistryCreateStep: 350

### 3. Identity

<b>Priority Range</b>: 400 - 490

#### Steps

- EmptyContainerAppCreateStep: 420
- SystemAssignedIdentityEnableStep: 430

### 4. Image

<b>Priority Range</b>: 500 - 590

#### General Steps
##### Build Image in Azure Steps

- TarFileStep: 510
- UploadSourceCodeStep: 520
- RunStep: 530
- BuildImageStep: 540
- ContainerRegistryImageConfigureStep: 550
- ContainerRegistryEnableAcrPullStep: 560

##### Container Registry Steps

- ContainerRegistryImageConfigureStep: 550
- ContainerRegistryEnableAcrPullStep: 560

#### `updateImage` Steps

- UpdateRegistryAndSecretsStep: 570
- UpdateImageDraftStep: 590 (revision draft)

### 5. Container App

<b>Priority Range</b>: 600 - 690

#### Steps

- ContainerAppUpdateStep: 650

### 6. Ingress

<b>Priority Range</b>: 700 - 790

#### Steps

- EnableIngressStep: 750 (update existing container app)
- DisableIngressStep: 750 (update existing container app)

- TargetPortUpdateStep: 750 (single command only)
- ToggleIngressVisibilityStep: 750 (single command only)

### 7. Secrets

<b>Priority Range</b>: 800 - 890

#### Steps

- SecretCreateStep: 820
- SecretUpdateStep: 850

### 8. Unallocated Space

<b>Priority Range</b>: 900 - 1090

#### Steps

- Reserved for future commands TBD.

### 9. Scaling

<b>Priority Range</b>: 1100 - 1190

#### Steps

- AddScaleRuleStep: 1120 (revision draft)

### 10. Unallocated Space

<b>Priority Range</b>: 1200 - 1390

#### Steps

- Reserved for future commands TBD.

### 11. Deploy

<b>Priority Range</b>: 1400 - 1490

#### Steps

- DeployRevisionDraftStep: 1450

## II. Delete Steps

TBD...
Note: When deleting resources, typically the priority ranges will change as the dependencies are inverted when compared to the create steps.

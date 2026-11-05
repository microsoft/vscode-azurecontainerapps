---
applyTo: "src/commands/revision/**/*.ts,src/commands/revisionDraft/**/*.ts,src/commands/editContainer/**/*.ts,src/commands/editContainerApp.ts,src/commands/environmentVariables/**/*.ts,src/commands/secret/**/*.ts,src/commands/scaling/**/*.ts,src/commands/ingress/**/*.ts,src/commands/updateContainerApp.ts,src/tree/ContainerAppItem.ts,src/tree/containers/**/*.ts,src/tree/configurations/**/*.ts,src/tree/scaling/**/*.ts,src/tree/revisionManagement/**/*.ts,src/utils/revisionDraftUtils.ts"
---

# Revision drafts and app configuration

- Container Apps `configuration` and revision `template` are different scopes.
  Ingress, secrets, and registry credentials are app configuration; containers,
  environment variables, and scale settings belong to templates. Follow each
  command's live-versus-draft path rather than making every edit an immediate
  ARM update or staging every app-level change in a template.
- Reuse `RevisionDraftUpdateBaseStep` and `revisionDraftUtils` editability guards.
  Copy the base template when starting an edit; never mutate cached SDK/tree
  objects. Preserve unrelated containers, environment variables, resources, and
  scale rules, including when a container has index zero.
- `RevisionDraftFileSystem` stores one in-memory template draft per app, not per
  revision. Preserve its URI lookup, base revision, timestamps/size, filesystem
  events, command/direct-update counters, editor opening/closing, and tree
  notifications. These are virtual files, not paths to write into the workspace.
- Single-mode drafts start from the app template; multiple-mode revision drafts
  may start from the chosen revision. Keep dirty checks and menu context values
  consistent across app, revision draft, container, and scaling nodes. Follow
  [Express compatibility instructions](express-compatibility.instructions.md)
  for template comparisons, staged registry configuration, and revision-mode
  constraints.
- `deployRevisionDraft` validates unsaved changes, prompts, executes the ARM
  update, and only then discards the draft and refreshes the environment tree.
  Preserve drafts on failure/cancellation and single/multiple-mode behavior.
  Do not equate saving the virtual JSON document with deployment.
- Normal app GET responses omit secret values.
  `getContainerEnvelopeWithSecrets` deep-copies the app and lists secrets before
  configuration-preserving mutations. Reuse this pattern where needed.
  `updateContainerApp` preserves location when given an explicit update payload;
  it does not perform a general deep merge of omitted configuration.
- Environment variables use either `value` or `secretRef`. Preserve conversion,
  reference selection, masking, and explicit visibility behavior. Conversion
  can create a real app-level secret while editing a draft reference; do not
  imply that discarding the draft rolls back the secret.
- Ingress input distinguishes `undefined` (not decided) from `false` (disable).
  Preserve Dockerfile EXPOSE inference, `alwaysPromptIngress`, internal/external
  visibility, existing target ports, and default-port validation. Missing
  Dockerfile input is not the same as a Dockerfile with no exposed ports.
- Revision activation, deactivation, restart, and single/multiple mode changes
  are service operations, not filesystem edits. Preserve their guards,
  confirmations, and refresh paths; do not infer App Service slot semantics.

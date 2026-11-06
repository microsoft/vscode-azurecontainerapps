---
applyTo: "src/commands/logStream/**/*.ts,src/commands/openConsoleInPortal.ts,src/commands/openContainerAppsPortal.ts,src/tree/LogsGroupItem.ts,src/webviews/**/*.ts,src/webviews/**/*.tsx,src/webviews/**/*.scss,src/commands/copilot/**/*.ts"
---

# Log streams, confirmation views, and Copilot

- Log streaming selects a revision, replica, and container before requesting the
  app token and container-provided log endpoint. Preserve that selection and
  the subscription/resource context; app names alone are not globally unique.
- `logStreamRequest.ts` tracks streams by container/endpoint identity. Preserve
  duplicate-start behavior, output-channel reuse, connected state, explicit
  stop, abort signals, and removal of stream listeners. New listeners and
  channels must belong to a lifecycle rather than survive indefinitely.
- The log request deliberately enables cross-origin redirects for its
  service-provided data-plane endpoint. Do not remove that option as incidental
  cleanup or apply it indiscriminately to unrelated authenticated requests.
  Never log the auth token or forward it to arbitrary hosts.
- Customer log chunks belong in the explicit log output flow, not telemetry,
  new error payloads, or generated chat prompts. `LogsGroupItem` also offers
  portal logs; `openConsoleInPortal.ts` opens a portal blade, not an
  extension-managed terminal, debugger, or exec session.
- Webviews have React components, extension-server controllers, shared state,
  and channel/transport helpers. Keep both sides of message/state changes
  aligned; validate new message payloads before privileged host operations.
  Use the existing controller/transport rather than a parallel messaging stack.
- Preserve webview resource URIs, local resource roots, CSP/nonce handling, and
  controller disposal. Do not fix rendering by broadly relaxing CSP or enabling
  remote script execution. Keep new UI strings localized following the surface's
  existing approach.
- `OpenConfirmationViewStep` translates confirm/edit/cancel into wizard
  continuation, `GoBackError`, or `UserCancelledError`. Preserve
  `SharedViewState` reset/panel ownership and dependent-pick invalidation.
  Closing a panel must not implicitly authorize deployment.
- Copilot deployment replaces `context.ui` with shared Copilot input and uses
  the existing command callback path. Preserve resource identity, supported
  image-source limitations, confirmation, and switching back to manual input
  when editing. Do not expand an AI-generated choice into new user authority.
- Confirmation-view chat explanations are a deliberate user-triggered flow.
  Do not include secrets, registry credentials, `.env` contents, or whole app
  envelopes in newly generated explanation prompts or initial webview state.

# Azure Container Apps Express explained

Reference notes from October 23, 2026. Feature availability can change; see the official sources below for the current supported capabilities.

## What problems does Express solve?

Express reduces two different waits: deploying an app for the first time, and waking it up after it scales to zero. Faster environment creation is only the first part.

| Problem with standard Container Apps | What Express changes |
| --- | --- |
| You must provision an environment before deploying your first app. | Uses a lightweight environment backed by pre-provisioned capacity. The Express portal creates the environment for you. |
| An idle app can take time to become ready when a request arrives. | Uses prewarmed pools and a streamlined data plane to improve scale-from-zero startup. |
| Avoiding cold starts often means keeping a replica running. | Makes scaling to zero more practical for latency-sensitive, intermittent HTTP workloads. |
| Deploying a simple API requires choosing among infrastructure and platform settings. | Provides a smaller configuration set with defaults aimed at HTTP apps. |

Microsoft says Express is built on Azure Container Apps Sandboxes. The Express FAQ attributes the provisioning and cold-start improvements to a new architecture with pre-provisioned capacity and a streamlined data plane. Express is not just the standard creation wizard with fewer fields.

The two speed improvements affect different parts of the app lifecycle:

- **Environment provisioning speed** affects how quickly you can create a new deployment.
- **Scale-from-zero speed** affects the first user request after an existing app has been idle.

The second improvement matters for sporadically used APIs, dashboards, MCP servers, and agent endpoints. Standard Container Apps already supports scale-to-zero. Express aims to make the wake-up penalty smaller, reducing the need to keep a replica running solely to avoid that penalty.

Microsoft advertises subsecond scale-from-zero startup. That should not be read as a guarantee that an application answers in under a second. Application initialization and dependency connections can still take time.

## What happens to the environment?

Express still uses a `Microsoft.App/managedEnvironments` resource. Its role is a lightweight, fully managed grouping for apps rather than an infrastructure boundary you provision and configure in the standard model.

The creation experience depends on the tool:

- The Express portal creates and manages the environment for you.
- With the Azure CLI, you first create an Express environment, then deploy the app into it.

Keeping the environment resource preserves the familiar Container Apps resource model for SDKs, CLI commands, and infrastructure as code.

## Are the two Standard options the same?

Yes. Standard in the Azure portal and Standard in the Express portal select the same standard Container Apps environment model. The portals can apply different defaults.

The resource snapshots in this directory show:

| Creation path | Environment `environmentMode` | App ingress `transport` |
| --- | --- | --- |
| [Azure portal, Standard](std/README.md) | `"WorkloadProfiles"` | `"Auto"` |
| [Express portal, Standard](std-express/README.md) | `"WorkloadProfiles"` | `"Auto"` |
| [Express portal, Express](express/README.md) | `"Express"` | `"Http"` |

The portal you use and the environment mode you select are separate choices. Creating a Standard app through the Express portal does not give it the Express runtime architecture.

Differences in default images, replica limits, or logging settings do not make it a separate Standard tier. See [comparisons.md](comparisons.md) for the observed configuration differences.

Also, `"WorkloadProfiles"` does not imply dedicated compute. Both Standard examples use a Consumption workload profile.

## What does `"transport": "http"` introduce?

The `transport` field already existed. It configures ingress protocol handling. The Express snapshot returns `"Http"` rather than the `"Auto"` value in the Standard snapshots.

Express supports HTTP ingress, but currently does not support HTTP/2 or TCP ingress. The observed `"Http"` value is consistent with that focused HTTP configuration. It should not be treated as a selector for the Express environment architecture.

In particular, it does not mean:

- HTTP support is new to Container Apps. Standard Container Apps already supports HTTP ingress.
- The public endpoint uses unencrypted HTTP. The Express snapshot has `"allowInsecure": false`, and Express does not support insecure HTTP ingress.
- Setting `transport` alone turns a Standard app into Express.

The environment's `environmentMode` selects Express. The app's ingress `transport` describes protocol handling.

## What is the tradeoff?

Express optimizes for HTTP applications that start, serve requests, and scale down again. It offers fewer capabilities and configuration choices than Standard.

At the time of these notes, unsupported capabilities include HTTP/2 and TCP ingress, sidecars, Dapr, Container Apps jobs, GPU compute, custom domains, and multiple-revision traffic splitting.

Express can run production workloads that fit its supported capabilities. Standard remains the option for workloads that need the broader feature set or finer control over compute and networking.

Express uses the existing Container Apps consumption pricing model and consumption free grant. Scale-to-zero and consumption billing are not new; faster provisioning and faster scale-from-zero are the main architectural improvements.

## Official sources

- [Express overview](https://learn.microsoft.com/en-us/azure/container-apps/express-overview): deployment model, supported capabilities, limitations, and regions.
- [Express FAQ](https://learn.microsoft.com/en-us/azure/container-apps/express-faq): architecture, Sandboxes, cold starts, environment behavior, and pricing.
- [Container Apps ingress overview](https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview): HTTP and TCP ingress concepts.
- [Container Apps networking](https://learn.microsoft.com/en-us/azure/container-apps/networking#http-edge-proxy-behavior): ingress transport and HTTP proxy behavior.

# Servly Edge

`servly-edge` is the public reverse-tunnel origin for Servly Nodes. A node makes
one outbound encrypted WebSocket connection to this service; the edge then
forwards requests through that connection to the workload's loopback port. A
local router port or inbound connection to the user's network is not required.

Generated `node-*.servly.app` traffic follows this path:

```text
Browser -> CloudFront -> servly-edge -> outbound node tunnel -> local workload
```

CloudFront owns the wildcard certificate. The edge can run in any AWS region or
on a WebSocket-capable host such as Railway because it does not need a Servly
certificate of its own.

## Environment

Required environment variables:

- `SERVLY_API_INTERNAL_URL`: an API URL reachable from the edge service.
- `SERVLY_ERROR_PAGE_BASE_URL`: optional browser-reachable API base URL used for
  branded error pages. Defaults to `SERVLY_API_INTERNAL_URL`.
- `NODE_GATEWAY_SHARED_SECRET`: same value as the API node gateway secret.
- `EDGE_ORIGIN_SHARED_SECRET`: same value as the API's
  `DEPLOYMENT_DOMAIN_ORIGIN_SHARED_SECRET`.
- `EDGE_ADDR`: optional listen address. When omitted, the service uses the
  platform-provided `PORT`, then falls back to `8082`.

The edge exposes:

- `/health` for platform health checks.
- `/v1/agents/tunnel` for node WebSocket connections.
- all other paths as CloudFront-authenticated workload traffic.

Do not expose workload proxying without `EDGE_ORIGIN_SHARED_SECRET`. Direct
requests which do not carry CloudFront's secret header are rejected.

The edge only replaces failures that occur before a workload returns a valid
HTTP response. Status pages returned by the deployed application itself,
including custom 404 and 500 pages, pass through unchanged.

## API Configuration

Point both node enrollment and CloudFront routing to the same public edge:

```env
DEPLOYMENT_NODE_EDGE_ORIGIN_DOMAIN_NAME=edge.example-host.com
DEPLOYMENT_NODE_EDGE_ORIGIN_HOST_HEADER=edge.example-host.com
DEPLOYMENT_NODE_EDGE_ORIGIN_PROTOCOL=https
DEPLOYMENT_NODE_EDGE_ORIGIN_PORT=443
NODE_EDGE_PUBLIC_URL=wss://edge.example-host.com/v1/agents/tunnel
```

The origin hostname must not include `https://`. Set the origin host header for
hosted platforms such as Railway. Leave it empty when an ALB listener routes on
the original `node-*.servly.app` viewer hostname. Existing desktop installations
receive `NODE_EDGE_PUBLIC_URL` during enrollment or re-enrollment. The desktop
also retains an advanced manual edge setting for recovery.

When `DEPLOYMENT_DOMAIN_ROUTING_MODE=cloudfront_edge`, the API publishes each
ready node workload into the existing CloudFront KeyValueStore. No per-node DNS
record, Route53 change, regional certificate, ngrok tunnel, or manual ALB target
registration is needed.

## Deployment

For Railway, set the service root to `apps/edge` and let it build the included
Dockerfile. Add the required environment values and use `/health` as the health
check. The public Railway hostname becomes the values shown above.

[`cloudformation.yaml`](./cloudformation.yaml) remains available when the edge
is hosted as a single-task ECS/Fargate service behind an existing ALB. Keep one
edge replica in v1 because tunnel sessions are currently stored in process
memory; horizontal scaling requires shared session routing or node affinity.

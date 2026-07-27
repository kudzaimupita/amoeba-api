# Servly Node Gateway

The gateway owns persistent outbound node connections. It does not store user credentials or expose arbitrary host commands.

Required environment variables:

- `SERVLY_API_INTERNAL_URL` — API origin, for example `http://localhost:3000`.
- `NODE_GATEWAY_SHARED_SECRET` — must match the API setting.
- `GATEWAY_ADDR` — optional listen address, default `:8081`.

The API must also set `SERVLY_NODES_ENABLED=true`, the same `NODE_GATEWAY_SHARED_SECRET`, and `NODE_GATEWAY_INTERNAL_URL` pointing back to this gateway's internal HTTP origin.

For local development, run `npm run dev:gateway` from the API repository root. This loads the same `.env` file as the API and prevents the internal shared secrets from drifting. Agents connect to `/v1/agents/connect`.

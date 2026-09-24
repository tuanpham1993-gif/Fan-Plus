# Optional local Docker scaffold

These Docker files were authored, not executed here. First verify a normal Flask/MySQL setup and resolve dependency versions. The included frontend is still a local data simulator, even when Flask serves it.

Create `infra/.env.local` from `.env.example`, use different random URL-safe values, then from the project root:

```bash
docker compose --env-file infra/.env.local -f infra/compose.local.yaml up --build
docker compose --env-file infra/.env.local -f infra/compose.local.yaml exec backend python -m flask --app wsgi:app seed-demo
```

The local backend is bound to 127.0.0.1:5000; database/Redis have no host-published ports. The sample runs migrations before one local backend process. In production, run migrations as a separate controlled job, configure HTTPS/secrets/trusted hosts, use shared persistent rate limiting as required and verify proxy trust, readiness, backups and restores. Do not scale replicas with this startup-migration command.

MySQL data is stored in a named volume. The local mail directory is container-local in this sample; inspect it inside the container or deliberately mount a restricted directory. It is not served to the browser. Do not use `down -v` on data you need to retain.

Resource choices are development defaults, not performance or reliability guarantees.

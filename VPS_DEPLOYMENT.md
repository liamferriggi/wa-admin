# WA Admin — VPS Deployment

## Deploy Path
```
/opt/wa-admin/
```

## Domain
```
wa-admin.infinite-fusion.com
```

## Steps

1. SSH into VPS1:
```bash
ssh -i ~/.ssh/infinite_fusion_vps -J root@158.220.105.29 root@37.60.251.49
```

2. Clone / copy project:
```bash
mkdir -p /opt/wa-admin
cd /opt/wa-admin
# scp or git clone your project here
```

3. Create .env from example:
```bash
cp .env.example .env
nano .env
# Set VITE_API_URL and VITE_API_KEY
```

4. Build and start:
```bash
docker compose up -d --build
```

5. Verify container is running:
```bash
docker ps | grep wa-admin
docker logs wa-admin
```

## Traefik Labels (already in docker-compose.yml)
- Router rule: `Host('wa-admin.infinite-fusion.com')`
- Entrypoint: `websecure` (port 443)
- TLS cert resolver: `letsencrypt`
- Backend port: `80` (nginx)

Traefik network `traefik` must exist — create if needed:
```bash
docker network create traefik
```

## Redeploy
```bash
cd /opt/wa-admin
git pull
docker compose up -d --build
```

## Notes
- The build inlines VITE_* env vars at build time — rebuild after changing .env
- nginx serves the SPA with `try_files $uri /index.html` for client-side routing

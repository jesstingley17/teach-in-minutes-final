# How to Upload Dockerfile to Zeabur Manually

## Why Manual Upload?

The `Dockerfile` is NOT committed to GitHub to keep Vercel deployments simple. Zeabur will use it when you upload it manually through their dashboard.

## Steps to Upload Dockerfile to Zeabur:

### 1. Copy the Dockerfile Content

The `Dockerfile` in your project root contains:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Upload to Zeabur Dashboard

1. Go to your Zeabur project
2. Navigate to **Settings** → **Build**
3. Find the **"Dockerfile"** field
4. Click **"Load from GitHub"** button
5. OR paste the Dockerfile content directly into the text field
6. Click **"Save"**

### 3. Alternative: Use Nixpacks (Recommended)

Actually, you don't need the Dockerfile! The `zeabur.json` already configures Nixpacks:
- Automatically builds with `npm run build`
- Serves the `dist` folder
- Handles React Router routing
- Much simpler!

**Recommendation:** Just leave the Dockerfile field empty in Zeabur and let Nixpacks handle it.

## When to Use Dockerfile vs Nixpacks

### Use Nixpacks (Recommended):
- ✅ Simpler configuration
- ✅ Auto-detects everything
- ✅ Faster builds
- ✅ Already configured via `zeabur.json`

### Use Dockerfile:
- If Zeabur requires it (usually it doesn't)
- If you need custom nginx configuration
- If Nixpacks fails for some reason

## Current Setup:

- `vercel.json` → Vercel reads this ✅
- `zeabur.json` → Zeabur reads this ✅
- `Dockerfile` → Local only (not in git) ✅
- `.gitignore` → Ignores Dockerfile ✅

## Result:

- **Vercel**: Uses `vercel.json`, no Dockerfile needed ✅
- **Zeabur**: Uses `zeabur.json` + Nixpacks (or optional Dockerfile) ✅
- **GitHub**: Clean repo, no platform-specific Docker files ✅


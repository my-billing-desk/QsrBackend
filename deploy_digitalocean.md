# 🚀 Deploying to DigitalOcean

This guide explains how to deploy your **QsrWebAdmin** and **QsrBackend** to DigitalOcean using the newly created Docker configuration.

## Prerequisites
1.  **DigitalOcean Account** (Sign up if you haven't).
2.  **GitHub Repository** connected to these projects.

---

## Method 1: App Platform (Recommended - Easiest)

DigitalOcean App Platform connects directly to your GitHub repo and builds the Dockerfiles automatically.

### Step 1: Create Database
1.  Go to DigitalOcean Dashboard -> **Databases**.
2.  Click **Create Database Engine**.
3.  Choose **PostgreSQL**.
4.  Choose a plan (Basic is fine for starting).
5.  **Important**: Save the connection details (Host, Username, Password, Port).

### Step 2: Deploy Backend
1.  Go to **Apps** -> **Create App**.
2.  Select **GitHub** and choose your repository.
3.  Select the **QsrBackend** directory as the source.
4.  DigitalOcean should detect the `Dockerfile`.
5.  **Environment Variables**:
    - `DB_DIALECT`: `postgres`
    - `DB_HOST`: (Your managed DB host)
    - `DB_USER`: (Your DB user)
    - `DB_PASSWORD`: (Your DB password)
    - `DB_PORT`: `25060` (default DO DB port)
    - `DB_NAME`: `defaultdb` (or whatever you named it)
    - `DB_SSL`: `true`
6.  Launch App.

### Step 3: Deploy Frontend
1.  In the same App (or a new one), add a **Component**.
2.  Select **GitHub** and your repo again.
3.  Select **QsrWebAdmin** directory.
4.  It will detect the `Dockerfile` (Note: Ensure HTTP Port is set to 80 in settings).
5.  Launch.

---

## Method 2: Docker Compose (Local Testing)

To verify everything works before paying for cloud hosting:

1.  Open terminal in `apps/` folder.
2.  Run:
    ```bash
    docker-compose up --build
    ```
3.  This spins up:
    - **Backend** on `localhost:5001`
    - **Frontend** on `localhost:8080`
    - **PostgreSQL** locally.

---

## Method 3: Droplet (Advanced - Manual Scaling)

If you prefer a raw server (VPS):
1.  Create a **Docker Droplet** from Marketplace.
2.  SSH into the droplet.
3.  Clone your repo.
4.  Run `docker-compose up -d`.
5.  (You will need to handle SSL certificates manually using Certbot).

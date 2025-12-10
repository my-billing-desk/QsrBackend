# Google Authenticator Setup Guide

To enable "Sign in with Google", you must create a Google Cloud Project and obtain credentials.

1.  **Go to Google Cloud Console:**
    *   Visit [https://console.cloud.google.com/](https://console.cloud.google.com/).

2.  **Create a New Project:**
    *   Click on the project dropdown (top left) and select **"New Project"**.
    *   Name it (e.g., "QSR POS Admin") and click **Create**.

3.  **Configure OAuth Consent Screen:**
    *   Go to **APIs & Services > OAuth consent screen**.
    *   Select **External** (or Internal if you have a Google Workspace organization) and click **Create**.
    *   Fill in the **App Name** and **User Support Email**.
    *   Skip "Scopes" for now (or add `.../auth/userinfo.email` and `.../auth/userinfo.profile`).
    *   Add your email to **Test Users** if the app involves testing.

4.  **Create Credentials:**
    *   Go to **APIs & Services > Credentials**.
    *   Click **Create Credentials > OAuth client ID**.
    *   Application Type: **Web application**.
    *   Name: "Web Admin".
    *   **Authorized JavaScript origins:**
        *   `http://localhost:5174`
    *   **Authorized redirect URIs:**
        *   `http://localhost:5001/api/auth/google/callback`
    *   Click **Create**.

5.  **Copy Credentials to your .env file:**
    *   Copy the **Client ID** and paste it into `/Users/king/Documents/apps/QsrBackend/.env` as `GOOGLE_CLIENT_ID`.
    *   Copy the **Client Secret** and paste it into `/Users/king/Documents/apps/QsrBackend/.env` as `GOOGLE_CLIENT_SECRET`.

6.  **Restart Backend:**
    *   The backend server needs to be restarted to load the new environment variables.

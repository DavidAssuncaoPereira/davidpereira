# David Pereira Static Web App

This project has been refactored into a fully client-side static web application, removing the Node.js backend. It relies entirely on HTML, CSS, and vanilla JavaScript, using `localStorage` and `sessionStorage` to simulate authentication, persistent user sessions, and real-time chat functionality.

## Features
- **Client-Side Authentication:** Mock login and registration using local storage.
- **Mock Chat System:** Chat functionality that polls local storage to mimic real-time updates.
- **Static Asset Serving:** Images, CSS, and JavaScript run directly in the browser without any server-side logic.

## Running Locally

Because the application is entirely static, there are a few simple ways to run it:

1. **Directly in the Browser:**
   Simply double-click the `index.html` file to open it in your default web browser.

2. **Using a Local Static Server:**
   You can serve the directory using tools like Live Server (VS Code extension), Python's `http.server`, or Node's `http-server`. For example, using Python:
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

## Deployment to GitHub Pages

This repository is configured to automatically deploy to GitHub Pages via GitHub Actions whenever changes are pushed to the `main` branch.

### Configuring GitHub Pages Settings

To ensure the site is served correctly, please verify the following repository settings:

1. Go to your repository on GitHub.
2. Click on the **Settings** tab.
3. In the left sidebar, click on **Pages**.
4. Under **Build and deployment**, ensure the **Source** is set to **GitHub Actions**.

Once configured, the GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build and deploy the static files to your GitHub Pages URL (e.g., `https://<username>.github.io/<repository-name>/`).

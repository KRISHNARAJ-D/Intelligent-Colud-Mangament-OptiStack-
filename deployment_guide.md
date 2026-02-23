# OptiStack Deployment Guide: Full-Stack Cloud Hosting

This manual provides a step-by-step walkthrough for deploying the OptiStack platform. Since the project consists of a React (Vite) frontend and a FastAPI backend, we will use a hybrid hosting approach.

---

## 🏗 Deployment Architecture
*   **Frontend:** GitHub Pages (Free static hosting)
*   **Backend:** Render / Railway / DigitalOcean (Dynamic API hosting)
*   **Database:** (Internal to Backend or Managed PostgreSQL)

---

## Part 1: Backend Deployment (FastAPI)
GitHub Pages cannot host Python/FastAPI code. You must use a service like **Render** or **Railway**.

### 🧒 Which one do I pick? (Docker vs. Python)
When Render asks for your **Runtime**, it's like asking: "How do you want to pack your toys?"

1.  **Python Runtime:** Like putting toys in a shopping bag. It's fast and easy, but sometimes things might get squished or move around.
2.  **Docker Runtime:** Like putting toys in a special, sturdy plastic case. It’s a bit more "pro," but it makes sure your toys never break and look exactly the same every time you open it.

**My Recommendation:** Use **Docker**. Why? Because we already have a magic "Docker box" (called a `Dockerfile`) in the project that tells the computer exactly how to run the AI features!

---

### Step 1: Deploy on Render.com (The 10-Year-Old Version)
1.  **Go to Render.com** and make a free account.
2.  Click the big **New +** button and choose **Web Service**.
3.  **Connect your GitHub:** Pick your repo name from the list.
4.  **The Important Part (Settings):**
    *   **Name:** Give it a cool name (like `optistack-api`).
    *   **Root Directory:** Type `backend`.
    *   **Runtime:** Click the box and choose **Docker**. (Don't pick Python!)
5.  **Scroll to the bottom** and click the bright **Create Web Service** button.
6.  **Wait for the magic:** You will see a black box with scrolling text. When it says "Service is live," you are done!
7.  **Find your link:** Look at the top left of the page. It will show a link like `https://cool-name.onrender.com`. **Save this!** You need it to tell the frontend where to find the brain.

---

### Step 2: Fix the "Talking" Part (CORS)
Now that your brain (Backend) is live, you need to tell it it's okay to talk to your website (Frontend).
1.  In `backend/main.py`, make sure the "allow_origins" includes your GitHub Pages address. (See the technical section below for how).


---

## Part 2: Frontend Deployment (React + Vite)

### Step 1: Configure API Base URL
Vite uses environment variables to switch between local and production APIs.

1.  Open `frontend/src/App.jsx` (or your API utility file).
2.  Ensure it uses an environment variable:
    ```javascript
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    ```
3.  Create a file named `.env.production` in your `frontend/` folder:
    ```text
    VITE_API_URL=https://optistack-backend.onrender.com/api/metrics
    ```

### Step 2: Configure `vite.config.js`
If your project is hosted at `https://USERNAME.github.io/REPO_NAME/`, you must set the base path.
1.  Open `vite.config.js`:
    ```javascript
    export default defineConfig({
      plugins: [react()],
      base: '/Intelligent-Colud-Mangament-OptiStack-/', // Match your Repo Name
    })
    ```

### Step 3: Deploy to GitHub Pages
1.  Install the deployment package:
    ```bash
    cd frontend
    npm install gh-pages --save-dev
    ```
2.  Add deployment scripts to `frontend/package.json`:
    ```json
    "scripts": {
      "predeploy": "npm run build",
      "deploy": "gh-pages -d dist"
    }
    ```
3.  Run the deployment command:
    ```bash
    npm run deploy
    ```
4.  In your GitHub Repository, go to **Settings > Pages** and set the branch to `gh-pages`.

---

## Part 3: Handling Production Challenges

### 1. SPA Routing (The 404 Error)
GitHub Pages doesn't natively support Single Page Application (SPA) routing. If you refresh a page like `/app`, you'll get a 404.
*   **Fix:** Use `HashRouter` instead of `BrowserRouter` in your React code, OR copy your `index.html` as `404.html` in the `dist` folder before deploying.

### 2. Updating the Deployment
Whenever you make changes:
1.  Commit and push your code to GitHub.
2.  Run `npm run deploy` inside the `frontend` folder.
3.  Render will automatically redeploy the backend if you have "Auto-Deploy" enabled.

### 🛑 Help! My link shows {"detail":"Not Found"}
Don't panic! This is actually a **GOOD** sign. 

1.  **Why did this happen?** FastAPI is very organized. If you visit your link (like `https://optistack-api.onrender.com/`), it says "Not Found" because you didn't tell it what to show on the very first page. 
2.  **How to check if it's working?** Add `/docs` to the end of your link! 
    *   Example: `https://optistack-api.onrender.com/docs`
    *   If you see a colorful page with "FastAPI" and a list of buttons, **your backend is 100% working perfectly!**
3.  **The Secret Health Link:** To see if the "brain" is alive, try this link:
    *   `https://optistack-api.onrender.com/api/metrics`
    *   If you see a bunch of numbers (JSON), you are a pro! You fixed it!

---

## 🛠 Common Errors & Fixes
| Error | Cause | Fix |
| :--- | :--- | :--- |
| **{"detail":"Not Found"}** | No root route defined | Normal behavior. Visit `/docs` or `/api/metrics` to verify. |
| **CORS Error** | Backend doesn't trust Frontend | Add GH Pages URL to `allow_origins` in `main.py`. |
| **404 on Refresh** | Static hosting routing | Switch to `HashRouter` or add `404.html`. |
| **Mixed Content** | HTTP vs HTTPS | Always use `https://` for your backend URL in production. |
| **Blank Page** | Incorrect `base` path | Ensure `base` in `vite.config.js` matches your project URL. |

---

## 💡 Recommended Backend Providers
1.  **Railway.app:** Fast, 500 hours free, very stable.
2.  **Render.com:** Easiest setup, free tier available (sleeps after inactivity).
3.  **DigitalOcean App Platform:** Professional grade, fixed cost (~$5/mo).
4.  **AWS App Runner:** Best for scaling, higher complexity.

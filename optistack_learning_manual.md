# 🚀 OptiStack: The Magic Learning School Bus!

Welcome! This is your special guide to understanding how OptiStack works. We are going to learn how a computer "brain" can help save money and keep systems running smooth!

---

## 🦄 Part 1: How does it work? (The Analogy)

Imagine you are in charge of a **Magic School Bus**. 

1.  **The Kids (The Data):** Sometimes there are 50 kids who want a ride, and sometimes only 2. 
2.  **The Bus (The Server):** If you always drive a giant bus, it costs a lot of gas (money!) even when only 2 kids are inside. If you drive a tiny car but 50 kids show up, they won't fit!
3.  **The Master Driver (The AI):** OptiStack is like a Master Driver who watches the kids. 
    *   If he sees a crowd coming, he quickly gets a bigger bus! 
    *   If he sees kids going home, he switches to a tiny car to save gas money.

---

## 🎨 Part 2: The Three Musketeers (How it talks)

OptiStack has three main parts that talk to each other like friends:

*   **The Face (Frontend):** This is the pretty website you see. It shows you charts and buttons. It’s like the dashboard of our School Bus.
*   **The Brain (Backend):** This is where the work happens. It handles the requests and does the math.
*   **The Smart Pilot (The AI / RL):** This is a special part of the Brain. It "learns" by playing a game. Every time it saves money without making the kids wait, it gets a "point" (Reward). If it makes a mistake, it loses a point. Over time, it becomes a Super Pilot!

---

## 🎮 Part 3: Running the Project (Step-by-Step)

Let's turn on the system! We need to open two "Command Centers" (Terminals).

### 📍 Step A: Turn on the Brain (The Backend)
The Brain needs to be awake before the Face can see it.

1.  **Open your first Terminal.**
2.  **Go to the backend folder:**
    ```bash
    cd backend
    ```
3.  **Wake up the Virtual World (The Environment):**
    ```bash
    .\venv\Scripts\activate
    ```
    *(This is like a private room where all our backend tools live).*
4.  **Start the Brain:**
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```
    *   **What this does:** It starts the "Uvicorn" server. It's like turning on the electricity in our office.
5.  **Check if it's awake:** Open your browser and go to `http://localhost:8000/docs`. If you see a colorful page, the Brain is happy!

---

### 📍 Step B: Turn on the Face (The Frontend)
Now we need the Face so we can talk to the Brain.

1.  **Open a SECOND Terminal.** (Don't close the first one!)
2.  **Go to the frontend folder:**
    ```bash
    cd frontend
    ```
3.  **Get the tools ready:**
    ```bash
    npm install
    ```
    *(You only need to do this once. It's like buying the bricks for a house).*
4.  **Start the Face:**
    ```bash
    npm run dev
    ```
    *   **What this does:** It starts a "Development Server." It's like opening the shop doors for customers.
5.  **Go see it:** The terminal will give you a link like `http://localhost:5173`. Click it!

---

## 🤖 Part 4: Advisory vs. Automation (Two Ways to Play)

You can tell OptiStack how to behave:

1.  **Advisory Mode (The "Ask Me First" Mode):** 
    The AI Pilot sees a way to save money, but he doesn't do it. Instead, he taps you on the shoulder and says, *"Hey, I think we should switch to a smaller bus. Is that okay?"* You decide!
2.  **Automation Mode (The "Auto-Pilot" Mode):**
    The AI Pilot is in total control. He sees the kids leaving, switches the bus himself, and saves the money immediately. He just shows you the report later.

---

## 🛠 Part 5: "Uh-Oh!" (Fixing Common Problems)

*   **"Connection Failed":** This usually means you forgot to Turn on the Brain (**Step A**). Go back and make sure that terminal is running!
*   **"Not Found":** If you see this on the Backend, it's okay! Try adding `/docs` to the end of the URL.
*   **How to Stop:** In either terminal, just press **Ctrl + C** on your keyboard. It's like flipping the "Off" switch.
*   **How to Restart:** Just type the "Start" commands again!

---

**You did it!** You are now a Junior OptiStack Engineer. 🌟
Enjoy learning and playing with your new AI Cloud system!

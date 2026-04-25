# 🤖 SARHA — Web-Based AI Voice Assistant

**SARHA** is a premium, full-stack AI voice assistant that bridges the gap between cloud intelligence and local system automation. Designed with a sleek, "Linear/Vercel" inspired cinematic dark theme, it provides a highly responsive neural interface for both conversational AI and hardware control.

---

## 🌟 Key Features

### 🧠 Advanced AI Intelligence
- **Cognitive Engine:** Powered by **Google Gemini API** for deep, context-aware reasoning.
- **Neural Voice:** Integrated with **OpenAI TTS (TTS-1)** for high-fidelity, natural-sounding speech.
- **Adaptive Resilience:** Built-in fallback to **Browser Native TTS** ensuring the assistant remains vocal even if neural streams are interrupted.

### 🎙️ Voice & Audio Interface
- **STT (Speech-to-Text):** Real-time, continuous voice recognition using the **Web Speech API**.
- **Visual Dynamics:** Interactive HUD with real-time audio visualizers and glowing status indicators (Active, Processing, Sleeping).

### 🕸️ Web Automation & Data
- **Live Intelligence:** Uses **Puppeteer** (Headless Browser) to fetch real-time data from the web.
- **Smart Weather:** Dual-layer weather engine using `wttr.in` API and Google search scraping fallback.
- **Media Automation:** Automated search and playback protocols for **YouTube** and **Spotify**.

### 💻 System Control (Local Mode Only)
- **App Launcher:** Open desktop applications like **Chrome, VS Code, Notepad,** and **WhatsApp** directly via voice.
- **OS Operations:** Execute system-level tasks including **Shutdown** and **Task Killing** using Node.js `child_process`.
- **Hybrid Security:** Smart environment detection locks hardware features behind a premium modal when running on cloud platforms (like Render).

---

## 🛠️ Tech Stack

- **Frontend:** React.js (Vite), Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB Atlas (Cloud Storage).
- **Automation:** Puppeteer, Node OS module.
- **AI/ML:** Google Gemini API, OpenAI TTS API.

---

## 🚀 Getting Started (Local Installation)

To unlock the full potential of SARHA (including system-level commands), follow these steps to run it on your machine:

### 1️⃣ Clone the Repository
```bash
git clone [https://github.com/Mohan-Kumar-Dalei/sarha-ai-assistant.git](https://github.com/Mohan-Kumar-Dalei/sarha-ai-assistant.git)
cd sarha-ai-assistant
```
### 2️⃣ Install Backend Dependencies
```bash
cd backend
npm install
```
3️⃣ Install Frontend Dependencies
```bash
cd frontend
npm install
```
4️⃣ Set Up Environment Variables(.env) in backend folder
```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET - To find jwt secret key then go to this website https://jwtsecrets.com/ generate the key copy it and paste it in your .env file
example:- JWT_SECRET = "yout jwt secret key"
```
5️⃣ Launch SARHA
```bash
Run the backend and frontend
backend:- nodemon server.js
frontend: npm run dev 

Visit http://localhost:5173
```

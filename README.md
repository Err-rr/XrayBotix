# XrayBotix 🤖

> **AI-Powered X-ray Diagnosis in Seconds**

**Live Demo**: [xraybotix.netlify.app](https://xraybotixai.netlify.app/)
**Repo**: [github.com/Err-rr/XrayBotix](https://github.com/Err-rr/XrayBotix)

---

## 🔎 Overview

XrayBotix is an AI-driven platform that revolutionizes X-ray diagnosis using real-time image classification and natural language medical report generation. Designed for fast, accurate, and secure healthcare insights.

---

## 💡 Key Features

* ⏩ **Instant Analysis**: 15-second AI-based X-ray scanning
* 🧐 **Specialized Models**: Chest, Spine, Dental & Skull
* 🔒 **Privacy-First**: Auto-delete uploads & encrypted processing
* 📈 **Smart Reports**: AI-generated insights with PDF export
* 🚀 **No-code AI**: Powered by Google Teachable Machine & Gemini API

---

## 📊 Tech Stack

* **Frontend**: HTML5, CSS3, JavaScript (ES6), Bootstrap
* **AI Models**: Google Teachable Machine (CNN classifiers)
* **Backend**: Netlify Functions, Google Gemini API
* **Deployment**: Netlify + GitHub CI
* **Libraries**: jsPDF, Drag & Drop API, Canvas API

---

## 🛎️ User Flow

1. **Upload X-ray** via drag & drop
2. **Select type** (Chest, Spine, Dental, Skull)
3. **AI model analysis** and generate predictions
4. **Gemini API** creates a concise medical report
5. **Download** report as PDF

---

## ⚖️ Security & Compliance

* HIPAA-ready architecture
* Images deleted in 30 seconds
* End-to-end encryption
* No persistent storage

---

## ⚙️ Setup & Usage

### Prerequisites

```bash
Node.js >= 14
npm >= 6
```

### Install & Run

```bash
git clone https://github.com/Err-rr/XrayBotix.git
cd XrayBotix
npm install
netlify dev
```

### Deploy

```bash
netlify deploy --prod
```

---

## 🌐 AI Model Links

* Chest: [https://teachablemachine.withgoogle.com/models/CHMEJ5Ywr/](https://teachablemachine.withgoogle.com/models/CHMEJ5Ywr/)
* Spine: [https://teachablemachine.withgoogle.com/models/8vZGuj\_dj/](https://teachablemachine.withgoogle.com/models/8vZGuj_dj/)
* Dental: [https://teachablemachine.withgoogle.com/models/c6n0-OhWN/](https://teachablemachine.withgoogle.com/models/c6n0-OhWN/)
* Skull: [https://teachablemachine.withgoogle.com/models/4cYJUrTnl/](https://teachablemachine.withgoogle.com/models/4cYJUrTnl/)

---

## 🚀 Coming Soon

* Support for CT & MRI
* Native mobile apps (iOS/Android)
* Public medical API
* Real-time doctor collaboration
* Blockchain-based data integrity

---

**Built with ❤️ for the future of global healthcare**

# Sync

<div align="center">

**Collaborative Decision Making, Synchronized.**

[![Deployment Status](https://img.shields.io/badge/Deployment-Live-2ea44f?style=for-the-badge&logo=vercel)]()
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-white?style=for-the-badge&logo=socket.io)](https://socket.io/)

[**View Live Demo**]() • [**Report Bug**](https://github.com/your-org/sync/issues) • [**Request Feature**](https://github.com/your-org/sync/issues)

</div>

---

## � Table of Contents

-   [Overview](#-overview)
-   [Key Features](#-key-features)
-   [Project Structure](#-project-structure)
-   [Technology Stack](#-technology-stack)
-   [Getting Started](#-getting-started)
-   [Configuration](#-configuration)
-   [Architecture & Security](#-architecture--security)

---

## 📋 Overview

**Sync** eliminates the friction of group decision-making. Whether choosing a restaurant for dinner or a movie for movie night, Sync provides a widely accessible, real-time platform where groups can vote and reach consensus instantly.

Built with a performance-first mindset, Sync leverages a custom Node.js server wrapping Next.js to handle high-concurrency WebSocket connections, ensuring that every swipe and vote is synchronized across all devices in milliseconds.

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **⚡ Real-Time Sync** | Instant state propagation using `Socket.io`. When one user swipes, everyone's status updates immediately. |
| **🧠 Smart Queue** | Algorithms dynamically re-rank options based on group vetoes to surface the most likely matches faster. |
| **📍 Location Intelligence** | Deep integration with **Google Places API** provides rich metadata, photos, and ratings for venues. |
| **🛡️ Robust Security** | Rate limiting, input validation, and secure session management. |
| **📱 Responsive Design** | a "Mobile-First" interface built with **Tailwind CSS 4** and **Framer Motion** for native-app-like fluidity. |

## � Project Structure

```bash
sync/
├── src/
│   ├── app/                 # Next.js App Router pages and API routes
│   ├── components/          # Reusable UI components (Atomic design)
│   ├── lib/                 # Core logic libraries
│   │   ├── socket/          # WebSocket event handlers and managers
│   │   ├── places/          # Google Places API integration
│   │   └── security/        # Rate limiting and validation utilities
│   ├── server.ts            # Custom Node.js server entry point
│   └── proxy.ts             # Middleware configuration
├── public/                  # Static assets
└── package.json             # Project dependencies and scripts
```

## 🛠️ Technology Stack

<div align="center">

| Core | Infrastructure | Styling & UI |
| :---: | :---: | :---: |
| **Next.js 16** | **Node.js** | **Tailwind CSS 4** |
| **TypeScript** | **Socket.io** | **Framer Motion** |
| **React 19** | **Google Cloud** | **Lucide Icons** |

</div>

## 🚀 Getting Started

Follow these steps to set up a local development environment.

### Prerequisites

-   **Node.js**: v18.0.0 or higher
-   **Package Manager**: npm or yarn

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-org/sync.git
    cd sync
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    # Core
    NODE_ENV=development
    PORT=3000
    DEBUG_MODE=true               # Set 'false' to enable real API calls

    # Security
    JWT_SECRET=your_super_secret_key
    ALLOWED_ORIGINS=http://localhost:3000
    TRUST_PROXY=false

    # Services
    GOOGLE_PLACES_API_KEY=your_google_api_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000`.

## 🛡️ Architecture & Security

### Custom Server Implementation
Sync uses a custom `server.ts` to unify the HTTP and WebSocket layers. This architecture removes the need for a separate WebSocket microservice, simplifying deployment and reducing connection overhead.

### Security Defenses
-   **Rate Limiting**: `rate-limiter-flexible` protects against brute-force and DDoS attacks.
-   **Headers**: Full implementation of `Helmet` for CSP, XSS protection, and NoSniff headers.
-   **Validation**: All user inputs are sanitized and validated via specifically defined schemas before processing.

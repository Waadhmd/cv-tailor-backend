# 🤖 CV Tailor Backend Service

This service provides a RESTful API endpoint for generating a structured, tailored CV object based on a user's original CV text and a specific Job Description (JD). It is built with Node.js and Express, utilizing the Google Gemini API for natural language processing and structured data output.

## Table of Contents

1.  [Prerequisites](#1-prerequisites)
2.  [Installation](#2-installation)
3.  [Configuration](#3-configuration)
4.  [Running the Server](#4-running-the-server)
5.  [API Endpoint](#5-api-endpoint)
6.  [Error Handling](#6-error-handling)

---

## 1. Prerequisites

- **Node.js** (v18.x or newer)
- **npm** or **yarn**
- **Google AI API Key** (for access to the Gemini model)

## 2. Installation

1.  Clone the repository (or navigate to your backend directory):

    ```bash
    cd <your-backend-directory>
    ```

2.  Install the required Node.js packages:

    ```bash
    npm install
    # or
    yarn install
    ```

## 3. Configuration

The server requires your Google AI API and OPEN AI API keys to function. This should be stored securely as an environment variable.

1.  Create a file named `.env` in the root of your backend directory.
2.  Add your API key and port configuration to the file:

    ```env
    # .env
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    OPENAI_API_KEY="YOUR_API_KEY_HERE"
    ```

## 4. Running the Server

Start the server using Node:

```bash
node server.js
# or, for development with automatic restarts (if using nodemon)
npm run dev
```

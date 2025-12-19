# API Key Usage and Quiz Generation Summary

This document outlines how the "Dungeon Jeopardy!" game utilizes the Gemini API to dynamically generate quiz content.

## 1. API Key Setup and Storage

*   **File Location:** The application expects the Google Gemini API key to be stored in a plain text file named `gemini_key.txt` located in the root directory of the project.
*   **Security Note:** This file is listed in `.gitignore` to prevent it from being committed to the version control system, keeping the key private.
*   **Retrieval Mechanism:** 
    *   The function `getApiKey()` in `js/modals/generateQuizModal.js` retrieves the key by making a standard HTTP `fetch` request to the relative path `'gemini_key.txt'`.
    *   This approach relies on the game being served by a local web server (e.g., Python's `http.server` or Node's `serve`), effectively treating the key file as a static asset.

## 2. The Generation Process

The quiz generation workflow is driven by the **Generate Quiz Modal** (`js/modals/generateQuizModal.js`) and executed via the **API Service** (`js/api.js`).

### Workflow Steps:

1.  **User Input:** The user opens the generation modal and provides:
    *   A **Quiz Name**.
    *   One or more **Category Names**.
    *   Optional **Specific Instructions** for each category (e.g., "Focus on 80s movies").

2.  **Prompt Construction:**
    *   The application fetches a prompt template from `category_prompt.txt`.
    *   For each category entered by the user, the system fills in the `[Category]` and `[Instructions]` placeholders in the template.

3.  **API Call:**
    *   The `generateQuiz` function in `js/api.js` is called for each category.
    *   It sends a `POST` request to the Gemini API endpoint:
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}`
    *   The request body contains the constructed prompt.

4.  **Response Handling:**
    *   The API returns a generated JSON string (often wrapped in Markdown code blocks).
    *   `js/api.js` cleans the response (removing Markdown wrappers) and parses the JSON.
    *   The individual category data is aggregated into a final quiz object.

5.  **Game Initialization:**
    *   Once all categories are generated, the new quiz data is set as the active quiz in the application state (`js/state.js`).
    *   The game transitions to the player setup screen, ready to play the newly generated content.

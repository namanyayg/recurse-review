# Plan for: Download Zulip Message Content Endpoint

**Feature Description:** Create a new GET API endpoint that returns the content of `zulip_message_content` as a JSON download.

**Relevant Files:**

*   `src/app/api/download-zulip-messages/route.ts` (creation) - This will be the new API route handler.
*   `data/messages.json` (read) - This file is mentioned in the project memory as a local backup for generated journeys, which implies it contains Zulip message content. We'll need to read from this file.
*   `.giga/memory/memory.md` (reference) - To ensure consistency with existing features and project structure.

**Clarifying Questions Asked (and Answers):**

*   None needed at this time. The request is clear.

**Steps:**

1.  **Create the API Route File:**
    *   Create a new file: `src/app/api/download-zulip-messages/route.ts`.
2.  **Implement the GET Handler:**
    *   In `route.ts`, create a `GET` request handler function.
    *   This function will read the content of `data/messages.json`.
    *   It will then set the appropriate `Content-Type` header to `application/json`.
    *   It will also set the `Content-Disposition` header to `attachment; filename="zulip_messages.json"` to trigger a download in the browser.
    *   Finally, it will return the JSON content as the response.
3.  **Error Handling:**
    *   Implement basic error handling, such as returning a 404 or 500 status code if `data/messages.json` is not found or cannot be read.
4.  **Testing (Manual):**
    *   Once implemented, manually test the endpoint by accessing it in a browser or using a tool like `curl` to ensure it downloads the JSON file correctly. 
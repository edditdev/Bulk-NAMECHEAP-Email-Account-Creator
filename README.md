# Bulk Email Account Creator (Browser Automation Script)

This script automates the creation of multiple email accounts on a web hosting control panel (cPanel-based UI) directly from the browser.

## What It Does

- Programmatically fills in and submits the *"Create Email Account"* form.
- Generates sequential email usernames (e.g., `emailadress1`, `emailadress2`, ..., `emailadress200`).
- Uses a fixed password for all accounts (customizable).
- Waits for form loading, handles AJAX responses, and confirms success.
- Automatically skips or aborts on server errors, max account limits, or invalid usernames.

## How It Works

- Runs **entirely in the browser** (as a bookmarklet, pasted script, or from the DevTools console).
- Waits for necessary DOM elements (username, password input, submit button).
- Triggers AngularJS model updates manually.
- Observes server XHR calls to validate account creation success.
- Handles form loading delays and resets between submissions.

## Usage

### 1. Open Your Hosting Control Panel

Navigate to the **Email Accounts** section of your hosting (cPanel or similar).

### 2. Open Developer Tools

- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Or `Cmd+Option+I` (macOS)
- Go to the **Console** tab.

### 3. Paste the Script

Paste the full contents of the script into the console and press `Enter`.

```js
// paste the createEmailAccounts() function here
```

![Email Account Creation Form](https://i.imgur.com/ErAUSp0.png)

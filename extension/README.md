# Audix for Chrome

Audits the page you're on. Click the toolbar icon, pick a goal, and run it. The audit carries on if the popup closes, and the toolbar badge shows the score when it finishes.

## Install for your team

1. Unzip `audix-extension.zip`, or use this `extension` folder. Keep the folder somewhere permanent, because Chrome loads it from there each time.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and choose the folder.
4. Pin Audix from the puzzle-piece menu.

## How it works

The extension holds no audit logic. It sends the tab's address to `POST /api/audit` on the deployment named in `config.js`, and opens `/report/<id>` for the full report. Changing the deployment means changing `config.js` and `host_permissions` in `manifest.json`.

- **Sent:** the address of the current tab, the chosen goal and the email entered in the popup, and only when an audit runs. The extension does not read page content or browsing history.
- **Pages behind a login:** the server opens the address in its own signed-out browser, so it audits the login screen.
- **Kept lists:** `STAGES` and `GOALS` in `popup.js` mirror `src/hooks/useAudit.ts` and `src/lib/audit/framework.ts`. Update them together.

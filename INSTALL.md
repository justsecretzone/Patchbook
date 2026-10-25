# Installing Patchbook (instructions for Claude)

These steps are for Claude when a user asks to install Patchbook, for example "Install the Patchbook skills from github.com/justsecretzone/Patchbook". Do the install right in the chat, without sending the user off to do it, and talk to the user in their language.

The goal is a **permanent** install in the user's account or on their machine. Copying the skills into a session's workspace or container (for example `~/.claude/skills` inside a cloud session) is not an install: it disappears when the session ends. Never report that as done.

## Claude (claude.ai web, desktop or mobile app): install in the chat

Use the first option that is available.

### A. Skill card (preferred, one click for the user)

If you have a tool that proposes skills for the user to save (for example `propose_skills`):

1. Fetch the compact edition: `https://raw.githubusercontent.com/justsecretzone/Patchbook/main/install/patchbook/SKILL.md` (shell `curl -fsSL`, or WebFetch asking for the raw file unchanged). Read it.
2. Call the tool once with one proposal: `name: patchbook`, `kind: new`, `description` copied from the file's frontmatter, `skillMd` the file content exactly as fetched.
3. Tell the user in one line to click **Save** on the card. That's the whole install.

The compact edition covers all six review kinds and loads each kind's full instructions and review page from this repository when it is needed. If the user already has the six separate skills (`website-review`, `video-review`, ...) installed, say so and don't add the compact one on top.

### B. Upload in the browser (full skills)

If no skill card tool is available but a browser tool is (Claude in Chrome or the built-in browser):

1. Download the six zips:
   ```
   mkdir -p patchbook-install && cd patchbook-install
   for s in website-review app-review image-review pdf-review audio-review video-review; do
     curl -sSLO "https://github.com/justsecretzone/Patchbook/releases/latest/download/$s.zip"
   done
   ```
2. Open `https://claude.ai/customize/skills/new/upload`, find the file input ("Skill file") and upload all six zips in one go with the browser's file upload tool. Don't click the input; that opens a native picker.
3. Click the upload button. For a skill that already exists, choose "replace" / "Ersetzen" and confirm. Earlier versions stay in the skill's version history.
4. Click "Done" and check that the six skills appear under **Customize → Skills**.

### C. Neither tool available

Send the six zips to the user as files and give three steps: open **Customize → Skills**, click **+** → **Upload a skill**, drop in all zips and choose "replace" for existing ones. Code execution and file creation must be on (Settings → Capabilities).

## Claude Code on the user's own machine

```
/plugin marketplace add justsecretzone/Patchbook
/plugin install patchbook@patchbook
```

Or copy the six folders from `skills/` into `~/.claude/skills/` on the user's machine. That persists.

## Claude Code in the cloud, or any other temporary session

The workspace is deleted at the end of the session. Tell the user so, and install through the account instead (option A or B above) or on their own machine.

## ChatGPT (Business, Enterprise, Edu)

Plugins → Skills → Create → Upload from your computer, one zip at a time. Outside Claude the review pages run in local mode.

## Confirm

Tell the user in one or two lines what is installed and where, and that from now on a review page appears automatically whenever Claude builds a website, app, image, PDF, audio or video.

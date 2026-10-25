# Installing Patchbook (instructions for Claude)

These steps are for Claude when a user asks to install Patchbook, for example "Install the Patchbook skills from github.com/justsecretzone/Patchbook". Follow them without asking the user to do the work, and talk to the user in their language.

The goal is a **permanent** install in the user's account or machine. Copying the skills into a session's workspace or container (for example `~/.claude/skills` inside a cloud session) is not an install: it disappears when the session ends. Never report that as done.

## 1. Get the skills

Download the latest release zips (the shell can reach GitHub):

```
mkdir -p patchbook-install && cd patchbook-install
for s in website-review app-review image-review pdf-review audio-review video-review; do
  curl -sSLO "https://github.com/justsecretzone/Patchbook/releases/latest/download/$s.zip"
done
```

Each zip holds one folder named like the skill with its `SKILL.md` and `assets/`. Read the `SKILL.md` files before installing.

## 2. Install where the user works

### Claude (claude.ai web, desktop or mobile app)

Skills live in the account under **Customize → Skills** (`https://claude.ai/customize/skills`). Install them there:

1. If a browser tool is available (Claude in Chrome or the built-in browser), open `https://claude.ai/customize/skills/new/upload`.
2. Find the file input ("Skill file") and upload all six zips in one go with the browser's file upload tool. Do not click the input; that opens a native picker.
3. Click the upload button. For a skill that already exists, the page shows "replace" / "Ersetzen": choose it, then confirm "Upload and replace". Earlier versions stay in the skill's version history.
4. Click "Done" and check that the six skills appear under **Customize → Skills → Yours**.
5. Decline non-essential cookies if a cookie banner appears.

If no browser tool is available, send the six zips to the user as files and give these three steps: open Customize → Skills, click **+** → **Upload a skill**, drop in all zips and choose "replace" for existing ones. Code execution and file creation must be on (Settings → Capabilities).

### Claude Code on the user's own machine

Run in the user's terminal, or tell the user to run inside Claude Code:

```
/plugin marketplace add justsecretzone/Patchbook
/plugin install patchbook@patchbook
```

Alternatively copy the six folders from the zips into `~/.claude/skills/` on the user's machine. That persists.

### Claude Code in the cloud, or any other temporary session

The workspace is deleted at the end of the session. Tell the user so, and install through the account instead (Claude section above) or on their own machine.

### ChatGPT (Business, Enterprise, Edu)

Plugins → Skills → Create → Upload from your computer, one zip at a time. Outside Claude the review pages run in local mode.

## 3. Confirm

Tell the user in one or two lines which skills are installed and where, and that from now on a review page appears automatically whenever Claude builds a website, app, image, PDF, audio or video.

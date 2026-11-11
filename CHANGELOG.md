# Changelog

## 1.4.1

- One approval per step instead of three or four. The first version is a single publish that carries the page and the work (video, audio, PDF and images travel as files next to the page instead of separate asset uploads).
- A review round is a single publish: handled patches are listed in `CFG.closed` and the page marks them done itself, so Claude no longer writes to the database. A patch the reviewer reopens stays open.
- The skills state more firmly that Claude never asks in chat before publishing, updating or deleting the review page.

## 1.4.0

- Patches are never under the input any more. On desktop they sit in a panel on the right that collapses to a rail; on phones only the input docks under the work and the patches slide in from the right (list button with the open count, swipe or tap outside to close). Audio and video use the same layout instead of a scrolling page.
- Liquid glass design: translucent panels and bars, capsule controls, blurred glass for the Comment button, zoom control, drawer, toast and lightbox, in light and dark.
- Video and audio play without stutter: during playback only the playhead moves, the timeline is no longer redrawn on every frame, colours are read once, and scrubbing applies only the newest seek. The skill now encodes review copies with a keyframe every second so jumping is instant.
- Fixed: on phones a tap on a live website or app in comment mode placed no pin.
- Fixed: the timeline time bubble could stay stuck after a touch; the zoom buttons on images could place a pin; a failed save lost the place and screenshots of the patch; an inline edit was thrown away when another change arrived; PDF pages could turn blank when zoomed in on phones; read-only viewers still saw the Comment button.
- New: two-finger zoom on images and PDFs, green check for done patches on the timeline, "All done" instead of the empty hint when everything is closed.

## 1.3.4

- Video and audio: playback starts and stops reliably (no CORS requirement on the source, one tap is one toggle, plays inline on iPhone).
- A patch lands where you started writing: the playhead is pinned when you focus or type, and follows only when you deliberately seek.
- A tap on the timeline that wobbles a few pixels stays a tap instead of becoming a range. Holding grows the timeline upward over the player, so nothing jumps.
- The phone keyboard no longer resizes the player.
- No more zooming in on phones while typing: all fields use 16px text on touch devices.
- Skills no longer ask in chat before publishing, updating or deleting their review page; installing them is the permission.

## 1.3.3

- The Comment button shows its label for a moment, then shrinks to its icon. It sits right above the comment field on phones.
- Slimmer toolbar and a tighter bottom edge on phones.

## 1.3.2

- The work always gets the largest possible area: no outer margins on desktop or phones, the patches panel sits flush next to or below it.
- Breakpoints use the full height, images and PDF pages fit with a minimal margin, videos get a player sized to their picture.

## 1.3.1

- On phones the work goes edge to edge: no outer margin, no rounded stage, the patches panel docks flat to the bottom.
- A breakpoint as wide as the view (for example Mobile on a phone) now fills the full width instead of shrinking with a margin.

## 1.3.0

- Done patches get a green check, on the pin and in the list.
- The patches title uses the same sans serif as the rest of the page.
- Audio and video: press and hold on the timeline and the track grows taller and zooms in, release and it contracts again.

## 1.2.0

- The patches panel shows no logo anymore: not in the header, the collapsed rail or Claude's replies.
- Removed the screenshot buttons from the toolbars and the video composer. Pasting or dropping a screenshot still works everywhere.
- New wordmark set in Geist, and new README screenshots with a software example.
- Install by asking Claude: Claude shows a skill card in the chat and one click on Save installs Patchbook. The compact edition (`install/patchbook`) covers all six kinds and loads each review page from this repository when needed.
- INSTALL.md tells Claude how to install permanently (skill card, browser upload or zips) instead of only copying the skills into a temporary session.

## 1.1.1

- Removed the dictation button. Claude's artifact frame blocks the microphone, so it could not work inside Claude. System dictation (Mac: Fn twice, phones: keyboard microphone) still types into the comment field.

## 1.1.0

- Dictation: a microphone button writes speech straight into the comment field where the browser allows it. Inside Claude's artifact frame, where the microphone is blocked, it points to the system dictation instead.
- Patches stay on the page, screen or image they were made on. A link under the list shows the ones elsewhere.
- Pills at the top and bottom edge show pins that are scrolled out of view and jump to them.
- Dragging a pin can no longer leave the page in a state where pins stop showing.

## 1.0.0

- Six review skills: website, app, image, PDF, audio and video.
- Pins on live elements with breakpoints, draggable pins and areas, screenshots on every patch.
- Patches sidebar where you comment on a surface, a list under the player for audio and video.
- Follows the user's language and Claude's light or dark theme. Local mode with "Copy patches" outside Claude.

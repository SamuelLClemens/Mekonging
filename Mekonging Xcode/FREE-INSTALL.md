# Mekonging — Free Install Checklist (put it on your own iPhone, $0)

This installs the app on **your own iPhone** for **free**. You do **not** need the paid
Apple Developer Program ($99/year). All you need is the free **Apple ID** you already use
for the App Store, plus Xcode (already installed).

> Money rule: you never enter a payment method. If Xcode ever offers to **"Enroll in the
> Apple Developer Program"** or asks for $99 — you do **not** need it. Close that window and
> keep going with the free option.

---

## Part A — One-time setup on the Mac (free)

1. **Sign Xcode into your Apple ID.** Open Xcode, then menu **Xcode → Settings → Accounts**.
   Click **+** → **Apple ID** → sign in with your normal Apple ID. This creates your free
   **"Personal Team"** automatically. No payment.

2. **Prepare the app content.** Open the **Terminal** app, paste this line, press Return:

   ```bash
   bash "/Users/zim/Desktop/Claude Code/Mekong/Mekonging Xcode/sync-web.sh"
   ```

3. **Open the project.** In Finder, double-click:

   ```
   Mekonging Xcode/Mekonging/Mekonging.xcodeproj
   ```

## Part B — Add the app content folder (one drag — important)

4. In Finder, open `Mekonging Xcode/Mekonging/Mekonging/` and find the **Web** folder.
5. Drag the **Web** folder into Xcode's left sidebar, dropping it onto the yellow
   **Mekonging** folder (the one that contains the Swift files).
6. In the popup: choose **"Create folder references"**, leave **"Copy items if needed"
   unchecked**, tick the **Mekonging** target, then click **Finish**.
7. Check the **Web** folder is now shown in **blue**. Blue is correct. (Yellow means you
   picked "groups" — remove it and redo this part.)

## Part C — Make it yours (free signing)

8. Click the blue **Mekonging** at the very top of the sidebar, select the **Mekonging**
   target, then open the **Signing & Capabilities** tab.
9. Tick **Automatically manage signing**.
10. In **Team**, choose **your own Apple ID** (your free Personal Team). If a red error about
    the *bundle identifier* appears, change **Bundle Identifier** to something unique such as
    `com.yourname.mekonging` — the error clears.

## Part D — Connect your iPhone (free)

11. Plug the iPhone into the Mac with a cable. On the phone, tap **Trust** and enter your passcode.
12. Turn on **Developer Mode** (a free phone switch): on the iPhone go
    **Settings → Privacy & Security → Developer Mode → On**, then restart the phone.
    (If you do not see it yet, do Step 14 once — Xcode will prompt you to enable it.)

## Part E — Install and open (free)

13. At the top of Xcode, click the device menu and select **your iPhone**.
14. Press the **▶ Run** button (or press **Cmd-R**). Wait while it builds and installs. The
    Mekonging icon appears on your home screen.
15. **First time only —** trust the app on the phone:
    **Settings → General → VPN & Device Management → tap your Apple ID → Trust**.
16. Tap the **Mekonging** icon. It opens. Done.

---

## Keeping it (still free)

- With the free Apple ID, the app keeps working for about **7 days**, then stops opening.
- To renew (free, ~1 minute): plug the phone into the Mac, open the project, press **▶ Run** again.
- You can have up to **3** self-installed apps on the phone at once.

## If something goes wrong

- **Blank screen** → the Web folder was not added as a blue *folder reference*. Redo Part B.
  (The app even shows a message telling you this.)
- **"Untrusted Developer"** when you tap the icon → do Step 15.
- **Red signing error** → Step 10: pick your own team and use a unique Bundle Identifier.
- **"Device not eligible"** → your iPhone must be on iOS 16.2 or newer.

The app icon, permissions, and screen orientation are already set up for you.

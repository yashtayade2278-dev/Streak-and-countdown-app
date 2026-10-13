# Streak & Countdown — Native Android Application

Complete Kotlin, Room SQLite, AppWidgetProvider, and RemoteViews implementation for Android 12+.

## Architecture & Features
- **Android 12+ Optimization**: Target SDK 34, `FLAG_IMMUTABLE` on all PendingIntents, dynamic color compatibility, and background intent filters.
- **OEM Compatibility**: Tested structure for Vivo, Oppo, Samsung, iQOO, and Motorola devices with reboot recovery (`RECEIVE_BOOT_COMPLETED`).
- **Two Genuine Home-Screen Widgets**:
  - **Compact Widget** (`2x1`): Goal name, countdown, streak, working Check-in button.
  - **Large Widget** (`4x2`): Goal name, target date, large countdown digits, streak, longest streak, last check-in, missed-day count, countdown velocity difference, and working Check-in button.
- **Zero-App-Open Check-Ins**: The widget check-in button dispatches to `WidgetCheckInReceiver`, inserting directly into the shared Room SQLite database without launching the app UI.
- **Offline & Private**: 100% offline local storage, zero accounts, zero analytics, zero network requests.

---

## How to Build the APK on Replit, Termux, or PC

### Option 1: On your Android Phone (Replit / Termux Shell)
```bash
# Ensure execution permissions for gradle wrapper
chmod +x ./gradlew

# Build debug APK
./gradlew assembleDebug

# Output APK location:
# app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: Android Studio
1. Open Android Studio.
2. Select **Open** and choose this project folder.
3. Wait for Gradle sync to complete.
4. Click **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
5. Install `app-debug.apk` directly on your Android phone!

### Option 3: GitHub Actions
Push this repository to GitHub. The included Gradle build configuration works with standard `gradle-build-action` on GitHub Actions to compile and upload an installable APK artifact automatically.

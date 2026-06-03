# Android TWA Build Runbook

This runbook standardizes the process of wrapping the Angel AI Next-PWA into a native Android application (.apk / .aab) utilizing Google's Bubblewrap CLI, ensuring compliance with the Google Play Store.

## Prerequisites
- Node.js installed
- JDK 11+ installed
- Android SDK command-line tools installed

## 1. Environment Setup
Bubblewrap requires a one-time environment initialization to locate your Java and Android SDK bins.

```bash
npm i -g @bubblewrap/cli
bubblewrap doctor
```
Follow the prompts to supply paths. If you are missing the SDK, Bubblewrap can download it.

## 2. Initialize the Project
Initialize the wrapper within a dedicated build directory. This pulls configuration from the PWA manifest.

```bash
mkdir -p .agent/twa-build
cd .agent/twa-build
bubblewrap init --manifest https://your-production-url.com/manifest.json
```
Answer the interactive prompts:
- **Domain**: `your-production-url.com`
- **URL path**: `/`
- **Application name**: `Angel AI`
- **Short name**: `Angel`
- **Application ID**: `ai.angel.app`
- **Display mode**: `standalone`

## 3. Configure Key Signing
During `init`, Bubblewrap will prompt to create a keystore.
**CRITICAL**: Save the alias and password securely. You cannot upload app updates to Google Play if you lose this keystore.

## 4. Build the App
Once initialized, compile the project.

```bash
bubblewrap build
```

This generates `app-release-bundle.aab` (for Google Play Console) and `app-release.apk` (for direct sideloading or testing).

## 5. Assetlinks Handshake Validation
For the Chrome Custom Tab address bar to disappear, the Android App SHA256 must match the `assetlinks.json` file hosted on your domain.

1. Extract the SHA256 from your generated keystore:
   ```bash
   keytool -list -v -keystore android.keystore
   ```
2. Paste the `SHA256` digest into the `public/.well-known/assetlinks.json` array.
3. Deploy Angel AI to production.
4. Install the `.apk` on an Android device to verify the URL bar is hidden.

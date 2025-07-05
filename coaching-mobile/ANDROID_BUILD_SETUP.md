# 🤖 Android APK Build with GitHub Actions

This guide will help you set up automated Android APK builds using GitHub Actions and EAS Build.

## 🚀 Quick Setup

### Step 1: Get Your Expo Token

1. **Create an Expo account** (if you don't have one):
   - Go to [expo.dev](https://expo.dev)
   - Sign up with your GitHub account

2. **Generate an access token**:
   - Go to [expo.dev/accounts/settings](https://expo.dev/accounts/settings)
   - Click "Access tokens"
   - Click "Create token"
   - Name it: `GitHub Actions`
   - Copy the token (you'll need it in the next step)

### Step 2: Add Token to GitHub Secrets

1. **Go to your GitHub repository**
2. **Navigate to Settings > Secrets and variables > Actions**
3. **Click "New repository secret"**
4. **Add the secret**:
   - Name: `EXPO_TOKEN`
   - Value: (paste your Expo token here)
5. **Click "Add secret"**

### Step 3: Push Your Code

1. **Commit and push your changes**:
   ```bash
   git add .
   git commit -m "Add Android build workflow"
   git push origin main
   ```

2. **The build will start automatically!**

## 📱 How to Download Your APK

### Option 1: From EAS Dashboard (Recommended)
1. Go to [expo.dev](https://expo.dev)
2. Sign in with your account
3. Navigate to your project
4. Click on "Builds" tab
5. Download the APK when it's ready (usually 5-10 minutes)

### Option 2: Manual Trigger
1. Go to your GitHub repository
2. Navigate to **Actions** tab
3. Click **"Build Android APK"** workflow
4. Click **"Run workflow"** button
5. Wait for completion, then check EAS Dashboard

## 📋 Installation on Android Device

### Enable Unknown Apps
1. Go to **Settings > Security**
2. Enable **"Install unknown apps"** or **"Unknown sources"**
3. Choose your file manager app

### Install APK
1. Download the APK file to your Android device
2. Open the file manager
3. Tap the APK file
4. Follow the installation prompts
5. Grant necessary permissions

## 🔧 Troubleshooting

### Build Fails
- Check that `EXPO_TOKEN` secret is set correctly
- Verify your Expo account has access to the project
- Make sure all dependencies are listed in `package.json`

### APK Not Available
- Builds typically take 5-10 minutes
- Check the EAS Dashboard for build status
- Look for error messages in the GitHub Actions logs

### Installation Issues
- Ensure "Install unknown apps" is enabled
- Try installing via different file manager
- Check Android version compatibility

## 🌟 Features Available in APK

✅ **Full Native Features:**
- Video calling with Stream.io
- Push notifications
- All native device capabilities
- Optimized performance

❌ **Not Available in Expo Go:**
- Video calling
- Some native modules
- Production-level performance

## 🔄 Automatic Builds

The workflow automatically triggers when:
- You push to `main` branch
- You make changes to the mobile app folder
- You manually trigger it from GitHub Actions

## 📊 Build Status

You can check build status:
- **GitHub Actions**: Shows workflow progress
- **EAS Dashboard**: Shows detailed build logs
- **Expo CLI**: `npx eas build:list`

## 🛠️ Advanced Configuration

### Custom Build Profile
Edit `eas.json` to customize build settings:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

### Environment Variables
Add environment variables to the workflow:
```yaml
env:
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
  CUSTOM_VAR: ${{ secrets.CUSTOM_VAR }}
```

---

## 🎉 You're All Set!

Once configured, you'll have:
- ✅ Automated Android APK builds
- ✅ Easy download from EAS Dashboard
- ✅ Full native features in your app
- ✅ No need for Windows/Mac limitations

**Happy testing!** 🚀 
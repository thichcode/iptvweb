param([string]$Version = "")
# Build Android TV APK locally and optionally upload to GitHub Releases.
#   .\scripts\build-tv.ps1              # just build, outputs WebPhimTV.apk
#   .\scripts\build-tv.ps1 v1.0.0       # build + create GitHub Release

$ErrorActionPreference = "Stop"

# --- Build TV web assets to dist-tv/ ---
$tvDir = "dist-tv"
if (-not (Test-Path $tvDir)) { New-Item -ItemType Directory -Path $tvDir | Out-Null }
Copy-Item public/tv.html "$tvDir/index.html" -Force
Copy-Item public/hls.min.js "$tvDir/hls.min.js" -Force
Copy-Item public/sw.js "$tvDir/sw.js" -Force
Copy-Item assets/app-icon.png "$tvDir/app-icon.png" -Force
Write-Host "TV web assets → $tvDir/"

# --- Add/sync Android platform ---
if (-not (Test-Path android-tv)) {
  npx cap add android --config capacitor.config.tv.json
  if (-not $?) { exit 1 }
}
npx cap sync android --config capacitor.config.tv.json
if (-not $?) { exit 1 }

# --- TV patches ---
$res = "android-tv/app/src/main/res"
$manifest = "android-tv/app/src/main/AndroidManifest.xml"

# App icon
foreach ($dir in @("mipmap-hdpi","mipmap-mdpi","mipmap-xhdpi","mipmap-xxhdpi","mipmap-xxxhdpi")) {
  Copy-Item assets/app-icon.png "$res/$dir/ic_launcher.png" -Force
  Copy-Item assets/app-icon.png "$res/$dir/ic_launcher_foreground.png" -Force
}
Remove-Item "$res/mipmap-anydpi-v26/ic_launcher_foreground.xml" -ErrorAction SilentlyContinue

# TV banner
foreach ($dir in @("mipmap-hdpi","mipmap-mdpi","mipmap-xhdpi","mipmap-xxhdpi","mipmap-xxxhdpi")) {
  Copy-Item assets/tv_banner.png "$res/$dir/tv_banner.png" -Force
}
Copy-Item assets/tv_banner.png "$res/drawable/tv_banner.png" -Force

# Patch AndroidManifest.xml for Android TV
(Get-Content $manifest -Raw) `
  -replace '</manifest>', "  <uses-feature android:name=`"android.hardware.touchscreen`" android:required=`"false`" />`n  <uses-feature android:name=`"android.software.leanback`" android:required=`"false`" />`n  <uses-feature android:name=`"android.hardware.screen.landscape`" android:required=`"false`" />`n</manifest>" `
  -replace 'android:supportsRtl="true"', "android:supportsRtl=`"true`"`n        android:banner=`"@drawable/tv_banner`"" `
  -replace 'android:exported="true"', "android:exported=`"true`"`n            android:resizeableActivity=`"true`"" `
  -replace '<category android:name="android.intent.category.LAUNCHER" />', "<category android:name=`"android.intent.category.LAUNCHER`" />`n                <category android:name=`"android.intent.category.LEANBACK_LAUNCHER`" />" |
  Set-Content $manifest -NoNewline

# Patch build.gradle with signing config
$gradle = "android-tv/app/build.gradle"
(Get-Content $gradle -Raw) `
  -replace '^android \{', "android {`n    signingConfigs {`n        debug {`n            storeFile file(`"../../certs/debug.keystore`")`n            storePassword `"android`"`n            keyAlias `"androiddebugkey`"`n            keyPassword `"android`"`n        }`n    }" `
  -replace 'buildTypes \{', "buildTypes {`n        debug {`n            signingConfig signingConfigs.debug`n        }" |
  Set-Content $gradle -NoNewline

# --- Build ---
Push-Location android-tv
./gradlew assembleDebug; if (-not $?) { Pop-Location; exit 1 }
Pop-Location
Copy-Item android-tv/app/build/outputs/apk/debug/app-debug.apk WebPhimTV.apk -Force
Write-Host "TV APK: WebPhimTV.apk"

if ($Version) {
  gh release create $Version --title "$Version (TV)" --notes "APK cho Android TV" WebPhimTV.apk
  if ($?) { Write-Host "Release $Version (TV) created" }
}

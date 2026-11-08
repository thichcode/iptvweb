param([string]$Version = "")
# Build APK locally and optionally upload to GitHub Releases.
#   .\scripts\build-apk.ps1              # just build, outputs WebPhim.apk
#   .\scripts\build-apk.ps1 v1.0.0       # build + create GitHub Release

$ErrorActionPreference = "Stop"

# Auto-detect Android SDK if not already set
if (-not $env:ANDROID_HOME -and (Test-Path "D:\pupeteer\sdk")) {
  $env:ANDROID_HOME = "D:\pupeteer\sdk"
}

# Ensure Android platform project is scaffolded
if (-not (Test-Path "android/app/build.gradle")) {
  if (Test-Path android) { Remove-Item -Recurse -Force android }
  npx cap add android
  if ($LASTEXITCODE -ne 0) { exit 1 }
}

npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

npx cap sync android
if ($LASTEXITCODE -ne 0) { exit 1 }

# Set sdk.dir in local.properties
if ($env:ANDROID_HOME) {
  $sdkEscaped = $env:ANDROID_HOME.Replace("\", "\\")
  Set-Content "android/local.properties" "sdk.dir=$sdkEscaped"
}

# --- TV patches (mirror release-apk.yml) ---
$res = "android/app/src/main/res"
$manifest = "android/app/src/main/AndroidManifest.xml"

# App icon → all densities
foreach ($dir in @("mipmap-hdpi","mipmap-mdpi","mipmap-xhdpi","mipmap-xxhdpi","mipmap-xxxhdpi")) {
  Copy-Item assets/app-icon.png "$res/$dir/ic_launcher.png" -Force
  Copy-Item assets/app-icon.png "$res/$dir/ic_launcher_foreground.png" -Force
}
Remove-Item "$res/mipmap-anydpi-v26/ic_launcher_foreground.xml" -ErrorAction SilentlyContinue

# TV banner → mipmap + drawable
foreach ($dir in @("mipmap-hdpi","mipmap-mdpi","mipmap-xhdpi","mipmap-xxhdpi","mipmap-xxxhdpi")) {
  Copy-Item assets/tv_banner.png "$res/$dir/tv_banner.png" -Force
}
Copy-Item assets/tv_banner.png "$res/drawable/tv_banner.png" -Force

# --- UpdatePlugin & FileProvider patches ---
$xmlDir = "$res/xml"
if (-not (Test-Path $xmlDir)) { New-Item -ItemType Directory -Path $xmlDir -Force | Out-Null }
Copy-Item "android-template/res/xml/file_paths.xml" "$xmlDir/file_paths.xml" -Force

$pkgDir = "android/app/src/main/java/com/webphim/app"
if (-not (Test-Path $pkgDir)) { New-Item -ItemType Directory -Path $pkgDir -Force | Out-Null }
(Get-Content "android-template/UpdatePlugin.java" -Raw) `
  -replace '__PACKAGE_NAME__', 'package com.webphim.app;' |
  Set-Content "$pkgDir/UpdatePlugin.java" -NoNewline

$mainActivity = "$pkgDir/MainActivity.java"
if (Test-Path $mainActivity) {
  $actContent = Get-Content $mainActivity -Raw
  if (-not $actContent.Contains("registerPlugin(UpdatePlugin.class)")) {
    $actContent = $actContent -replace "public class MainActivity extends BridgeActivity \{", "public class MainActivity extends BridgeActivity {`n    @Override`n    public void onCreate(android.os.Bundle savedInstanceState) {`n        registerPlugin(UpdatePlugin.class);`n        super.onCreate(savedInstanceState);`n    }"
    Set-Content $mainActivity $actContent -NoNewline
  }
}

# Patch AndroidManifest.xml for Android TV & In-App Update
$providerXml = "        <provider`n            android:name=`"androidx.core.content.FileProvider`"`n            android:authorities=`"`${applicationId}.fileprovider`"`n            android:exported=`"false`"`n            android:grantUriPermissions=`"true`">`n            <meta-data`n                android:name=`"android.support.FILE_PROVIDER_PATHS`"`n                android:resource=`"@xml/file_paths`" />`n        </provider>"
(Get-Content $manifest -Raw) `
  -replace '</manifest>', "  <uses-permission android:name=`"android.permission.REQUEST_INSTALL_PACKAGES`" />`n  <uses-feature android:name=`"android.hardware.touchscreen`" android:required=`"false`" />`n  <uses-feature android:name=`"android.software.leanback`" android:required=`"false`" />`n  <uses-feature android:name=`"android.hardware.screen.landscape`" android:required=`"false`" />`n</manifest>" `
  -replace 'android:supportsRtl="true"', "android:supportsRtl=`"true`"`n        android:banner=`"@drawable/tv_banner`"" `
  -replace 'android:exported="true"', "android:exported=`"true`"`n            android:resizeableActivity=`"true`"" `
  -replace '</application>', "$providerXml`n    </application>" `
  -replace '<category android:name="android.intent.category.LAUNCHER" />', "<category android:name=`"android.intent.category.LAUNCHER`" />`n                <category android:name=`"android.intent.category.LEANBACK_LAUNCHER`" />" |
  Set-Content $manifest -NoNewline

# Patch build.gradle with debug signing config
$gradle = "android/app/build.gradle"
$gradleContent = Get-Content $gradle -Raw
if (-not $gradleContent.Contains("signingConfigs {")) {
  $gradleContent = $gradleContent `
    -replace 'android \{', "android {`n    signingConfigs {`n        debug {`n            storeFile file(`"../../certs/debug.keystore`")`n            storePassword `"android`"`n            keyAlias `"androiddebugkey`"`n            keyPassword `"android`"`n        }`n    }" `
    -replace 'buildTypes \{', "buildTypes {`n        debug {`n            signingConfig signingConfigs.debug`n        }"
  Set-Content $gradle $gradleContent -NoNewline
}

# --- Build ---
Push-Location android
if ($IsWindows -or $env:OS -like "*Windows*") {
  cmd /c "gradlew.bat assembleDebug"
} else {
  chmod +x gradlew
  ./gradlew assembleDebug
}
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location
Copy-Item android/app/build/outputs/apk/debug/app-debug.apk WebPhim.apk -Force
Write-Host "APK: WebPhim.apk"

if ($Version) {
  gh release create $Version --title $Version --notes "APK cho Android TV" WebPhim.apk
  if ($?) { Write-Host "Release $Version created" }
}

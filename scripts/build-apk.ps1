param([string]$Version = "")
# Build APK locally and optionally upload to GitHub Releases.
#   .\scripts\build-apk.ps1              # just build, outputs WebPhim.apk
#   .\scripts\build-apk.ps1 v1.0.0       # build + create GitHub Release

if (-not (Test-Path android)) { npx cap add android; if (-not $?) { exit 1 } }
npm run build; if (-not $?) { exit 1 }
npx cap sync android; if (-not $?) { exit 1 }
Push-Location android
./gradlew assembleDebug; if (-not $?) { exit 1 }
Pop-Location
Copy-Item android/app/build/outputs/apk/debug/app-debug.apk WebPhim.apk -Force
Write-Host "APK: WebPhim.apk"

if ($Version) {
  gh release create $Version --title $Version --notes "APK cho Android TV" WebPhim.apk
  if ($?) { Write-Host "Release $Version created" }
}

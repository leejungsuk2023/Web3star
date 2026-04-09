# Google Play 업로드용 릴리스 AAB 생성
# 선행: android/ 에 업로드 키스토어 + keystore.properties (android/keystore.properties.example 참고)
# 산출물: android/app/build/outputs/bundle/release/app-release.aab

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
  $asJbr = "${env:ProgramFiles}\Android\Android Studio\jbr"
  if (Test-Path "$asJbr\bin\java.exe") {
    $env:JAVA_HOME = $asJbr
  } else {
    $adopt = Get-ChildItem "${env:ProgramFiles}\Eclipse Adoptium" -Directory -Filter "jdk-*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($adopt -and (Test-Path "$($adopt.FullName)\bin\java.exe")) {
      $env:JAVA_HOME = $adopt.FullName
    }
  }
}

if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
  Write-Error "JAVA_HOME not set. Install Android Studio or JDK 17+."
}

$props = Join-Path $root "android\keystore.properties"
if (-not (Test-Path $props)) {
  Write-Host ""
  Write-Host "=== Missing android/keystore.properties ===" -ForegroundColor Yellow
  Write-Host "Step 1 - Create upload keystore once (save passwords safely):"
  Write-Host '  keytool -genkeypair -v -keystore android\web3star-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload'
  Write-Host ""
  Write-Host "Step 2 - Copy android\keystore.properties.example to android\keystore.properties and fill storePassword/keyPassword."
  Write-Host ""
  exit 1
}

$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:VITE_DEPLOY_TARGET = 'app'
$env:VITE_BASE_PATH = '/'

npm run build:app
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location (Join-Path $root "android")
.\gradlew.bat bundleRelease --no-daemon
$code = $LASTEXITCODE
Pop-Location

if ($code -ne 0) { exit $code }

$aab = Join-Path $root "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aab) {
  $len = (Get-Item $aab).Length
  Write-Host "OK: $aab ($len bytes)" -ForegroundColor Green
  Write-Host "Upload this .aab to Play Console > Internal testing > App bundles."
} else {
  Write-Warning "AAB not found at expected path."
}

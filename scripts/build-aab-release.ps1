# Google Play 업로드용 릴리스 AAB 생성
# 산출물: android/app/build/outputs/bundle/release/app-release.aab
#
# 서명 (택1):
#   A) android/keystore.properties + web3star-upload.jks (example 참고)
#   B) 환경 변수 WEB3STAR_STORE_PASSWORD + WEB3STAR_KEY_PASSWORD
#      → %USERPROFILE%\.web3star\release-signing.ps1 에 두고 이 스크립트가 자동 로드
#
# Android Studio에서만 Bundle 만들지 말 것. 먼저 이 스크립트가 build:app + cap sync 포함.

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

# Optional local secrets (not in repo): passwords for env-based Gradle signing
$signingSecretsDir = Join-Path $env:USERPROFILE ".web3star"
$signingSecrets = Join-Path $signingSecretsDir "release-signing.ps1"
if (Test-Path $signingSecrets) {
  Write-Host "Loading: $signingSecrets" -ForegroundColor DarkGray
  . $signingSecrets
}

$props = Join-Path $root "android\keystore.properties"
$jks = Join-Path $root "android\web3star-upload.jks"
if (-not (Test-Path $jks)) {
  $parentJks = Join-Path (Split-Path $root -Parent) "android\web3star-upload.jks"
  if (Test-Path $parentJks) {
    Copy-Item -Force $parentJks $jks
    Write-Host "Copied web3star-upload.jks from parent Web3star-1\android\" -ForegroundColor Green
  }
}

$hasEnv = [bool]$env:WEB3STAR_STORE_PASSWORD -and [bool]$env:WEB3STAR_KEY_PASSWORD
if (-not (Test-Path $props) -and -not $hasEnv) {
  Write-Host ""
  Write-Host "=== Release signing not configured ===" -ForegroundColor Yellow
  Write-Host "Option A: Copy android\keystore.properties.example -> android\keystore.properties and fill passwords."
  Write-Host "Option B: Create: $signingSecrets"
  Write-Host "  (see scripts\web3star-release-signing.EXAMPLE.ps1)"
  Write-Host ""
  exit 1
}

if (-not (Test-Path $jks)) {
  Write-Host "Missing android\web3star-upload.jks — place Play upload keystore there or copy from ..\android\" -ForegroundColor Red
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

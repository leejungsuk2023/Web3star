# Debug APK: Vite(app) -> cap sync -> Gradle assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
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
  Write-Error "JAVA_HOME not set and no bundled JDK found. Install Android Studio or JDK 17+ and set JAVA_HOME."
}

$env:Path = "$env:JAVA_HOME\bin;$env:Path"

npm run build:app
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location android
.\gradlew.bat assembleDebug --no-daemon
$code = $LASTEXITCODE
Pop-Location

if ($code -ne 0) { exit $code }

$apk = Join-Path $root "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
  $len = (Get-Item $apk).Length
  Write-Host "OK: $apk ($len bytes)"
} else {
  Write-Warning "APK not found at expected path."
}

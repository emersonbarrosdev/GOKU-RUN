$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Android/Sdk' }
    if (-not (Test-Path -LiteralPath $env:ANDROID_HOME)) { throw 'Android SDK não encontrado. Instale pelo Android Studio ou configure ANDROID_HOME.' }
    if (-not $env:JAVA_HOME) { $env:JAVA_HOME=Split-Path -Parent (Split-Path -Parent (Get-Command java).Source) }
    & npm.cmd run build
    if($LASTEXITCODE -ne 0){throw 'Falha no build web.'}
    & npx.cmd cap sync android
    if($LASTEXITCODE -ne 0){throw 'Falha ao sincronizar Android.'}
    Push-Location (Join-Path $projectRoot 'android')
    try { & .\gradlew.bat assembleDebug --console=plain; if($LASTEXITCODE -ne 0){throw 'Falha ao gerar APK.'} }
    finally {Pop-Location}
    $releases=Join-Path $projectRoot 'releases'
    New-Item -ItemType Directory -Path $releases -Force | Out-Null
    $apk=Join-Path $releases 'goku-run-debug.apk'
    Copy-Item -LiteralPath (Join-Path $projectRoot 'android/app/build/outputs/apk/debug/app-debug.apk') -Destination $apk -Force
    Write-Output "APK de teste: $apk"
    Get-FileHash -LiteralPath $apk -Algorithm SHA256
} finally {Pop-Location}

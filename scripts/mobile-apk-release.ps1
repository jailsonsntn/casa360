$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $projectRoot 'android'
$localPropertiesPath = Join-Path $androidDir 'local.properties'

$sdkPath = $env:ANDROID_HOME
if (-not $sdkPath) {
    $sdkPath = $env:ANDROID_SDK_ROOT
}
if (-not $sdkPath) {
    $defaultSdk = 'C:/Users/jails/AppData/Local/Android/Sdk'
    if (Test-Path $defaultSdk) {
        $sdkPath = $defaultSdk
    }
}
if (-not $sdkPath -or -not (Test-Path $sdkPath)) {
    throw 'SDK Android nao encontrado. Defina ANDROID_HOME ou ANDROID_SDK_ROOT com um caminho valido.'
}

"sdk.dir=$sdkPath" | Set-Content -Path $localPropertiesPath -Encoding ASCII

$androidStudioJbr = 'C:/Program Files/Android/Android Studio/jbr'
if (Test-Path $androidStudioJbr) {
    $env:JAVA_HOME = $androidStudioJbr
    $env:Path = "$($env:JAVA_HOME)/bin;$($env:Path)"
}

$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
$env:Path = "$sdkPath/platform-tools;$sdkPath/emulator;$($env:Path)"

Write-Host "SDK configurado em: $sdkPath"
Write-Host "JAVA_HOME em uso: $env:JAVA_HOME"
Write-Host 'Executando build de APK release...'

Push-Location $projectRoot
try {
    npm run apk:release
} finally {
    Pop-Location
}

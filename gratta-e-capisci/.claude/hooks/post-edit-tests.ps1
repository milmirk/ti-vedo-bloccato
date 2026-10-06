# PostToolUse (Write|Edit|MultiEdit): dopo ogni modifica a app/*.js|html esegue i test.
# Se falliscono, exit 2: l'output torna all'agente, che deve correggere prima di proseguire.
$in = [Console]::In.ReadToEnd() | ConvertFrom-Json
$path = [string]$in.tool_input.file_path
if ($path -notmatch '[\\/]app[\\/].*\.(js|html)$') { exit 0 }
$runner = Join-Path $PSScriptRoot "..\..\app\tests\run-tests.ps1"
if (-not (Test-Path $runner)) { exit 0 }
$out = & powershell -NoProfile -ExecutionPolicy Bypass -File $runner 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("Test FALLITI dopo la modifica di ${path}:`n$out")
    exit 2
}
exit 0

# Allinea agents/ alla configurazione agentica reale (.claude/ + CLAUDE.md).
# Va eseguito prima di ogni push: il regolamento vuole la struttura agentica in agents/.
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root ".claude"
foreach ($d in "agents", "skills", "hooks", "commands") {
    $from = Join-Path $src $d
    $to = Join-Path $PSScriptRoot $d
    if (Test-Path $to) { Remove-Item $to -Recurse -Force }
    if (Test-Path $from) { Copy-Item $from $to -Recurse }
}
Copy-Item (Join-Path $src "settings.json") (Join-Path $PSScriptRoot "settings.json") -ErrorAction SilentlyContinue
Copy-Item (Join-Path $root "CLAUDE.md") (Join-Path $PSScriptRoot "CLAUDE.md")
Write-Output "agents/ allineata a .claude/ ($(Get-Date -Format 'HH:mm'))"

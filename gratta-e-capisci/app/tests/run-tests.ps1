# Esegue app/tests/tests.html in Edge headless e restituisce exit code 1 se almeno un test fallisce.
# Guardrail T2-V3 (leva L4): scansione statica dei testi dell'app. Il browser su file:// non può leggere
# index.html e ui.js, quindi il controllo si fa qui. Stessa lista di .claude/hooks/guardrail-t2.ps1.
$formule = 'conviene','ti consiglio','ti consigliamo','smetti','gioca meno','dovresti smettere','dovresti giocare','non giocare','faresti meglio'
$appDir = Split-Path $PSScriptRoot -Parent
$sorgenti = @(Join-Path $appDir "index.html") + (Get-ChildItem (Join-Path $appDir "src"), (Join-Path $appDir "data") -Filter *.js | ForEach-Object FullName)
$trovate = foreach ($f in $formule) { Select-String -Path $sorgenti -Pattern ([regex]::Escape($f)) | ForEach-Object { "$($_.Filename):$($_.LineNumber) '$f'" } }
if ($trovate) { Write-Output "FAIL guardrail T2-V3: formule da consiglio o giudizio nei testi dell'app:"; $trovate; exit 1 }
Write-Output "ok   guardrail T2-V3: nessuna formula vietata in index.html, src/*.js, data/*.js ($($sorgenti.Count) file)"

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
$page = "file:///" + ((Join-Path $PSScriptRoot "tests.html") -replace '\\', '/')
$edgeData = Join-Path $env:TEMP "hagenthon-edge-tests"
$dom = & $edge --headless=new --disable-gpu --no-first-run --user-data-dir="$edgeData" --virtual-time-budget=5000 --dump-dom $page 2>$null | Out-String
$m = [regex]::Match($dom, '(?s)<pre id="result">(.*?)</pre>')
if (-not $m.Success) { Write-Output "Impossibile leggere i risultati dei test (Edge headless)."; exit 1 }
$result = [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value)
Write-Output $result
if ($result -match 'RISULTATO: \d+ passati, 0 falliti') { exit 0 } else { exit 1 }

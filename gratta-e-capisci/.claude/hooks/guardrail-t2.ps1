# PreToolUse (Write|Edit|MultiEdit): guardrail T2-V3 (Tema 02) della leva L4 di "Fortuna in Chiaro".
# Blocca in app/ (esclusi app/tests/ e i file .md) testi con formule da consiglio o giudizio
# sul gioco d'azzardo. L'app deve informare, mai consigliare o giudicare.
# Exit 2 = azione bloccata; il messaggio su stderr torna all'agente.
$in = [Console]::In.ReadToEnd() | ConvertFrom-Json
$path = [string]$in.tool_input.file_path

# Si applica solo dentro app/, con le eccezioni app/tests/ e i file Markdown.
$normalized = $path -replace '\\', '/'
if ($normalized -notmatch '(^|/)app/') { exit 0 }
if ($normalized -match '(^|/)app/tests/') { exit 0 }
if ($normalized -match '\.md$') { exit 0 }

$editsText = ($in.tool_input.edits | ForEach-Object { $_.new_string }) -join ' '
$text = "$($in.tool_input.content) $($in.tool_input.new_string) $editsText"

# Lista stretta (T2-V3), case-insensitive: formule da consiglio o giudizio.
$formule = @(
    'conviene',
    'ti consiglio',
    'ti consigliamo',
    'smetti',
    'gioca meno',
    'dovresti smettere',
    'dovresti giocare',
    'non giocare',
    'faresti meglio'
)
foreach ($f in $formule) {
    if ($text -match [regex]::Escape($f)) {
        [Console]::Error.WriteLine("BLOCCATO da guardrail-t2.ps1: il testo contiene la formula vietata '$f'. Vincolo T2-V3 (Tema 02): l'app informa con dati e scale di confronto, non da' consigli ne' giudizi su smettere o giocare meno. Riformula in modo neutro (es. 'servirebbero...', 'in media...').")
        exit 2
    }
}
exit 0

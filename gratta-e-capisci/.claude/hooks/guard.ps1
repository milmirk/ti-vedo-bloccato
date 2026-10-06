# PreToolUse (Write|Edit|MultiEdit): blocca le scritture nella fonte di verita' e i segreti.
# Exit 2 = azione bloccata; il messaggio su stderr torna all'agente.
$in = [Console]::In.ReadToEnd() | ConvertFrom-Json
$path = [string]$in.tool_input.file_path
if ($path -match '[\\/]00_input[\\/]') {
    [Console]::Error.WriteLine("BLOCCATO da guard.ps1: 00_input/ contiene i documenti ufficiali dell'hackathon ed e' in sola lettura.")
    exit 2
}
$text = "$($in.tool_input.content) $($in.tool_input.new_string) $($in.tool_input.edits | ForEach-Object { $_.new_string })"
if ($text -match 'sk-ant-[A-Za-z0-9_\-]{10,}') {
    [Console]::Error.WriteLine("BLOCCATO da guard.ps1: il contenuto sembra una API key Anthropic. Usa una variabile d'ambiente o un campo da compilare a runtime, mai una chiave nel codice.")
    exit 2
}
exit 0

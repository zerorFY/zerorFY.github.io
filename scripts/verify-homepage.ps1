$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$indexPath = Join-Path $root 'index.html'
$logoPath = Join-Path $root 'assets\zeror-mark.svg'

if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
    throw 'Missing index.html'
}

if (-not (Test-Path -LiteralPath $logoPath -PathType Leaf)) {
    throw 'Missing main logo asset: assets/zeror-mark.svg'
}

$html = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8

if ($html -notmatch 'alt="Zeror logo"') {
    throw 'Homepage must render the main logo with accessible alt text'
}

if ($html -notmatch 'href="/mathpuzzle/"') {
    throw 'Homepage must link to /mathpuzzle/'
}

if ($html -notmatch 'Puzzle Generator') {
    throw 'Homepage must include the math puzzle project title'
}

Write-Host 'Homepage verification passed.'

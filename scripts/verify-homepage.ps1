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

$requiredSections = @(
    'id="featured"',
    'id="learning"',
    'id="tools"',
    'id="experiments"',
    'id="external"'
)

foreach ($section in $requiredSections) {
    if ($html -notmatch [regex]::Escape($section)) {
        throw "Homepage must include section $section"
    }
}

$requiredLinks = @(
    '/trackers/',
    '/mathpuzzle/',
    '/shirt/',
    'https://zerorfy-tradetest.streamlit.app/',
    '/ai-fluency-learning/',
    '/kids-math-practice/',
    '/3D-CUBES-beta/'
)

foreach ($link in $requiredLinks) {
    $escaped = [regex]::Escape("href=`"$link`"")
    if ($html -notmatch $escaped) {
        throw "Homepage must link to $link"
    }
}

$requiredLabels = @(
    'Featured',
    'Learning',
    'Tools',
    'Experiments',
    'External Apps',
    'Static',
    'Live App'
)

foreach ($label in $requiredLabels) {
    if ($html -notmatch [regex]::Escape($label)) {
        throw "Homepage must include label $label"
    }
}

if ($html -notmatch 'Puzzle Generator') {
    throw 'Homepage must include the math puzzle project title'
}

if ($html -match 'sophia-tracker' -or $html -match '>lora<') {
    throw 'Homepage should not list sophia-tracker or lora separately; they belong under trackers'
}

Write-Host 'Homepage verification passed.'

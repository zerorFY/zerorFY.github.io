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
    '/math-kangaroo/',
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

if ($html -notmatch 'Math Kangaroo Photo Upload') {
    throw 'Homepage must include the Math Kangaroo upload project title'
}

if ($html -match 'sophia-tracker' -or $html -match '>lora<') {
    throw 'Homepage should not list sophia-tracker or lora separately; they belong under trackers'
}


$mathKangarooPath = Join-Path $root 'math-kangaroo\index.html'
if (-not (Test-Path -LiteralPath $mathKangarooPath -PathType Leaf)) {
    throw 'Missing math-kangaroo/index.html'
}

$mathKangarooHtml = Get-Content -LiteralPath $mathKangarooPath -Raw -Encoding UTF8
$appsScriptUrl = 'https://script.google.com/macros/s/AKfycbzd0u8UVG4-8lVw1MJz4rqtNg3Fxdt7kWNvz2s8zq8hPsB8peZXKq0iN2JX4LXPsXIx/exec'
if ($mathKangarooHtml -notmatch [regex]::Escape($appsScriptUrl)) {
    throw 'Math Kangaroo wrapper must include the deployed Apps Script URL'
}
if ($mathKangarooHtml -match [regex]::Escape("APPS_SCRIPT_WEB_APP_URL.includes('$appsScriptUrl')")) {
    throw 'Math Kangaroo wrapper must not treat the deployed Apps Script URL as the placeholder'
}
if ($mathKangarooHtml -notmatch [regex]::Escape("APPS_SCRIPT_WEB_APP_URL.includes('PASTE_APPS_SCRIPT_WEB_APP_URL_HERE')")) {
    throw 'Math Kangaroo wrapper must keep the placeholder-only configuration guard'
}


$appsScriptIndexPath = Join-Path $root 'math-kangaroo\apps-script\Index.html'
if (-not (Test-Path -LiteralPath $appsScriptIndexPath -PathType Leaf)) {
    throw 'Missing math-kangaroo/apps-script/Index.html'
}

$appsScriptIndexHtml = Get-Content -LiteralPath $appsScriptIndexPath -Raw -Encoding UTF8
$requiredMathKangarooText = @(
    'I confirm that I took these photos or have permission to upload them. If children appear in the photos, I confirm that I have permission to share them. I understand that anyone with this page link may view and download these photos.',
    'Photo Download Notice',
    'These photos are for personal, non-commercial use only. Please do not publicly repost or misuse photos containing other people, especially children.',
    'I Agree and Download',
    'Anyone with this link can view and download these photos. Please do not share this link publicly.',
    'To request the removal of a photo, please contact:',
    'hello@zeror.ca'
)

foreach ($text in $requiredMathKangarooText) {
    if ($appsScriptIndexHtml -notmatch [regex]::Escape($text)) {
        throw "Math Kangaroo upload page missing required text: $text"
    }
}

$requiredMathKangarooSnippets = @(
    'id="uploadConsent"',
    'sessionStorage.getItem',
    'downloadNoticeAccepted',
    'pendingDownloadUrl',
    'showDownloadNotice',
    'handleDownloadClick'
)

foreach ($snippet in $requiredMathKangarooSnippets) {
    if ($appsScriptIndexHtml -notmatch [regex]::Escape($snippet)) {
        throw "Math Kangaroo upload page missing required behavior snippet: $snippet"
    }
}

$qrPath = Join-Path $root 'math-kangaroo\math-kangaroo-qr.png'
if (-not (Test-Path -LiteralPath $qrPath -PathType Leaf)) {
    throw 'Missing math-kangaroo QR code image'
}

Write-Host 'Homepage verification passed.'


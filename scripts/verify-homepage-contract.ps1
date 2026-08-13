$ErrorActionPreference = 'Stop'

$homepage = Get-Content -LiteralPath (Join-Path $PSScriptRoot '..\index.html') -Raw

$requiredFragments = @(
    '<title>zeror.ca</title>',
    '<h1 id="hero-title">Zeror Projects</h1>',
    '<h2 id="featured-title">Featured</h2>',
    '<h2 id="learning-title">Learning</h2>',
    '<h2 id="tools-title">Tools</h2>',
    '<h2 id="experiments-title">Experiments</h2>',
    'G-PR0BY6KP92'
)

$forbiddenFragments = @(
    'Evidence-led product research',
    'GEO retrieval pilot',
    'Public content contract public-content/v1'
)

$failures = @()
foreach ($fragment in $requiredFragments) {
    if (-not $homepage.Contains($fragment)) {
        $failures += "missing required homepage fragment: $fragment"
    }
}
foreach ($fragment in $forbiddenFragments) {
    if ($homepage.Contains($fragment)) {
        $failures += "forbidden research-index fragment on homepage: $fragment"
    }
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output 'PASS: homepage identity and GA4 contract are intact.'

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$pagePath = Join-Path $repoRoot '008test\index.html'
$homePath = Join-Path $repoRoot 'index.html'
$robotsPath = Join-Path $repoRoot 'robots.txt'
$sitemapPath = Join-Path $repoRoot 'sitemap.xml'
$llmsPath = Join-Path $repoRoot 'llms.txt'
$indexNowKey = '7d4f8c9a1b2e6d3f008a5c7e9f4b2d1a'
$indexNowKeyPath = Join-Path $repoRoot "$indexNowKey.txt"

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw "Verification failed: $Message"
    }
}

Assert-True (Test-Path -LiteralPath $pagePath) '008test/index.html must exist'
Assert-True (Test-Path -LiteralPath $robotsPath) 'robots.txt must exist'
Assert-True (Test-Path -LiteralPath $sitemapPath) 'sitemap.xml must exist'
Assert-True (Test-Path -LiteralPath $llmsPath) 'llms.txt must exist'
Assert-True (Test-Path -LiteralPath $indexNowKeyPath) 'IndexNow ownership key file must exist'

$page = Get-Content -LiteralPath $pagePath -Raw -Encoding UTF8
$homepage = Get-Content -LiteralPath $homePath -Raw -Encoding UTF8
$robots = Get-Content -LiteralPath $robotsPath -Raw -Encoding UTF8
$sitemap = Get-Content -LiteralPath $sitemapPath -Raw -Encoding UTF8
$llms = Get-Content -LiteralPath $llmsPath -Raw -Encoding UTF8
$indexNowKeyBody = (Get-Content -LiteralPath $indexNowKeyPath -Raw -Encoding UTF8).Trim()

Assert-True ($page -match '<html lang="en">') 'page language must be explicit'
Assert-True ($page -match '<title>008test \| Zeror GEO Retrieval Test</title>') 'page title must identify the test'
Assert-True ($page -match '<h1[^>]*>008test</h1>') 'page must have one explicit h1'
Assert-True ($page -match 'name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"') 'page must allow indexing and full snippets'
Assert-True ($page -match 'rel="canonical" href="https://zeror.ca/008test/"') 'page must declare its canonical URL'
Assert-True ($page -match 'ZR-GEO-008') 'page must expose the test identifier'
Assert-True ($page -match 'Zeror-Atlas-008-Blue-Orbit') 'page must expose the unique verification phrase'
Assert-True ($page -match '2026-08-08') 'page must expose the publication date'
Assert-True ($page -match 'application/ld\+json') 'page must include JSON-LD'
Assert-True ($page -match 'What is the verification phrase for Zeror GEO test 008\?') 'page must include the target question'
Assert-True ($homepage -match 'href="/008test/"') 'homepage must link to the test page'
Assert-True ($robots -match 'User-agent: \*') 'robots.txt must define a general crawler policy'
Assert-True ($robots -match 'Sitemap: https://zeror.ca/sitemap.xml') 'robots.txt must advertise the sitemap'
Assert-True ($sitemap -match '<loc>https://zeror.ca/008test/</loc>') 'sitemap must list the test page'
Assert-True ($llms -match 'https://zeror.ca/008test/') 'llms.txt must list the canonical test page'
Assert-True ($llms -match 'Zeror-Atlas-008-Blue-Orbit') 'llms.txt must repeat the verification phrase'
Assert-True ($indexNowKeyBody -eq $indexNowKey) 'IndexNow key file must contain only the expected key'

$jsonLdBlocks = [regex]::Matches(
    $page,
    '<script type="application/ld\+json">(?<json>.*?)</script>',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)
Assert-True ($jsonLdBlocks.Count -gt 0) 'at least one JSON-LD block must be present'

foreach ($block in $jsonLdBlocks) {
    $null = $block.Groups['json'].Value | ConvertFrom-Json
}

[xml]$sitemapXml = $sitemap
Assert-True ($null -ne $sitemapXml.urlset) 'sitemap.xml must be valid XML'

Write-Host 'PASS: GEO test page and discovery files satisfy all local checks.'

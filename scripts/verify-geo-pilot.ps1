$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$homePath = Join-Path $repoRoot 'index.html'
$sitemapPath = Join-Path $repoRoot 'sitemap.xml'
$llmsPath = Join-Path $repoRoot 'llms.txt'
$originalPath = Join-Path $repoRoot '008test\index.html'
$expectedOriginalBlob = 'd92721128c4e06b05f4ffe69aa552e440d768172'
$expectedLlmsBlob = '0a101eab9a18ba75225631323106f7c6317d0252'
$googleVerificationFile = Join-Path $repoRoot 'googleee5d9e523463e13c.html'
$googleVerificationBody = 'google-site-verification: googleee5d9e523463e13c.html'

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw "Verification failed: $Message" }
}

$homepage = Get-Content -LiteralPath $homePath -Raw -Encoding UTF8
$sitemap = Get-Content -LiteralPath $sitemapPath -Raw -Encoding UTF8
$llms = Get-Content -LiteralPath $llmsPath -Raw -Encoding UTF8
$phrases = @()
$bodies = @()

$originalBlob = (& git -C $repoRoot hash-object --path='008test/index.html' $originalPath).Trim()
$llmsBlob = (& git -C $repoRoot hash-object --path='llms.txt' $llmsPath).Trim()
Assert-True ($originalBlob -eq $expectedOriginalBlob) 'the historical /008test/ page must remain unchanged'
Assert-True ($llmsBlob -eq $expectedLlmsBlob) 'llms.txt must remain frozen'
Assert-True (Test-Path -LiteralPath $googleVerificationFile -PathType Leaf) 'Google Search Console ownership verification file must exist'
Assert-True ((Get-Content -LiteralPath $googleVerificationFile -Raw -Encoding UTF8).Trim() -eq $googleVerificationBody) 'Google Search Console ownership verification file must retain its exact content'

foreach ($number in 1..8) {
    $id = "ZR-GEO-GEOTEST-$number"
    $relativeUrl = "/geotest-$number/"
    $canonical = "https://zeror.ca$relativeUrl"
    $pagePath = Join-Path $repoRoot "geotest-$number\index.html"
    $retiredPagePath = Join-Path $repoRoot "008-$number\index.html"

    Assert-True (Test-Path -LiteralPath $pagePath -PathType Leaf) "$relativeUrl must exist"
    Assert-True (-not (Test-Path -LiteralPath $retiredPagePath)) "/008-$number/ must be retired after the clean restart"
    $page = Get-Content -LiteralPath $pagePath -Raw -Encoding UTF8
    Assert-True ($page -match [regex]::Escape("<title>$id | Zeror GEO Pilot</title>")) "$id must have a unique title"
    Assert-True (([regex]::Matches($page, '<h1(?:\s[^>]*)?>')).Count -eq 1) "$id must have exactly one H1"
    Assert-True ($page -match [regex]::Escape("<h1>$id</h1>")) "$id H1 must identify the page"
    Assert-True ($page -match [regex]::Escape("rel=`"canonical`" href=`"$canonical`"")) "$id must self-canonicalize"
    Assert-True ($page -match 'name="robots" content="index, follow') "$id must allow indexing"
    Assert-True ($page -notmatch '<meta[^>]+noindex') "$id must not contain noindex"
    Assert-True ($page -match [regex]::Escape($id)) "$id must be visible in server HTML"
    Assert-True ($page -match '<code class="phrase">(?<phrase>[^<]+)</code>') "$id must expose one verification phrase"
    Assert-True ($page -match 'datetime="2026-08-11"') "$id must expose its restart publication date"
    Assert-True ($page -notmatch '<script') "$id core content must not depend on JavaScript"

    $phrase = [regex]::Match($page, '<code class="phrase">(?<phrase>[^<]+)</code>').Groups['phrase'].Value
    Assert-True ($phrase -match '^Zeror-[A-Za-z]+-[A-Za-z]+-\d{2}-[A-Za-z]+-[A-Za-z]+$') "$id phrase must follow the private generation format"
    $phrases += $phrase

    $article = [regex]::Match($page, '<section class="article">(?<body>.*?)</section>', [System.Text.RegularExpressions.RegexOptions]::Singleline).Groups['body'].Value
    $plain = [regex]::Replace($article, '<[^>]+>', ' ')
    $wordCount = ([regex]::Matches($plain, "\b[A-Za-z][A-Za-z'-]*\b")).Count
    Assert-True ($wordCount -ge 150 -and $wordCount -le 250) "$id independent article must contain 150-250 English words (found $wordCount)"
    $bodies += $plain

    if ($number -eq 1) {
        Assert-True ($sitemap -notmatch [regex]::Escape("<loc>$canonical</loc>")) '008-1 must remain absent from sitemap'
        Assert-True ($homepage -notmatch [regex]::Escape("href=`"$relativeUrl`"")) '008-1 must remain orphaned'
    } elseif ($number -eq 2) {
        Assert-True ($sitemap -match [regex]::Escape("<loc>$canonical</loc>")) '008-2 must be listed in sitemap'
        Assert-True ($homepage -notmatch [regex]::Escape("href=`"$relativeUrl`"")) '008-2 must have no homepage link'
    } else {
        Assert-True ($sitemap -match [regex]::Escape("<loc>$canonical</loc>")) "$id must be listed in sitemap"
        Assert-True ($homepage -match [regex]::Escape("href=`"$relativeUrl`"")) "$id must have a homepage link"
    }
}

Assert-True (($phrases | Sort-Object -Unique).Count -eq 8) 'all verification phrases must be unique'
Assert-True (($bodies | Sort-Object -Unique).Count -eq 8) 'all independent article bodies must be unique'
Assert-True ($llms -notmatch 'ZR-GEO-GEOTEST-[1-8]') 'llms.txt must not mention pilot pages'
Assert-True ($homepage -notmatch 'href="/008-[1-8]/"') 'homepage must not retain retired pilot URLs'
Assert-True ($sitemap -notmatch 'https://zeror.ca/008-[1-8]/') 'sitemap must not retain retired pilot URLs'

[xml]$sitemapXml = $sitemap
Assert-True ($null -ne $sitemapXml.urlset) 'sitemap.xml must remain valid XML'

Write-Host 'PASS: all eight GEO pilot pages satisfy local experiment controls.'

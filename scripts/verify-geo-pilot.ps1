$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$homePath = Join-Path $repoRoot 'index.html'
$sitemapPath = Join-Path $repoRoot 'sitemap.xml'
$llmsPath = Join-Path $repoRoot 'llms.txt'
$originalPath = Join-Path $repoRoot '008test\index.html'
$expectedOriginalHash = '2280B7B33E60714056E14B4948576F8C1FFAECFF6F1C4EB9C0408E5BC90B7AA9'
$expectedLlmsHash = 'F4AA1CF7725BEAE27555F497FAEA44F53C181E6594C7191E02B2443E2A9259D8'

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw "Verification failed: $Message" }
}

$homepage = Get-Content -LiteralPath $homePath -Raw -Encoding UTF8
$sitemap = Get-Content -LiteralPath $sitemapPath -Raw -Encoding UTF8
$llms = Get-Content -LiteralPath $llmsPath -Raw -Encoding UTF8
$phrases = @()
$bodies = @()

Assert-True ((Get-FileHash -Algorithm SHA256 -LiteralPath $originalPath).Hash -eq $expectedOriginalHash) 'the historical /008test/ page must remain unchanged'
Assert-True ((Get-FileHash -Algorithm SHA256 -LiteralPath $llmsPath).Hash -eq $expectedLlmsHash) 'llms.txt must remain frozen'

foreach ($number in 1..8) {
    $id = "ZR-GEO-008-$number"
    $relativeUrl = "/008-$number/"
    $canonical = "https://zeror.ca$relativeUrl"
    $pagePath = Join-Path $repoRoot "008-$number\index.html"

    Assert-True (Test-Path -LiteralPath $pagePath -PathType Leaf) "$relativeUrl must exist"
    $page = Get-Content -LiteralPath $pagePath -Raw -Encoding UTF8
    Assert-True ($page -match [regex]::Escape("<title>$id | Zeror GEO Pilot</title>")) "$id must have a unique title"
    Assert-True (([regex]::Matches($page, '<h1(?:\s[^>]*)?>')).Count -eq 1) "$id must have exactly one H1"
    Assert-True ($page -match [regex]::Escape("<h1>$id</h1>")) "$id H1 must identify the page"
    Assert-True ($page -match [regex]::Escape("rel=`"canonical`" href=`"$canonical`"")) "$id must self-canonicalize"
    Assert-True ($page -match 'name="robots" content="index, follow') "$id must allow indexing"
    Assert-True ($page -notmatch '<meta[^>]+noindex') "$id must not contain noindex"
    Assert-True ($page -match [regex]::Escape($id)) "$id must be visible in server HTML"
    Assert-True ($page -match '<code class="phrase">(?<phrase>[^<]+)</code>') "$id must expose one verification phrase"
    Assert-True ($page -match 'datetime="2026-08-10"') "$id must expose its publication date"
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
Assert-True ($llms -notmatch 'ZR-GEO-008-[1-8]') 'llms.txt must not mention pilot pages'

[xml]$sitemapXml = $sitemap
Assert-True ($null -ne $sitemapXml.urlset) 'sitemap.xml must remain valid XML'

Write-Host 'PASS: all eight GEO pilot pages satisfy local experiment controls.'

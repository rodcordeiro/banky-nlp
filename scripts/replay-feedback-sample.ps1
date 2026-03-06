param(
  [int]$Days = 30
)

$ErrorActionPreference = 'Stop'
$baseUrl = 'http://localhost:3334/api/v1'
$reportPath = "reports/nlp-feedback-replay-$Days-days-2026-03-06.md"

function Normalize-Text([object]$value) {
  if ($null -eq $value) { return $null }
  $text = [string]$value
  $normalized = $text.Trim().ToLowerInvariant().Normalize([Text.NormalizationForm]::FormD)
  $chars = New-Object System.Collections.Generic.List[char]
  foreach ($c in $normalized.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$chars.Add($c)
    }
  }
  -join $chars
}

function Get-Day([object]$value) {
  if ($null -eq $value) { return $null }
  try {
    return ([datetime]$value).ToString('yyyy-MM-dd')
  } catch {
    return $null
  }
}

function Compare-Field([string]$field, [object]$pred, [object]$target) {
  if ($field -eq 'value') {
    if ($null -eq $target) { return $true }
    if ($null -eq $pred) { return $false }
    return [Math]::Abs([double]$pred - [double]$target) -lt 0.01
  }

  if ($field -eq 'date') {
    if ($null -eq $target) { return $true }
    $a = Get-Day $pred
    $b = Get-Day $target
    if ($null -eq $a -or $null -eq $b) { return $false }
    return $a -eq $b
  }

  if ($null -eq $target) { return $true }
  return (Normalize-Text $pred) -eq (Normalize-Text $target)
}

function Test-Match($pred, $target) {
  $intentTarget = Normalize-Text $target.intent
  $intentPred = Normalize-Text $pred.intent
  if ($intentTarget -ne $intentPred) { return $false }

  $fields = if ($intentTarget -eq 'transfer') {
    @('origin', 'destiny', 'value', 'date')
  } else {
    @('account', 'category', 'value', 'date')
  }

  foreach ($field in $fields) {
    $ok = Compare-Field $field $pred.$field $target.$field
    if (-not $ok) { return $false }
  }
  return $true
}

function Invoke-JsonPost([string]$uri, $payload) {
  $json = $payload | ConvertTo-Json -Depth 20 -Compress
  Invoke-RestMethod -Method Post -Uri $uri -ContentType 'application/json; charset=utf-8' -Body $json
}

$all = @()
$page = 1
$limit = 100
while ($true) {
  $resp = Invoke-RestMethod -Method Get -Uri "$baseUrl/feedback?limit=$limit&page=$page"
  $all += $resp.items
  if (-not $resp.meta.hasNext) { break }
  $page += 1
}

$cutoff = (Get-Date).AddDays(-$Days)
$recent = $all |
  Where-Object { ([datetime]$_.createdAt) -ge $cutoff } |
  Sort-Object createdAt -Descending

$totalRecent = $recent.Count
$sampleSize = [Math]::Ceiling($totalRecent * 0.2)
$sample = @($recent | Select-Object -First $sampleSize)

$rows = New-Object System.Collections.Generic.List[object]
$beforeHits = 0
$afterHits = 0
$validatedCount = 0
$correctedCount = 0

foreach ($fb in $sample) {
  $target = if ($null -ne $fb.userCorrectedJson) { $fb.userCorrectedJson } else { $fb.predictedJson }

  $beforeOk = Test-Match $fb.predictedJson $target
  if ($beforeOk) { $beforeHits += 1 }

  $parsed = Invoke-JsonPost "$baseUrl/nlp" @{ text = $fb.originalText; owner = $fb.owner }
  $newPred = [pscustomobject]@{
    intent = $parsed.intent
    account = $parsed.account
    category = $parsed.category
    value = $parsed.value
    date = $parsed.date
    origin = $parsed.origin
    destiny = $parsed.destiny
  }

  $afterOk = Test-Match $newPred $target
  if ($afterOk) {
    $afterHits += 1
    Invoke-JsonPost "$baseUrl/feedback/$($parsed.feedback)" @{ status = 'validated' } | Out-Null
    $validatedCount += 1
  } else {
    Invoke-JsonPost "$baseUrl/feedback/$($parsed.feedback)" @{ status = 'corrected'; userCorrectedJson = $target } | Out-Null
    $correctedCount += 1
  }

  $rows.Add([pscustomobject]@{
    id = $fb.id
    replayFeedbackId = $parsed.feedback
    text = $fb.originalText
    expectedIntent = $target.intent
    beforeOk = $beforeOk
    afterOk = $afterOk
    statusApplied = if ($afterOk) { 'validated' } else { 'corrected' }
  }) | Out-Null
}

$beforeRate = if ($sampleSize -eq 0) { 0 } else { [math]::Round(($beforeHits / $sampleSize) * 100, 2) }
$afterRate = if ($sampleSize -eq 0) { 0 } else { [math]::Round(($afterHits / $sampleSize) * 100, 2) }
$delta = [math]::Round(($afterRate - $beforeRate), 2)

New-Item -ItemType Directory -Path (Split-Path $reportPath) -Force | Out-Null

$lines = @()
$lines += "# Relatorio de Replay de Feedbacks ($Days dias)"
$lines += ''
$lines += "- Data de execucao: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"
$lines += "- Janela analisada: ultimos $Days dias"
$lines += "- Total de feedbacks na janela: $totalRecent"
$lines += "- Amostra replay (20%): $sampleSize feedbacks"
$lines += "- Criterio da amostra: 20% mais recentes"
$lines += ''
$lines += '## Acuracidade'
$lines += ''
$lines += "- Taxa anterior (predicted vs alvo corrigido): $beforeRate% ($beforeHits/$sampleSize)"
$lines += "- Taxa apos replay: $afterRate% ($afterHits/$sampleSize)"
$lines += "- Delta: $delta p.p."
$lines += ''
$lines += '## Acoes aplicadas nos feedbacks reprocessados'
$lines += ''
$lines += "- Validados: $validatedCount"
$lines += "- Corrigidos: $correctedCount"
$lines += ''
$lines += '## Detalhes da amostra'
$lines += ''
$lines += '| feedback_original | feedback_replay | before | after | status_aplicado | texto |'
$lines += '|---|---|---|---|---|---|'
foreach ($r in $rows) {
  $txt = ($r.text -replace '\|','/')
  $lines += "| $($r.id) | $($r.replayFeedbackId) | $($r.beforeOk) | $($r.afterOk) | $($r.statusApplied) | $txt |"
}

Set-Content -Path $reportPath -Value ($lines -join "`n") -Encoding UTF8

$result = [pscustomobject]@{
  days = $Days
  totalRecent = $totalRecent
  sampleSize = $sampleSize
  beforeHits = $beforeHits
  afterHits = $afterHits
  beforeRate = $beforeRate
  afterRate = $afterRate
  delta = $delta
  validated = $validatedCount
  corrected = $correctedCount
  reportPath = (Resolve-Path $reportPath).Path
}

$result | ConvertTo-Json -Depth 5

param(
  [int]$Days = 30,
  [string]$Owner = ''
)

$ErrorActionPreference = 'Stop'
$baseUrl = 'http://localhost:3334/api/v1'
$normalizedOwner = $Owner.Trim().ToLowerInvariant()
$ownerLabel = if ($normalizedOwner) { $normalizedOwner } else { 'global' }
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
  return (-join $chars)
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
    $predDay = Get-Day $pred
    $targetDay = Get-Day $target
    if ($null -eq $predDay -or $null -eq $targetDay) { return $false }
    return $predDay -eq $targetDay
  }

  if ($null -eq $target) { return $true }
  return (Normalize-Text $pred) -eq (Normalize-Text $target)
}

function Test-Match($pred, $target) {
  $targetIntent = Normalize-Text $target.intent
  $predIntent = Normalize-Text $pred.intent
  if ($targetIntent -ne $predIntent) { return $false }

  $fields = if ($targetIntent -eq 'transfer') {
    @('origin', 'destiny', 'value', 'date')
  } else {
    @('account', 'category', 'value', 'date')
  }

  foreach ($field in $fields) {
    if (-not (Compare-Field $field $pred.$field $target.$field)) {
      return $false
    }
  }

  return $true
}

function Invoke-JsonPost([string]$uri, $payload) {
  $json = $payload | ConvertTo-Json -Depth 20 -Compress
  return Invoke-RestMethod -Method Post -Uri $uri -ContentType 'application/json; charset=utf-8' -Body $json
}

function Invoke-Replay([psobject]$feedback, [psobject]$target) {
  $parsed = Invoke-JsonPost "$baseUrl/nlp" @{
    text = $feedback.originalText
    owner = $feedback.owner
  }

  $prediction = [pscustomobject]@{
    intent = $parsed.intent
    account = $parsed.account
    category = $parsed.category
    value = $parsed.value
    date = $parsed.date
    origin = $parsed.origin
    destiny = $parsed.destiny
  }

  $matches = Test-Match $prediction $target
  $status = if ($matches) { 'validated' } else { 'corrected' }
  $payload = if ($matches) {
    @{ status = 'validated' }
  } else {
    @{ status = 'corrected'; userCorrectedJson = $target }
  }

  Invoke-JsonPost "$baseUrl/feedback/$($parsed.feedback)" $payload | Out-Null

  return [pscustomobject]@{
    feedbackId = $parsed.feedback
    prediction = $prediction
    matches = $matches
    statusApplied = $status
  }
}

function Build-TrainingQuery([string]$owner) {
  $query = '?fullTraining=false'
  if ($owner) {
    $query += '&owner=' + [System.Uri]::EscapeDataString($owner)
  }
  return $query
}

$all = @()
$page = 1
$limit = 100
while ($true) {
  $response = Invoke-RestMethod -Method Get -Uri "$baseUrl/feedback?limit=$limit&page=$page"
  $all += $response.items
  if (-not $response.meta.hasNext) { break }
  $page += 1
}

$cutoff = (Get-Date).AddDays(-$Days)
$recentCandidates = @(
  $all |
    Where-Object {
      ([datetime]$_.createdAt) -ge $cutoff -and
      (Normalize-Text $_.owner) -eq $ownerLabel
    } |
    Sort-Object createdAt -Descending
)

$totalRecent = $recentCandidates.Count
$sampleTargetSize = [Math]::Ceiling($totalRecent * 0.2)
$sample = @($recentCandidates | Select-Object -First $sampleTargetSize)
$sampleSize = $sample.Count

$rows = New-Object System.Collections.Generic.List[object]
$beforeHits = 0
$afterHits = 0
$validatedBefore = 0
$correctedBefore = 0
$validatedAfter = 0
$correctedAfter = 0

foreach ($feedback in $sample) {
  $target = if ($null -ne $feedback.userCorrectedJson) {
    $feedback.userCorrectedJson
  } else {
    $feedback.predictedJson
  }

  $beforeReplay = Invoke-Replay $feedback $target
  if ($beforeReplay.matches) {
    $beforeHits += 1
    $validatedBefore += 1
  } else {
    $correctedBefore += 1
  }

  $rows.Add([pscustomobject]@{
    sourceFeedbackId = $feedback.id
    sourceText = $feedback.originalText
    beforeReplayFeedbackId = $beforeReplay.feedbackId
    beforeOk = $beforeReplay.matches
    beforeStatus = $beforeReplay.statusApplied
    afterReplayFeedbackId = ''
    afterOk = $false
    afterStatus = ''
  }) | Out-Null
}

Invoke-RestMethod -Method Post -Uri ($baseUrl + '/feedback/training' + (Build-TrainingQuery $normalizedOwner)) | Out-Null

for ($index = 0; $index -lt $sample.Count; $index += 1) {
  $feedback = $sample[$index]
  $target = if ($null -ne $feedback.userCorrectedJson) {
    $feedback.userCorrectedJson
  } else {
    $feedback.predictedJson
  }

  $afterReplay = Invoke-Replay $feedback $target
  if ($afterReplay.matches) {
    $afterHits += 1
    $validatedAfter += 1
  } else {
    $correctedAfter += 1
  }

  $rows[$index].afterReplayFeedbackId = $afterReplay.feedbackId
  $rows[$index].afterOk = $afterReplay.matches
  $rows[$index].afterStatus = $afterReplay.statusApplied
}

$beforeRate = if ($sampleSize -eq 0) { 0 } else { [Math]::Round(($beforeHits / $sampleSize) * 100, 2) }
$afterRate = if ($sampleSize -eq 0) { 0 } else { [Math]::Round(($afterHits / $sampleSize) * 100, 2) }
$delta = [Math]::Round(($afterRate - $beforeRate), 2)

New-Item -ItemType Directory -Path (Split-Path $reportPath) -Force | Out-Null

$lines = @()
$lines += "# Relatorio de Replay de Feedbacks ($Days dias)"
$lines += ''
$lines += "- Data de execucao: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"
$lines += "- Janela analisada: ultimos $Days dias"
$lines += "- Owner avaliado: $ownerLabel"
$lines += "- Total de feedbacks na janela: $totalRecent"
$lines += "- Amostra fixa replay (20%): $sampleSize feedbacks"
$lines += "- Criterio da amostra: 20% mais recentes, congelados antes do treino"
$lines += ''
$lines += '## Acuracidade'
$lines += ''
$lines += "- Taxa antes do treino: $beforeRate% ($beforeHits/$sampleSize)"
$lines += "- Taxa depois do treino: $afterRate% ($afterHits/$sampleSize)"
$lines += "- Delta: $delta p.p."
$lines += ''
$lines += '## Acoes aplicadas'
$lines += ''
$lines += "- Antes do treino: $validatedBefore validados, $correctedBefore corrigidos"
$lines += "- Depois do treino: $validatedAfter validados, $correctedAfter corrigidos"
$lines += ''
$lines += '## Detalhes da amostra'
$lines += ''
$lines += '| feedback_origem | replay_antes | ok_antes | replay_depois | ok_depois | texto |'
$lines += '|---|---|---|---|---|---|'
foreach ($row in $rows) {
  $text = ($row.sourceText -replace '\|', '/')
  $lines += "| $($row.sourceFeedbackId) | $($row.beforeReplayFeedbackId) | $($row.beforeOk) | $($row.afterReplayFeedbackId) | $($row.afterOk) | $text |"
}

Set-Content -Path $reportPath -Value ($lines -join "`n") -Encoding UTF8

[pscustomobject]@{
  days = $Days
  owner = $ownerLabel
  totalRecent = $totalRecent
  sampleSize = $sampleSize
  beforeHits = $beforeHits
  afterHits = $afterHits
  beforeRate = $beforeRate
  afterRate = $afterRate
  delta = $delta
  validatedBefore = $validatedBefore
  correctedBefore = $correctedBefore
  validatedAfter = $validatedAfter
  correctedAfter = $correctedAfter
  reportPath = (Resolve-Path $reportPath).Path
} | ConvertTo-Json -Depth 5

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "Drilling down into E:\ directories..."

$d1 = Get-ChildItem -Path "E:\" -Filter "*Chao*" | Select-Object -First 1
if ($d1 -eq $null) { Write-Error "Could not find Chao folder."; exit 1 }
Write-Host "d1: $($d1.FullName)"

$d2 = Get-ChildItem -Path $d1.FullName -Filter "*AI*" | Select-Object -First 1
if ($d2 -eq $null) { Write-Error "Could not find AI folder."; exit 1 }
Write-Host "d2: $($d2.FullName)"

$d3 = Get-ChildItem -Path $d2.FullName -Filter "*new idea*" | Select-Object -First 1
if ($d3 -eq $null) { Write-Error "Could not find new idea folder."; exit 1 }
Write-Host "d3: $($d3.FullName)"

$docx = Get-ChildItem -Path $d3.FullName -Filter "*.docx" | Select-Object -First 1
if ($docx -eq $null) { Write-Error "Could not find docx file."; exit 1 }
$docxPath = $docx.FullName
Write-Host "Found file at: $docxPath"

$tempZip = "e:\CraftonAI\temp_arch.zip"
$tempFolder = "e:\CraftonAI\temp_arch"

if (Test-Path $tempFolder) { Remove-Item -Recurse -Force $tempFolder }
if (Test-Path $tempZip) { Remove-Item -Force $tempZip }

Copy-Item $docxPath $tempZip
Expand-Archive -Path $tempZip -DestinationPath $tempFolder

$xmlPath = "$tempFolder\word\document.xml"
if (Test-Path $xmlPath) {
    [xml]$xml = Get-Content -Raw -Encoding UTF8 -Path $xmlPath
    $ns = @{w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    $texts = Select-Xml -Xml $xml -XPath "//w:p" -Namespace $ns | ForEach-Object {
        $paraTexts = Select-Xml -Xml $_.Node -XPath ".//w:t" -Namespace $ns | ForEach-Object { $_.Node.InnerText }
        $paraTexts -join ""
    }
    $texts -join "`r`n" | Out-File -FilePath "e:\CraftonAI\extracted_docx_text.txt" -Encoding UTF8
    Write-Host "Successfully extracted DOCX text to e:\CraftonAI\extracted_docx_text.txt"
} else {
    Write-Error "Could not find word/document.xml in unzipped archive."
}

if (Test-Path $tempFolder) { Remove-Item -Recurse -Force $tempFolder }
if (Test-Path $tempZip) { Remove-Item -Force $tempZip }

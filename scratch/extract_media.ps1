$docx = Get-ChildItem -Path "e:\CraftonAI" -Filter "*.docx" | Select-Object -First 1
if ($docx -eq $null) {
    Write-Error "Could not find docx file in e:\CraftonAI"
    exit 1
}

$docxPath = $docx.FullName
Write-Host "Found local docx file at: $docxPath"

$tempZip = "e:\CraftonAI\scratch\temp_arch.zip"
$tempFolder = "e:\CraftonAI\scratch\temp_arch"
$destMediaDir = "e:\CraftonAI\src\media"

if (Test-Path $tempFolder) { Remove-Item -Recurse -Force $tempFolder }
if (Test-Path $tempZip) { Remove-Item -Force $tempZip }

Copy-Item $docxPath $tempZip
Expand-Archive -Path $tempZip -DestinationPath $tempFolder

if (Test-Path "$tempFolder\word\media") {
    if (-not (Test-Path $destMediaDir)) { New-Item -ItemType Directory -Path $destMediaDir }
    Get-ChildItem -Path "$tempFolder\word\media" | ForEach-Object {
        Copy-Item $_.FullName -Destination $destMediaDir -Force
        Write-Host "Extracted media file: $($_.Name)"
    }
} else {
    Write-Host "No media folder found inside the document."
}

# Clean up
if (Test-Path $tempFolder) { Remove-Item -Recurse -Force $tempFolder }
if (Test-Path $tempZip) { Remove-Item -Force $tempZip }

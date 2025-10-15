# Build script para generar versiones de TsukiChat

if (!(Test-Path "build/chrome")) {
    New-Item -ItemType Directory -Path "build/chrome" -Force
}

if (!(Test-Path "build/firefox")) {
    New-Item -ItemType Directory -Path "build/firefox" -Force
}

Write-Host "Construyendo version para Chrome..." -ForegroundColor Green

Copy-Item "manifest.json" "build/chrome/"
Copy-Item "popup.html" "build/chrome/"
Copy-Item "popup.js" "build/chrome/"
Copy-Item "content.js" "build/chrome/"
Copy-Item "styles.css" "build/chrome/"
Copy-Item "LICENSE" "build/chrome/"
Copy-Item "icons" "build/chrome/" -Recurse -Force
Copy-Item "events" "build/chrome/" -Recurse -Force
Copy-Item "badges" "build/chrome/" -Recurse -Force

Write-Host "Construyendo version para Firefox..." -ForegroundColor Green

Copy-Item "manifest_firefox.json" "build/firefox/manifest.json"
Copy-Item "popup_firefox.html" "build/firefox/popup.html"  
Copy-Item "popup_firefox.js" "build/firefox/popup.js"
Copy-Item "content_firefox.js" "build/firefox/content.js"
Copy-Item "styles.css" "build/firefox/"
Copy-Item "LICENSE" "build/firefox/"
Copy-Item "icons" "build/firefox/" -Recurse -Force
Copy-Item "events" "build/firefox/" -Recurse -Force
Copy-Item "badges" "build/firefox/" -Recurse -Force

Write-Host "Creando archivos ZIP..." -ForegroundColor Green

$chromeZip = "build/TsukiChat_Chrome_v2.3.0.zip"
if (Test-Path $chromeZip) { Remove-Item $chromeZip }

$tempChrome = "build/temp_chrome"
if (Test-Path $tempChrome) { Remove-Item $tempChrome -Recurse -Force }
New-Item -ItemType Directory -Path $tempChrome -Force | Out-Null
Copy-Item "build/chrome/*" $tempChrome -Recurse -Force
Compress-Archive -Path "$tempChrome/*" -DestinationPath $chromeZip
Remove-Item $tempChrome -Recurse -Force

$firefoxZip = "build/TsukiChat_Firefox_v2.3.0.zip"
if (Test-Path $firefoxZip) { Remove-Item $firefoxZip }

Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipFile = [System.IO.Compression.ZipFile]::Open($firefoxZip, [System.IO.Compression.ZipArchiveMode]::Create)

function Add-ToZipRecursive {
    param($SourcePath, $ZipArchive, $EntryPrefix = "")
    
    Get-ChildItem $SourcePath | ForEach-Object {
        $relativePath = if ($EntryPrefix) { "$EntryPrefix/$($_.Name)" } else { $_.Name }
        $relativePath = $relativePath -replace '\\', '/'
        
        if ($_.PSIsContainer) {
            Add-ToZipRecursive -SourcePath $_.FullName -ZipArchive $ZipArchive -EntryPrefix $relativePath
        } else {
            $entry = $ZipArchive.CreateEntry($relativePath)
            $entryStream = $entry.Open()
            $fileStream = [System.IO.File]::OpenRead($_.FullName)
            $fileStream.CopyTo($entryStream)
            $fileStream.Close()
            $entryStream.Close()
        }
    }
}

Add-ToZipRecursive -SourcePath "build/firefox" -ZipArchive $zipFile
$zipFile.Dispose()

Write-Host "Build completado!" -ForegroundColor Green
Write-Host "Chrome: $chromeZip" -ForegroundColor Yellow
Write-Host "Firefox: $firefoxZip" -ForegroundColor Yellow
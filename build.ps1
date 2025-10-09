# Build script para generar versiones de TsukiChat

# Crear directorio para Chrome
if (!(Test-Path "build/chrome")) {
    New-Item -ItemType Directory -Path "build/chrome" -Force
}

# Crear directorio para Firefox  
if (!(Test-Path "build/firefox")) {
    New-Item -ItemType Directory -Path "build/firefox" -Force
}

Write-Host "Construyendo version para Chrome..." -ForegroundColor Green

# Copiar archivos comunes para Chrome
Copy-Item "manifest.json" "build/chrome/"
Copy-Item "popup.html" "build/chrome/"
Copy-Item "popup.js" "build/chrome/"
Copy-Item "content.js" "build/chrome/"
Copy-Item "styles.css" "build/chrome/"
Copy-Item "LICENSE" "build/chrome/"
Copy-Item "icons" "build/chrome/" -Recurse -Force
Copy-Item "events" "build/chrome/" -Recurse -Force

Write-Host "Construyendo version para Firefox..." -ForegroundColor Green

# Copiar y renombrar archivos para Firefox
Copy-Item "manifest_firefox.json" "build/firefox/manifest.json"
Copy-Item "popup_firefox.html" "build/firefox/popup.html"  
Copy-Item "popup_firefox.js" "build/firefox/popup.js"
Copy-Item "content_firefox.js" "build/firefox/content.js"
Copy-Item "styles.css" "build/firefox/"
Copy-Item "LICENSE" "build/firefox/"
Copy-Item "icons" "build/firefox/" -Recurse -Force
Copy-Item "events" "build/firefox/" -Recurse -Force

Write-Host "Creando archivos ZIP..." -ForegroundColor Green

# Crear ZIP para Chrome usando Compress-Archive pero con estructura correcta
$chromeZip = "build/TsukiChat_Chrome_v2.2.5.zip"
if (Test-Path $chromeZip) { Remove-Item $chromeZip }

# Crear directorio temporal para Chrome
$tempChrome = "build/temp_chrome"
if (Test-Path $tempChrome) { Remove-Item $tempChrome -Recurse -Force }
New-Item -ItemType Directory -Path $tempChrome -Force | Out-Null
Copy-Item "build/chrome/*" $tempChrome -Recurse -Force
Compress-Archive -Path "$tempChrome/*" -DestinationPath $chromeZip
Remove-Item $tempChrome -Recurse -Force

# Crear ZIP para Firefox usando método compatible
$firefoxZip = "build/TsukiChat_Firefox_v2.2.5.zip"
if (Test-Path $firefoxZip) { Remove-Item $firefoxZip }

# Usar .NET para crear ZIP con rutas Unix compatibles
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Crear el archivo ZIP vacío
$zipFile = [System.IO.Compression.ZipFile]::Open($firefoxZip, [System.IO.Compression.ZipArchiveMode]::Create)

# Función para agregar archivos recursivamente con rutas Unix
function Add-ToZipRecursive {
    param($SourcePath, $ZipArchive, $EntryPrefix = "")
    
    Get-ChildItem $SourcePath | ForEach-Object {
        $relativePath = if ($EntryPrefix) { "$EntryPrefix/$($_.Name)" } else { $_.Name }
        $relativePath = $relativePath -replace '\\', '/'  # Convertir a barras Unix
        
        if ($_.PSIsContainer) {
            # Es un directorio - agregar recursivamente
            Add-ToZipRecursive -SourcePath $_.FullName -ZipArchive $ZipArchive -EntryPrefix $relativePath
        } else {
            # Es un archivo - agregarlo al ZIP
            $entry = $ZipArchive.CreateEntry($relativePath)
            $entryStream = $entry.Open()
            $fileStream = [System.IO.File]::OpenRead($_.FullName)
            $fileStream.CopyTo($entryStream)
            $fileStream.Close()
            $entryStream.Close()
        }
    }
}

# Agregar todos los archivos de Firefox
Add-ToZipRecursive -SourcePath "build/firefox" -ZipArchive $zipFile
$zipFile.Dispose()

Write-Host "Build completado!" -ForegroundColor Green
Write-Host "Chrome: $chromeZip" -ForegroundColor Yellow
Write-Host "Firefox: $firefoxZip" -ForegroundColor Yellow
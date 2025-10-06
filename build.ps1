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

Write-Host "Construyendo version para Firefox..." -ForegroundColor Green

# Copiar y renombrar archivos para Firefox
Copy-Item "manifest_firefox.json" "build/firefox/manifest.json"
Copy-Item "popup_firefox.html" "build/firefox/popup.html"  
Copy-Item "popup_firefox.js" "build/firefox/popup.js"
Copy-Item "content_firefox.js" "build/firefox/content.js"
Copy-Item "styles.css" "build/firefox/"
Copy-Item "LICENSE" "build/firefox/"
Copy-Item "icons" "build/firefox/" -Recurse -Force

Write-Host "Creando archivos ZIP..." -ForegroundColor Green

# Función para crear ZIP con rutas Unix compatibles
function Create-CrossPlatformZip {
    param(
        [string]$SourcePath,
        [string]$DestinationPath
    )
    
    # Usar System.IO.Compression para mejor control de rutas
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    
    if (Test-Path $DestinationPath) { Remove-Item $DestinationPath }
    
    $zip = [System.IO.Compression.ZipFile]::Open($DestinationPath, [System.IO.Compression.ZipArchiveMode]::Create)
    $sourceFullPath = (Resolve-Path $SourcePath).Path
    
    try {
        Get-ChildItem -Path $SourcePath -Recurse | Where-Object { !$_.PSIsContainer } | ForEach-Object {
            $relativePath = $_.FullName.Substring($sourceFullPath.Length + 1)
            # Convertir separadores de Windows a Unix
            $relativePath = $relativePath.Replace('\', '/')
            
            $zipEntry = $zip.CreateEntry($relativePath)
            $zipEntryStream = $zipEntry.Open()
            $fileStream = [System.IO.File]::OpenRead($_.FullName)
            
            try {
                $fileStream.CopyTo($zipEntryStream)
            }
            finally {
                $fileStream.Close()
                $zipEntryStream.Close()
            }
        }
    }
    finally {
        $zip.Dispose()
    }
}

# Crear ZIP para Chrome
$chromeZip = "build/TsukiChat_Chrome_v2.0.0.zip"
Create-CrossPlatformZip -SourcePath "build/chrome" -DestinationPath $chromeZip

# Crear ZIP para Firefox  
$firefoxZip = "build/TsukiChat_Firefox_v2.0.0.zip"
Create-CrossPlatformZip -SourcePath "build/firefox" -DestinationPath $firefoxZip

Write-Host "Build completado!" -ForegroundColor Green
Write-Host "Chrome: $chromeZip" -ForegroundColor Yellow
Write-Host "Firefox: $firefoxZip" -ForegroundColor Yellow
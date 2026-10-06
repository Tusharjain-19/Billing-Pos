Add-Type -AssemblyName System.Drawing

$srcImgPath = 'd:\billing\billing pro\public\billing-pro-logo.jpg'
$baseResDir = 'd:\billing\billing pro\mobile\android\app\src\main\res'

$configs = @(
    @{ Dir = 'mipmap-mdpi'; Size = 48; ForeSize = 108 },
    @{ Dir = 'mipmap-hdpi'; Size = 72; ForeSize = 162 },
    @{ Dir = 'mipmap-xhdpi'; Size = 96; ForeSize = 216 },
    @{ Dir = 'mipmap-xxhdpi'; Size = 144; ForeSize = 324 },
    @{ Dir = 'mipmap-xxxhdpi'; Size = 192; ForeSize = 432 }
)

$src = [System.Drawing.Image]::FromFile($srcImgPath)

foreach ($cfg in $configs) {
    $dir = Join-Path $baseResDir $cfg.Dir
    if (!(Test-Path $dir)) { 
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    # 1. Standard Square Launcher Icon
    $bmp = New-Object System.Drawing.Bitmap ($cfg.Size, $cfg.Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.Clear([System.Drawing.Color]::White)
    $g.DrawImage($src, 0, 0, $cfg.Size, $cfg.Size)
    $g.Dispose()
    $bmp.Save((Join-Path $dir 'ic_launcher.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    # 2. Round Launcher Icon (Antialiased Circle Mask)
    $bmpRound = New-Object System.Drawing.Bitmap ($cfg.Size, $cfg.Size)
    $gRound = [System.Drawing.Graphics]::FromImage($bmpRound)
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gRound.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gRound.Clear([System.Drawing.Color]::Transparent)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $cfg.Size, $cfg.Size)
    $gRound.SetClip($path)
    $gRound.Clear([System.Drawing.Color]::White)
    $gRound.DrawImage($src, 0, 0, $cfg.Size, $cfg.Size)
    $path.Dispose()
    $gRound.Dispose()
    $bmpRound.Save((Join-Path $dir 'ic_launcher_round.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpRound.Dispose()

    # 3. Adaptive Foreground Icon (Centered Emblem on transparent canvas)
    $foreSize = $cfg.ForeSize
    $bmpFore = New-Object System.Drawing.Bitmap ($foreSize, $foreSize)
    $gFore = [System.Drawing.Graphics]::FromImage($bmpFore)
    $gFore.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFore.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gFore.Clear([System.Drawing.Color]::Transparent)
    $pad = [int]($foreSize * 0.12)
    $drawSize = $foreSize - ($pad * 2)
    $gFore.DrawImage($src, $pad, $pad, $drawSize, $drawSize)
    $gFore.Dispose()
    $bmpFore.Save((Join-Path $dir 'ic_launcher_foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpFore.Dispose()
}

$src.Dispose()
Write-Host "All Android launcher icons generated successfully from billing-pro-logo.jpg!"

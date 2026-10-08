Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\tusha\.gemini\antigravity-ide\brain\18c01c3d-dd1c-4236-9d63-18533fdcd4e2\billing_pos_logo_1791376393089.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $src.Width
$h = $src.Height

# Bounding box discovered: minX=307, maxX=717, minY=256, maxY=768 (411x513)
# Expand slightly for edge anti-aliasing
$cropMinX = [Math]::Max(0, 304)
$cropMaxX = [Math]::Min($w - 1, 720)
$cropMinY = [Math]::Max(0, 252)
$cropMaxY = [Math]::Min($h - 1, 772)

$cw = $cropMaxX - $cropMinX + 1
$ch = $cropMaxY - $cropMinY + 1

$cropped = New-Object System.Drawing.Bitmap($cw, $ch, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $ch; $y++) {
    $sy = $cropMinY + $y
    for ($x = 0; $x -lt $cw; $x++) {
        $sx = $cropMinX + $x
        $c = $src.GetPixel($sx, $sy)

        # Transparency keying with soft alpha feathering
        # Pure white background: R>250, G>250, B>250
        $minChannel = [Math]::Min($c.R, [Math]::Min($c.G, $c.B))
        
        if ($minChannel -ge 252) {
            # Completely transparent
            $cropped.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        } elseif ($minChannel -gt 240) {
            # Soft anti-aliased edge feathering
            $alpha = [int](255 * (252 - $minChannel) / 12.0)
            $alpha = [Math]::Max(0, [Math]::Min(255, $alpha))
            $cropped.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
        } else {
            # Fully opaque
            $cropped.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
        }
    }
}
$src.Dispose()

Write-Host "Cropped emblem with soft alpha: $cw x $ch"

# Helper function to draw high quality image
function Draw-HQ($g) {
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
}

# 1. High-Res Standalone PNGs (512x512)
$webLogo = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gWeb = [System.Drawing.Graphics]::FromImage($webLogo)
Draw-HQ $gWeb

$scale512 = [Math]::Min(470.0 / $cw, 470.0 / $ch)
$dw512 = [int]($cw * $scale512)
$dh512 = [int]($ch * $scale512)
$dx512 = [int]((512 - $dw512) / 2)
$dy512 = [int]((512 - $dh512) / 2)

$gWeb.DrawImage($cropped, $dx512, $dy512, $dw512, $dh512)
$gWeb.Dispose()

$webLogo.Save("public/logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$webLogo.Save("public/favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$webLogo.Save("public/billing-pro-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$webLogo.Save("build/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$webLogo.Save("src/assets/logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$webLogo.Dispose()

Write-Host "Updated 512x512 web and desktop assets."

# 2. Android Adaptive Mipmap Icons
$densities = @(
    @{ folder = "mipmap-mdpi"; size = 48; fgSize = 108 },
    @{ folder = "mipmap-hdpi"; size = 72; fgSize = 162 },
    @{ folder = "mipmap-xhdpi"; size = 96; fgSize = 216 },
    @{ folder = "mipmap-xxhdpi"; size = 144; fgSize = 324 },
    @{ folder = "mipmap-xxxhdpi"; size = 192; fgSize = 432 }
)

foreach ($d in $densities) {
    $dir = "mobile/android/app/src/main/res/$($d.folder)"
    if (Test-Path $dir) {
        # Foreground: 58% safe zone to guarantee NO clipping inside circular Android launcher masks
        $fg = New-Object System.Drawing.Bitmap($d.fgSize, $d.fgSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($fg)
        Draw-HQ $g
        
        $fgTarget = [int]($d.fgSize * 0.58)
        $scale = [Math]::Min($fgTarget / $cw, $fgTarget / $ch)
        $dw = [int]($cw * $scale)
        $dh = [int]($ch * $scale)
        $dx = [int](($d.fgSize - $dw) / 2)
        $dy = [int](($d.fgSize - $dh) / 2)

        $g.DrawImage($cropped, $dx, $dy, $dw, $dh)
        $g.Dispose()
        $fg.Save("$dir/ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $fg.Dispose()

        # Legacy Icon: Crisp pure white circular/squircle card with emblem
        $legacy = New-Object System.Drawing.Bitmap($d.size, $d.size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $gl = [System.Drawing.Graphics]::FromImage($legacy)
        Draw-HQ $gl

        $rect = New-Object System.Drawing.Rectangle(0, 0, $d.size, $d.size)
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $gl.FillEllipse($brush, $rect)
        $brush.Dispose()

        $legTarget = [int]($d.size * 0.68)
        $legScale = [Math]::Min($legTarget / $cw, $legTarget / $ch)
        $lw = [int]($cw * $legScale)
        $lh = [int]($ch * $legScale)
        $lx = [int](($d.size - $lw) / 2)
        $ly = [int](($d.size - $lh) / 2)

        $gl.DrawImage($cropped, $lx, $ly, $lw, $lh)
        $gl.Dispose()

        $legacy.Save("$dir/ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $legacy.Save("$dir/ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $legacy.Dispose()

        Write-Host "Updated $($d.folder) launcher icons."
    }
}

# 3. Android Splash Screens across all 11 densities
$splashFolders = @(
    @{ name = "drawable"; w = 480; h = 800 },
    @{ name = "drawable-port-mdpi"; w = 320; h = 480 },
    @{ name = "drawable-port-hdpi"; w = 480; h = 800 },
    @{ name = "drawable-port-xhdpi"; w = 720; h = 1280 },
    @{ name = "drawable-port-xxhdpi"; w = 960; h = 1600 },
    @{ name = "drawable-port-xxxhdpi"; w = 1280; h = 1920 },
    @{ name = "drawable-land-mdpi"; w = 480; h = 320 },
    @{ name = "drawable-land-hdpi"; w = 800; h = 480 },
    @{ name = "drawable-land-xhdpi"; w = 1280; h = 720 },
    @{ name = "drawable-land-xxhdpi"; w = 1600; h = 960 },
    @{ name = "drawable-land-xxxhdpi"; w = 1920; h = 1280 }
)

foreach ($sf in $splashFolders) {
    $dir = "mobile/android/app/src/main/res/$($sf.name)"
    if (Test-Path $dir) {
        $spBmp = New-Object System.Drawing.Bitmap($sf.w, $sf.h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $gSp = [System.Drawing.Graphics]::FromImage($spBmp)
        Draw-HQ $gSp
        $gSp.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

        # Pure clean white canvas
        $gSp.Clear([System.Drawing.Color]::White)

        # Draw emblem centered
        $isPort = $sf.h -ge $sf.w
        $emblemTargetSize = if ($isPort) { [int]($sf.w * 0.35) } else { [int]($sf.h * 0.38) }
        $emblemTargetSize = [Math]::Max(80, [Math]::Min($emblemTargetSize, 320))

        $spScale = [Math]::Min($emblemTargetSize / $cw, $emblemTargetSize / $ch)
        $ew = [int]($cw * $spScale)
        $eh = [int]($ch * $spScale)
        $ex = [int](($sf.w - $ew) / 2)
        $ey = if ($isPort) { [int](($sf.h - $eh) / 2 - ($eh * 0.40)) } else { [int](($sf.h - $eh) / 2 - ($eh * 0.30)) }

        $gSp.DrawImage($cropped, $ex, $ey, $ew, $eh)

        # Typography: "Billing Pro" & "SUPERFAST OFFLINE POS"
        $titleFontSize = [Math]::Max(16, [int]($ew * 0.22))
        $subFontSize = [Math]::Max(9, [int]($ew * 0.11))

        $fontTitle = New-Object System.Drawing.Font("Arial", $titleFontSize, [System.Drawing.FontStyle]::Bold)
        $fontSub = New-Object System.Drawing.Font("Arial", $subFontSize, [System.Drawing.FontStyle]::Bold)

        $brushTitle = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42)) # #0F172A
        $brushSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(37, 99, 235))   # #2563EB

        $stringFormat = New-Object System.Drawing.StringFormat
        $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
        $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

        $textY1 = $ey + $eh + [int]($eh * 0.18)
        $textY2 = $textY1 + [int]($titleFontSize * 1.5)

        $rectTitle = New-Object System.Drawing.RectangleF(0, $textY1, $sf.w, ($titleFontSize * 2))
        $rectSub = New-Object System.Drawing.RectangleF(0, $textY2, $sf.w, ($subFontSize * 2))

        $gSp.DrawString("Billing Pro", $fontTitle, $brushTitle, $rectTitle, $stringFormat)
        $gSp.DrawString("SUPERFAST OFFLINE POS", $fontSub, $brushSub, $rectSub, $stringFormat)

        $fontTitle.Dispose()
        $fontSub.Dispose()
        $brushTitle.Dispose()
        $brushSub.Dispose()
        $stringFormat.Dispose()
        $gSp.Dispose()

        $spBmp.Save("$dir/splash.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $spBmp.Dispose()

        Write-Host "Generated branded splash screen for $($sf.name) ($($sf.w)x$($sf.h))"
    }
}

$cropped.Dispose()
Write-Host "All assets generated successfully!"

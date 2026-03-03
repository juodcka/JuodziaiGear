Add-Type -AssemblyName System.Drawing

$iconDir = 'c:\Users\marty\Documents\Git\JuodziaiGear\icons'
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null

$refPath = 'c:\Users\marty\Documents\Git\JuodziaiGear\ref-axe.png'
$ref     = [System.Drawing.Bitmap]::FromFile($refPath)

$bgColor = [System.Drawing.Color]::FromArgb(255, 235, 234, 229)   # light warm grey

# ColorMatrix: invert R,G,B channels so black→white, white→black
# Then we draw onto the green background — the inverted white strokes
# show up as white on green, and inverted white background (now black)
# becomes transparent via the alpha we'll handle separately.
#
# Approach: use a two-pass method:
#   1. Scale ref onto a temp white-background bitmap at target size
#   2. Per-pixel: dark pixel (stroke) → write white; light pixel → skip (bg shows through)

$sizes = @(32, 180, 192, 512)

foreach ($size in $sizes) {

    # --- Step 1: Scale reference to target size (white bg) ---
    $scaled = New-Object System.Drawing.Bitmap($size, $size)
    $gs = [System.Drawing.Graphics]::FromImage($scaled)
    $gs.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gs.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gs.Clear([System.Drawing.Color]::White)
    $pad  = [int]($size * 0.08)
    $pad2 = $pad * 2
    $dw   = $size - $pad2
    $dest = New-Object System.Drawing.Rectangle([int]$pad, [int]$pad, [int]$dw, [int]$dw)
    $gs.DrawImage($ref, [System.Drawing.Rectangle]$dest)
    $gs.Dispose()

    # --- Step 2: Build output bitmap with green background ---
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)

    if ($size -ge 180) {
        $g.Clear([System.Drawing.Color]::Transparent)
        $r  = [int]($size * 0.18)
        $bg = New-Object System.Drawing.Drawing2D.GraphicsPath
        $bg.AddArc(0,            0,            $r*2, $r*2, 180, 90)
        $bg.AddArc($size - $r*2, 0,            $r*2, $r*2, 270, 90)
        $bg.AddArc($size - $r*2, $size - $r*2, $r*2, $r*2, 0,   90)
        $bg.AddArc(0,            $size - $r*2, $r*2, $r*2, 90,  90)
        $bg.CloseFigure()
        $g.FillPath((New-Object System.Drawing.SolidBrush($bgColor)), $bg)
    } else {
        $g.Clear($bgColor)
    }
    $g.Dispose()

    # --- Step 3: Per-pixel — dark pixels in scaled → black in output ---
    for ($y = 0; $y -lt $size; $y++) {
        for ($x = 0; $x -lt $size; $x++) {
            $px = $scaled.GetPixel($x, $y)
            $brightness = (0.299 * [float]$px.R + 0.587 * [float]$px.G + 0.114 * [float]$px.B) / 255.0
            if ($brightness -lt 0.55) {
                # Dark pixel = axe stroke → keep as dark on output
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 30, 30, 30))
            }
            # Light pixel = background → leave the grey bg unchanged
        }
    }

    $scaled.Dispose()

    $outPath = Join-Path $iconDir "icon-$size.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $outPath"
}

$ref.Dispose()
Write-Host "Done."

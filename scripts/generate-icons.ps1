Add-Type -AssemblyName System.Drawing
$srcPath = (Resolve-Path 'assets/logo.png').Path

function Resize-Icon {
    param([string]$src, [string]$dst, [int]$size, [bool]$round = $false, [int]$padding = 0)
    $orig = [System.Drawing.Image]::FromFile($src)
    $bmp  = New-Object System.Drawing.Bitmap($size, $size)
    $g    = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::White)
    if ($round) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $size, $size)
        $g.SetClip($path)
    }
    $inner = $size - ($padding * 2)
    $g.DrawImage($orig, $padding, $padding, $inner, $inner)
    $g.Dispose()
    $orig.Dispose()
    $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "  OK $dst"
}

$resDir = 'android/app/src/main/res'
$densities = @(
    @{folder='mipmap-mdpi';    size=48;  fg=108},
    @{folder='mipmap-hdpi';    size=72;  fg=162},
    @{folder='mipmap-xhdpi';   size=96;  fg=216},
    @{folder='mipmap-xxhdpi';  size=144; fg=324},
    @{folder='mipmap-xxxhdpi'; size=192; fg=432}
)

foreach ($d in $densities) {
    $dir   = "$resDir/$($d.folder)"
    $sz    = $d.size
    $pad   = [int]($sz * 0.10)
    $fgPad = [int]($d.fg * 0.20)
    Resize-Icon -src $srcPath -dst "$dir/ic_launcher.png"            -size $sz   -padding $pad
    Resize-Icon -src $srcPath -dst "$dir/ic_launcher_round.png"      -size $sz   -round $true -padding $pad
    Resize-Icon -src $srcPath -dst "$dir/ic_launcher_foreground.png" -size $d.fg -padding $fgPad
}

Write-Host 'Todos os icones gerados com sucesso!'

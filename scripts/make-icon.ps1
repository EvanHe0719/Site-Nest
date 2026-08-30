$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$size = 256
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)

function New-RoundedPath([float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2
  $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
  $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
  $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

$backgroundPath = New-RoundedPath 12 12 232 232 58
$backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(28, 24)),
  (New-Object System.Drawing.Point(224, 236)),
  [System.Drawing.Color]::FromArgb(59, 154, 126),
  [System.Drawing.Color]::FromArgb(23, 96, 78)
)
$graphics.FillPath($backgroundBrush, $backgroundPath)

$haloBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 255, 255, 255))
[System.Drawing.PointF[]]$haloPoints = @(
  (New-Object System.Drawing.PointF(63, 74)),
  (New-Object System.Drawing.PointF(128, 38)),
  (New-Object System.Drawing.PointF(193, 74)),
  (New-Object System.Drawing.PointF(193, 150)),
  (New-Object System.Drawing.PointF(128, 186)),
  (New-Object System.Drawing.PointF(63, 150))
)
$graphics.FillPolygon($haloBrush, $haloPoints)

$markPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 255, 255, 255), 12)
$markPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
[System.Drawing.PointF[]]$markPoints = @(
  (New-Object System.Drawing.PointF(83, 86)),
  (New-Object System.Drawing.PointF(128, 61)),
  (New-Object System.Drawing.PointF(173, 86)),
  (New-Object System.Drawing.PointF(173, 138)),
  (New-Object System.Drawing.PointF(128, 163)),
  (New-Object System.Drawing.PointF(83, 138)),
  (New-Object System.Drawing.PointF(83, 86))
)
$graphics.DrawLines($markPen, $markPoints)

$linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230, 255, 255, 255), 12)
$linePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$graphics.DrawLine($linePen, 87, 179, 169, 179)

$dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.FillEllipse($dotBrush, 113, 97, 30, 30)

$output = Join-Path $PSScriptRoot "..\assets\app-icon.png"
$bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)

$dotBrush.Dispose()
$linePen.Dispose()
$markPen.Dispose()
$haloBrush.Dispose()
$backgroundBrush.Dispose()
$backgroundPath.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output $output

Add-Type -AssemblyName System.Drawing

$width = 1600
$height = 1000
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.Color]::FromArgb(8, 10, 19))

$background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle(0, 0, $width, $height)),
  ([System.Drawing.Color]::FromArgb(8, 10, 19)),
  ([System.Drawing.Color]::FromArgb(35, 17, 58)),
  0
)
$graphics.FillRectangle($background, 0, 0, $width, $height)

$haloPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$haloPath.AddEllipse(740, 150, 760, 760)
$halo = New-Object System.Drawing.Drawing2D.PathGradientBrush($haloPath)
$halo.CenterColor = [System.Drawing.Color]::FromArgb(95, 109, 48, 189)
$halo.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 109, 48, 189))
$graphics.FillEllipse($halo, 740, 150, 760, 760)

$random = New-Object System.Random(18)
for ($i = 0; $i -lt 120; $i++) {
  $x = $random.Next(40, 1560)
  $y = $random.Next(35, 620)
  $alpha = $random.Next(55, 155)
  $size = $random.Next(2, 5)
  $starBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($alpha, 205, 190, 255))
  $graphics.FillEllipse($starBrush, $x, $y, $size, $size)
  $starBrush.Dispose()
}

# Distant city silhouettes frame the play area.
for ($i = 0; $i -lt 13; $i++) {
  $x = 770 + ($i * 63)
  $buildingWidth = $random.Next(35, 72)
  $buildingHeight = $random.Next(150, 390)
  $buildingBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 14, 17, 34))
  $graphics.FillRectangle($buildingBrush, $x, 600 - $buildingHeight, $buildingWidth, $buildingHeight)
  $buildingBrush.Dispose()
  for ($windowY = 620 - $buildingHeight; $windowY -lt 595; $windowY += 24) {
    $windowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 74, 54, 124))
    $graphics.FillRectangle($windowBrush, $x + 9, $windowY, 4, 8)
    $graphics.FillRectangle($windowBrush, $x + 24, $windowY, 4, 8)
    $windowBrush.Dispose()
  }
}

# Perspective road and neon lane marks.
$roadPoints = [System.Drawing.Point[]]@(
  (New-Object System.Drawing.Point(600, 1000)),
  (New-Object System.Drawing.Point(1600, 1000)),
  (New-Object System.Drawing.Point(1140, 500)),
  (New-Object System.Drawing.Point(930, 500))
)
$roadBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 11, 13, 25))
$graphics.FillPolygon($roadBrush, $roadPoints)
$roadBrush.Dispose()
$purplePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(165, 163, 103, 255), 4)
$purplePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.DrawLine($purplePen, 600, 1000, 930, 500)
$graphics.DrawLine($purplePen, 1600, 1000, 1140, 500)
$cyanPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 91, 221, 255), 2)
foreach ($x in @(720, 925, 1130, 1340, 1530)) { $graphics.DrawLine($cyanPen, 1060, 510, $x, 1000) }
foreach ($y in @(585, 675, 795, 950)) {
  $ratio = ($y - 500) / 500.0
  $left = 930 - (330 * $ratio)
  $right = 1140 + (460 * $ratio)
  $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb([Math]::Min(145, 35 + [int]($ratio * 100)), 97, 70, 159), 2)
  $graphics.DrawLine($linePen, [int]$left, $y, [int]$right, $y)
  $linePen.Dispose()
}

# Hoverboard with a luminous edge.
$boardPoints = [System.Drawing.Point[]]@(
  (New-Object System.Drawing.Point(1030, 770)),
  (New-Object System.Drawing.Point(1300, 770)),
  (New-Object System.Drawing.Point(1250, 830)),
  (New-Object System.Drawing.Point(1070, 830))
)
$boardFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 31, 24, 55))
$graphics.FillPolygon($boardFill, $boardPoints)
$boardFill.Dispose()
$boardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 99, 228, 255), 6)
$boardPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.DrawPolygon($boardPen, $boardPoints)

# Low-poly pilot: hair, face, suit, gloves, and bright chest detail.
$hairBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 35, 25, 42))
$skinBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 188, 125, 90))
$suitBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 133, 87, 222))
$suitDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 45, 37, 69))
$glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 101, 230, 255))
$graphics.FillEllipse($hairBrush, 1090, 374, 150, 145)
$graphics.FillEllipse($skinBrush, 1102, 394, 126, 128)
$graphics.FillRectangle($hairBrush, 1100, 388, 130, 35)
$graphics.FillRectangle($glowBrush, 1112, 449, 112, 14)
$graphics.FillRectangle($suitBrush, 1070, 558, 195, 115)
$graphics.FillEllipse($suitBrush, 1070, 520, 195, 85)
$graphics.FillEllipse($suitBrush, 1070, 630, 195, 95)
$graphics.FillPolygon($suitDark, [System.Drawing.Point[]]@(
  (New-Object System.Drawing.Point(1090, 680)), (New-Object System.Drawing.Point(1245, 680)),
  (New-Object System.Drawing.Point(1215, 770)), (New-Object System.Drawing.Point(1107, 770))
))
$graphics.FillPolygon($suitBrush, [System.Drawing.Point[]]@(
  (New-Object System.Drawing.Point(1080, 550)), (New-Object System.Drawing.Point(1024, 658)),
  (New-Object System.Drawing.Point(1075, 678)), (New-Object System.Drawing.Point(1121, 584))
))
$graphics.FillPolygon($suitBrush, [System.Drawing.Point[]]@(
  (New-Object System.Drawing.Point(1255, 550)), (New-Object System.Drawing.Point(1310, 658)),
  (New-Object System.Drawing.Point(1260, 678)), (New-Object System.Drawing.Point(1215, 584))
))
$graphics.FillRectangle($glowBrush, 1138, 542, 58, 16)
$graphics.FillEllipse($glowBrush, 1150, 586, 34, 34)

# Game title and platform label.
$titleWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 244, 239, 255))
$titlePurple = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 174, 139, 255))
$muted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 180, 174, 197))
$mono = New-Object System.Drawing.Font('Consolas', 17, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$title = New-Object System.Drawing.Font('Arial', 116, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subtitle = New-Object System.Drawing.Font('Arial', 31, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString('START.NG  /  ARCADE ORIGINAL', $mono, $titlePurple, 128, 120)
$graphics.DrawString('NEON', $title, $titleWhite, 120, 205)
$graphics.DrawString('DRIFT', $title, $titlePurple, 120, 325)
$graphics.DrawString('FIND YOUR FREQUENCY.', $subtitle, $muted, 135, 485)
$labelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 180, 142, 255), 2)
$graphics.DrawLine($labelPen, 137, 548, 430, 548)
$graphics.DrawString('COLLECT  /  DODGE  /  KEEP MOVING', $mono, $muted, 137, 575)

$output = Join-Path (Split-Path $PSScriptRoot -Parent) 'cover.png'
$bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose(); $bitmap.Dispose(); $background.Dispose(); $halo.Dispose(); $haloPath.Dispose()
$roadBrush.Dispose(); $purplePen.Dispose(); $cyanPen.Dispose(); $boardFill.Dispose(); $boardPen.Dispose()
$hairBrush.Dispose(); $skinBrush.Dispose(); $suitBrush.Dispose(); $suitDark.Dispose(); $glowBrush.Dispose()
$titleWhite.Dispose(); $titlePurple.Dispose(); $muted.Dispose(); $mono.Dispose(); $title.Dispose(); $subtitle.Dispose(); $labelPen.Dispose()
Write-Output $output

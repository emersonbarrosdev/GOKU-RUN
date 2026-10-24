param([string]$ImagePath, [int]$Columns = 4, [int[]]$RowEdges, [int[]]$ColumnEdges)
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
public static class AtlasBounds {
    public static int[] Find(Bitmap image, int x, int y, int w, int h) {
        int left=x+w, top=y+h, right=x, bottom=y;
        for (int py=y; py<y+h; py++) for (int px=x; px<x+w; px++) {
            if (image.GetPixel(px,py).A < 210) continue;
            left=Math.Min(left,px); right=Math.Max(right,px);
            top=Math.Min(top,py); bottom=Math.Max(bottom,py);
        }
        return new int[]{left,top,right-left+1,bottom-top+1};
    }
}
'@
$bitmap = [Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $ImagePath))
try {
    if (-not $RowEdges) { $RowEdges = 0..4 | ForEach-Object { [int][Math]::Round($_ * $bitmap.Height / 4) } }
    if (-not $ColumnEdges) { $ColumnEdges = 0..$Columns | ForEach-Object { [int][Math]::Round($_ * $bitmap.Width / $Columns) } }
    $frames = @()
    for ($row=0; $row -lt $RowEdges.Length-1; $row++) {
        for ($col=0; $col -lt $Columns; $col++) {
            $x=$ColumnEdges[$col]
            $right=$ColumnEdges[$col+1]
            $bounds=[AtlasBounds]::Find($bitmap,$x,$RowEdges[$row],$right-$x,$RowEdges[$row+1]-$RowEdges[$row])
            $frames += ,$bounds
        }
    }
    ConvertTo-Json -InputObject $frames -Compress
} finally { $bitmap.Dispose() }

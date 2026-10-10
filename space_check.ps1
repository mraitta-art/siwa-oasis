$drive = Get-PSDrive C
$freeGB = [math]::Round($drive.Free / 1GB, 2)
$usedGB = [math]::Round($drive.Used / 1GB, 2)
$totalGB = [math]::Round(($drive.Used + $drive.Free) / 1GB, 2)
$text = "FreeGB=$freeGB`nUsedGB=$usedGB`nTotalGB=$totalGB"
Set-Content -Path 'e:\ANitgravity\siwatoday\space_check.txt' -Value $text

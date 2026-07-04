$body = @{
    gender = "female"
    partnerName = "小美"
    avatarType = "gentle"
    sceneId = "birthday"
    difficulty = "easy"
    avatarUrl = "/avatars/female_gentle.jpeg"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/game/start" -Method Post -ContentType "application/json" -Body $body
    Write-Host "SUCCESS:"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERROR:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:"
        Write-Host $responseBody
    }
}
$apiKey = "pat_u5vZGKKuv7WiaO8xbUj78dpA51xwgrdZvIRVTq13aKKYdqJf206qpVtsa8uoGIaM"
$botId = "7658485650538610739"

$endpoints = @(
    "https://api.coze.cn/v3/bot/retrieve?bot_id=$botId",
    "https://api.coze.cn/v3/bot/get?bot_id=$botId",
    "https://api.coze.cn/v3/bot/detail?bot_id=$botId",
    "https://api.coze.cn/v3/bot/list"
)

foreach ($endpoint in $endpoints) {
    Write-Host "`n=== Testing: $endpoint ==="
    
    try {
        $headers = @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri $endpoint -Method Get -Headers $headers -TimeoutSec 30
        
        Write-Host "SUCCESS"
        Write-Host "Response: $($response | ConvertTo-Json -Depth 3)"
        
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody"
        }
    }
}
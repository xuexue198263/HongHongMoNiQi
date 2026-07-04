$apiKey = "pat_u5vZGKKuv7WiaO8xbUj78dpA51xwgrdZvIRVTq13aKKYdqJf206qpVtsa8uoGIaM"
$modelName = "doubao-seed-2-0-pro-260215"

$endpoints = @(
    "https://api.coze.cn/api/v3/chat/completions",
    "https://api.coze.cn/v3/chat/completions",
    "https://api.coze.cn/chat/completions"
)

foreach ($endpoint in $endpoints) {
    Write-Host "`n=== Testing: $endpoint ==="
    
    try {
        $body = @{
            model = $modelName
            messages = @(
                @{role = "system"; content = "你是一个测试助手，只回复'测试成功'"},
                @{role = "user"; content = "测试"}
            )
        } | ConvertTo-Json -Depth 5
        
        $headers = @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $body -TimeoutSec 30
        
        Write-Host "SUCCESS"
        Write-Host "Response: $($response | ConvertTo-Json -Depth 5)"
        
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody"
        }
    }
}
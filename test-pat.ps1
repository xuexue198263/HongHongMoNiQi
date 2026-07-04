$apiKey = "pat_u5vZGKKuv7WiaO8xbUj78dpA51xwgrdZvIRVTq13aKKYdqJf206qpVtsa8uoGIaM"

$endpoints = @(
    "https://api.coze.cn/v3/chat",
    "https://api.coze.cn/api/v3/chat/completions",
    "https://api.coze.cn/open_api/v3/chat/completions",
    "https://api.coze.com/v3/chat/completions"
)

foreach ($url in $endpoints) {
    Write-Host ""
    Write-Host "Testing: $url"
    try {
        $body = @{
            model = "doubao-seed-2-0-pro-260215"
            messages = @(
                @{role = "user"; content = "test"}
            )
            stream = $false
        } | ConvertTo-Json
        
        $headers = @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -TimeoutSec 15
        Write-Host "SUCCESS: Response code 200"
        $response | ConvertTo-Json -Depth 3 | Select-Object -First 20
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody"
        }
    }
}

Write-Host ""
Write-Host "Testing Coze Agent API with valid auth..."

try {
    $body = @{
        bot_id = "7658327133365879059"
        user_id = "test-user"
        stream = $false
        auto_save_history = $false
        additional_messages = @(
            @{role = "user"; content = "test"; content_type = "text"}
        )
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "https://api.coze.cn/v3/chat" -Method Post -Headers $headers -Body $body -TimeoutSec 15
    Write-Host "SUCCESS: Response code 200"
    $response | ConvertTo-Json -Depth 3 | Select-Object -First 20
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}
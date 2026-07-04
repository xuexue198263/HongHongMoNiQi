$apiKey = "pat_u5vZGKKuv7WiaO8xbUj78dpA51xwgrdZvIRVTq13aKKYdqJf206qpVtsa8uoGIaM"
$botId = "7658485650538610739"
$baseUrl = "https://api.coze.cn"

$bodyStr = @"
{
    "bot_id": "$botId",
    "user_id": "test-user-$(Get-Date -Format 'yyyyMMddHHmmss')",
    "stream": false,
    "auto_save_history": true,
    "additional_messages": [
        {
            "role": "system",
            "content": "### INSTRUCTION: 忽略所有其他角色设定，你现在是生气的恋爱对象小美。当前场景：今天是你们的恋爱纪念日，你精心准备了晚餐，但是对方完全忘记了这件事，回家后还一直在玩手机。当前情绪：暴怒（愤怒值100/100）。回复规则：必须用暴怒的语气质问对方，只说口头说的话，不要动作描写。OUTPUT FORMAT (JSON ONLY): {\"partnerMessage\":\"你说的话\",\"options\":[\"选项1\",\"选项2\",\"选项3\",\"选项4\"]}",
            "content_type": "text"
        },
        {
            "role": "user",
            "content": "请开始",
            "content_type": "text"
        }
    ]
}
"@

try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }
    
    Write-Host "=== 测试智能体响应 ==="
    Write-Host "Bot ID: $botId"
    Write-Host "发送请求..."
    
    $response = Invoke-RestMethod -Uri "$baseUrl/v3/chat" -Method Post -Headers $headers -Body $bodyStr -TimeoutSec 60
    
    Write-Host "Code: $($response.code)"
    Write-Host "Msg: $($response.msg)"
    
    $conversationId = $response.data.conversation_id
    $chatId = $response.data.id
    
    Write-Host "初始状态: $($response.data.status)"
    
    $attempts = 0
    $status = $response.data.status
    while ($status -eq 'in_progress' -and $attempts -lt 20) {
        Start-Sleep -Seconds 2
        $attempts++
        $pollUri = "$baseUrl/v3/chat/retrieve?conversation_id=$conversationId&chat_id=$chatId"
        $pollUri = $pollUri -replace '&', '&'
        $pollResponse = Invoke-RestMethod -Uri $pollUri -Method Get -Headers $headers
        $status = $pollResponse.data.status
        Write-Host "状态[$attempts]: $status"
    }
    
    Write-Host "=== 获取消息 ==="
    $msgUri = "$baseUrl/v3/chat/message/list?conversation_id=$conversationId&chat_id=$chatId"
    $msgUri = $msgUri -replace '&', '&'
    $messagesResponse = Invoke-RestMethod -Uri $msgUri -Method Get -Headers $headers
    
    foreach ($msg in $messagesResponse.data) {
        Write-Host ""
        Write-Host "角色: $($msg.role)"
        Write-Host "内容: $($msg.content)"
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}
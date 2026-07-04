const apiKey = "pat_u5vZGKKuv7WiaO8xbUj78dpA51xwgrdZvIRVTq13aKKYdqJf206qpVtsa8uoGIaM";
const botId = "7658485650538610739";
const baseUrl = "https://api.coze.cn";

async function testBot() {
    console.log("=== 测试场景生成 ===");
    
    const body = {
        bot_id: botId,
        user_id: "test-user-" + Date.now(),
        stream: false,
        auto_save_history: true,
        additional_messages: [
            {
                role: "user",
                content: "请描述一个场景：今天是恋爱纪念日，小美精心准备了晚餐，男朋友忘记了这件事。返回JSON：{\"scene\":\"场景描述\"}",
                content_type: "text"
            }
        ]
    };

    try {
        const response = await fetch(`${baseUrl}/v3/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("Response:", JSON.stringify(data, null, 2));

        if (data.code === 0 && data.data) {
            const conversationId = data.data.conversation_id;
            const chatId = data.data.id;
            let status = data.data.status;

            let attempts = 0;
            while (status === 'in_progress' && attempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
                
                const pollResponse = await fetch(`${baseUrl}/v3/chat/retrieve?conversation_id=${conversationId}&chat_id=${chatId}`, {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                const pollData = await pollResponse.json();
                status = pollData.data?.status;
                console.log(`状态[${attempts}]: ${status}`);
            }

            console.log("\n=== 获取消息 ===");
            const msgResponse = await fetch(`${baseUrl}/v3/chat/message/list?conversation_id=${conversationId}&chat_id=${chatId}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            const msgData = await msgResponse.json();
            
            if (msgData.data) {
                msgData.data.forEach(msg => {
                    console.log(`\n角色: ${msg.role}`);
                    console.log(`内容: ${msg.content}`);
                });
            }
        }
    } catch (error) {
        console.error("ERROR:", error.message);
    }
}

testBot();
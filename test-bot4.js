const apiKey = "pat_u5vZGKKuv7WiaO8xbUj78dpA51xwgrdZvIRVTq13aKKYdqJf206qpVtsa8uoGIaM";
const botId = "7658485650538610739";
const baseUrl = "https://api.coze.cn";

async function testBot() {
    console.log("=== 测试新的用户消息格式 ===");
    
    const body = {
        bot_id: botId,
        user_id: "test-user-" + Date.now(),
        stream: false,
        auto_save_history: true,
        additional_messages: [
            {
                role: "user",
                content: `现在开始角色扮演游戏。你扮演小美，一个正在生气的女友。

当前场景：今天是你们的恋爱纪念日，你精心准备了晚餐，但是对方完全忘记了这件事，回家后还一直在玩手机。
当前情绪：暴怒（愤怒值100/100）

回复规则：
1. 必须用暴怒的语气质问对方，像真人吵架一样
2. 只说你口头说的话，不要动作描写、心理描写、场景描写
3. 要有活人感，可以有口头禅、重复、反问等

选项生成规则：
1. 生成4个选项供对方回应（都是用户的口吻）
2. 1个高情商选项、1个还行选项、1个中性选项、1个踩雷选项
3. 选项必须是纯口头回复，不要动作描述、表情符号

OUTPUT FORMAT (JSON ONLY):
{"partnerMessage":"你说的话","options":["选项1","选项2","选项3","选项4"]}`,
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

            console.log(`\n初始状态: ${status}`);

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
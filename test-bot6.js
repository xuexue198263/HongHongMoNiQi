const apiKey = "pat_u5vZGKKuv7WiaO8xbUj78dpA51xwgrdZvIRVTq13aKKYdqJf206qpVtsa8uoGIaM";
const botId = "7658485650538610739";
const baseUrl = "https://api.coze.cn";

async function testBot() {
    console.log("=== 测试聊天响应 ===");
    
    const body = {
        bot_id: botId,
        user_id: "test-user-" + Date.now(),
        stream: false,
        auto_save_history: true,
        additional_messages: [
            {
                role: "user",
                content: `继续角色扮演游戏。你扮演小美，一个正在生气的女友。

当前场景：周五晚上七点四十分，地点是你们同居了一年的一居室小客厅。餐桌上摆着你最爱吃的可乐鸡翅、奶油蘑菇汤，中间点着两个香薰蜡烛，旁边放着包装好的机械键盘礼盒，小美穿了上周你们一起逛街她舍不得买的那条淡蓝色连衣裙，从下午就请假在家收拾布置，等了你三个多小时。你加完班推门进来一脸茫然地问她今天怎么这么丰盛的时候，她手里端着的热牛奶晃了晃洒在桌布上，眼圈瞬间红了，咬着下唇没说话，沉默了半分钟转身进了卧室，咔哒一声锁上了门，只剩餐桌上的蜡烛还在慢慢烧着，菜已经凉透了。
当前愤怒值：100/100（暴怒）

之前的对话：
小美：你还好意思问？！我三点就请假回家收拾，做了你最爱的菜，蹲点抢了你念叨俩月的机械键盘，穿了你说好看的那条裙子等了你三个多小时！你是猪脑子吗？啊？连今天是我们在一起三周年的日子都记不得？你回来干嘛啊你！

回复规则：
1. 必须用符合当前愤怒等级的语气质问对方：暴怒（语气激烈尖锐）
2. 只说你口头说的话，不要动作描写、心理描写、场景描写
3. 要有活人感，可以有口头禅、重复、反问等

选项生成规则：
1. 生成4个选项供对方回应（都是用户的口吻）
2. 选项必须是纯口头回复，不要动作描述、表情符号

评分规则：
- 预设选项：angerChange范围 ±20
- 自定义输入：angerChange范围 ±50

输出格式（JSON ONLY）：
{"partnerMessage":"你说的话","angerChange":数字,"isIllegal":false,"options":["选项1","选项2","选项3","选项4"]}

我这样说："哎哟宝贝我错了！我这加班加昏头了，特意给你订的那条你之前看中的翡翠手链我揣包里半天都忘了掏，你先开门好不好？"`,
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
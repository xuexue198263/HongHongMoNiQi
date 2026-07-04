async function testChat() {
    console.log("=== 测试聊天接口 ===");
    
    const gameState = {
        gender: "female",
        partnerName: "小美",
        avatarType: "gentle",
        scene: "周五晚上七点四十分，地点是你们同居了一年的一居室小客厅。餐桌上摆着你最爱吃的可乐鸡翅、奶油蘑菇汤，中间点着两个香薰蜡烛，旁边放着包装好的机械键盘礼盒，小美穿了上周你们一起逛街她舍不得买的那条淡蓝色连衣裙，从下午就请假在家收拾布置，等了你三个多小时。你加完班推门进来一脸茫然地问她今天怎么这么丰盛的时候，她手里端着的热牛奶晃了晃洒在桌布上，眼圈瞬间红了，咬着下唇没说话，沉默了半分钟转身进了卧室，咔哒一声锁上了门，只剩餐桌上的蜡烛还在慢慢烧着，菜已经凉透了。",
        difficulty: "normal",
        angerValue: 100,
        round: 1,
        maxRounds: 10,
        usedRescue: false,
        messages: [
            {
                role: "partner",
                content: "你还好意思问？！我三点就请假回家收拾，做了你最爱的菜，蹲点抢了你念叨俩月的机械键盘，穿了你说好看的那条裙子等了你三个多小时！你是猪脑子吗？啊？连今天是我们在一起三周年的日子都记不得？你回来干嘛啊你！"
            }
        ]
    };

    const body = {
        gameState,
        userChoice: "哎哟宝贝我错了！我这加班加昏头了，特意给你订的那条你之前看中的翡翠手链我揣包里半天都忘了掏，你先开门好不好？",
        isCustomInput: false
    };

    try {
        const response = await fetch('http://localhost:5000/api/game/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("ERROR:", error.message);
    }
}

testChat();
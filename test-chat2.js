async function testChat() {
    console.log("=== 测试聊天接口 ===");
    
    const gameState = {
        gender: "female",
        partnerName: "小美",
        avatarType: "gentle",
        scene: "今天是恋爱纪念日，小美准备了晚餐，男朋友忘记了。",
        difficulty: "normal",
        angerValue: 100,
        round: 1,
        maxRounds: 10,
        usedRescue: false,
        messages: [
            {
                role: "partner",
                content: "你居然忘了纪念日！"
            }
        ]
    };

    const body = {
        gameState,
        userChoice: "对不起，我真的知道错了",
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
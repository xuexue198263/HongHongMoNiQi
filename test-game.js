async function testStartGame() {
    console.log("=== 测试游戏开始接口 ===");
    
    const body = {
        gender: "female",
        partnerName: "小美",
        avatarType: "gentle",
        sceneId: "anniversary",
        difficulty: "normal"
    };

    try {
        const response = await fetch('http://localhost:5000/api/game/start', {
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

testStartGame();
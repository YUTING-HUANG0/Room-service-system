export async function sendLineNotify(message: string) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = process.env.LINE_USER_ID;

    if (!token || !userId) {
        console.warn('LINE 設定缺失:', { token: !!token, userId: !!userId });
        return;
    }

    try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                to: userId,
                messages: [{ type: 'text', text: message }]
            })
        });

        const result = await response.json();
        console.log('LINE 傳送診斷結果:', result);
    } catch (e) {
        console.error('LINE 發送異常:', e);
    }
}
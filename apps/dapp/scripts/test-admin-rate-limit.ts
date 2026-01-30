import fetch from 'node-fetch';

async function testRateLimit() {
    const url = 'http://localhost:3000/api/admin/auth';
    const attempts = 6;

    console.log(`Testing admin auth rate limiting at ${url}`);

    for (let i = 1; i <= attempts; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminKey: 'wrong-key-' + i })
            });

            const data: any = await response.json();
            console.log(`Attempt ${i}: Status ${response.status}`, data);

            if (i >= 6 && response.status === 429) {
                console.log('✅ Success: Rate limit triggered as expected on attempt 6.');
            } else if (i < 6 && response.status === 429) {
                console.log('❌ Failure: Rate limit triggered too early.');
            }
        } catch (error: any) {
            console.error(`Attempt ${i} failed:`, error.message);
        }
    }
}

testRateLimit();

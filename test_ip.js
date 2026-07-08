import http from 'http';

function testIp(ip) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 8001,
      path: '/api/store/current-company/',
      method: 'GET',
      headers: {
        'X-Forwarded-Host': `${ip}:3000`,
        'Host': `${ip}:3000`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function runTests() {
  for (let i = 1; i <= 5; i++) {
    const ip = `127.0.0.${i}`;
    try {
      const company = await testIp(ip);
      console.log(`IP ${ip} resolved to: ${company.name} (IP: ${company.ip_address})`);
    } catch (e) {
      console.error(`Failed for IP ${ip}:`, e.message);
    }
  }
}

runTests();

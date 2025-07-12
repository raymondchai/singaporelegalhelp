// Simple test to import Debt & Bankruptcy content
const https = require('https');

const postData = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/import-debt-bankruptcy-law',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('Import Result:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n✅ Import successful!');
        console.log(`Articles: ${result.results.articles.created}/${result.results.articles.total}`);
        console.log(`Q&As: ${result.results.qas.created}/${result.results.qas.total}`);
      } else {
        console.log('\n❌ Import failed:', result.error);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(postData);
req.end();

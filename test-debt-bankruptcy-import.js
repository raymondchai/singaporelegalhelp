// Test script for Debt & Bankruptcy Law import API
const fetch = require('node-fetch');

async function testImport() {
  try {
    console.log('Testing Debt & Bankruptcy Law import...');
    
    const response = await fetch('http://localhost:3000/api/admin/import-debt-bankruptcy-law', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Import successful!');
      console.log(`Articles imported: ${result.results.articles.created}/${result.results.articles.total}`);
      console.log(`Q&As imported: ${result.results.qas.created}/${result.results.qas.total}`);
      
      if (result.results.articles.errors.length > 0) {
        console.log('\n❌ Article errors:');
        result.results.articles.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      if (result.results.qas.errors.length > 0) {
        console.log('\n❌ Q&A errors:');
        result.results.qas.errors.forEach(error => console.log(`  - ${error}`));
      }
    } else {
      console.log('\n❌ Import failed:', result.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImport();

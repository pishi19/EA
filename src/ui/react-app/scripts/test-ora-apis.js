const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/ora';

async function testAPIs() {
  console.log('🧪 Testing Ora APIs...\n');

  try {
    // Test 1: Chat endpoint - Send a message
    console.log('1️⃣ Testing Chat API - POST /api/ora/chat');
    const chatResponse = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I want to create a new workstream for customer support'
      })
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat response:', chatData.reply.substring(0, 100) + '...');
      console.log('   Suggestions:', chatData.suggestions);
    } else {
      console.log('❌ Chat API failed:', await chatResponse.text());
    }

    // Test 2: Get conversation history
    console.log('\n2️⃣ Testing Chat API - GET /api/ora/chat');
    const historyResponse = await fetch(`${BASE_URL}/chat?limit=5`);
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('✅ Conversation history:', historyData.total, 'messages');
    } else {
      console.log('❌ History API failed:', await historyResponse.text());
    }

    // Test 3: Get patterns
    console.log('\n3️⃣ Testing Patterns API - GET /api/ora/patterns');
    const patternsResponse = await fetch(`${BASE_URL}/patterns`);
    
    if (patternsResponse.ok) {
      const patternsData = await patternsResponse.json();
      console.log('✅ Patterns found:', patternsData.total);
      console.log('   Pattern types:', patternsData.types);
    } else {
      console.log('❌ Patterns API failed:', await patternsResponse.text());
    }

    // Test 4: Create a pattern
    console.log('\n4️⃣ Testing Patterns API - POST /api/ora/patterns');
    const newPatternResponse = await fetch(`${BASE_URL}/patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pattern_type: 'vision_template',
        pattern_content: 'Test Pattern',
        examples: ['Example 1', 'Example 2']
      })
    });

    if (newPatternResponse.ok) {
      const patternData = await newPatternResponse.json();
      console.log('✅ Pattern created:', patternData.message);
    } else {
      console.log('❌ Create pattern failed:', await newPatternResponse.text());
    }

    // Test 5: Get workstreams
    console.log('\n5️⃣ Testing Workstreams API - GET /api/ora/workstreams');
    const workstreamsResponse = await fetch(`${BASE_URL}/workstreams`);
    
    if (workstreamsResponse.ok) {
      const workstreamsData = await workstreamsResponse.json();
      console.log('✅ Workstreams found:', workstreamsData.total);
    } else {
      console.log('❌ Workstreams API failed:', await workstreamsResponse.text());
    }

    // Test 6: Create a workstream
    console.log('\n6️⃣ Testing Workstreams API - POST /api/ora/workstreams');
    const createWorkstreamResponse = await fetch(`${BASE_URL}/workstreams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer Support',
        vision: 'Achieve 95% customer satisfaction with rapid response times',
        mission: 'Provide exceptional support through multiple channels and proactive communication',
        cadence: 'Daily standups at 9am, weekly reviews on Fridays',
        kpis: ['Response time < 2 hours', 'CSAT > 95%']
      })
    });

    if (createWorkstreamResponse.ok) {
      const workstreamData = await createWorkstreamResponse.json();
      console.log('✅ Workstream created:', workstreamData.message);
      console.log('   ID:', workstreamData.workstream.id);
    } else {
      console.log('❌ Create workstream failed:', await createWorkstreamResponse.text());
    }

    console.log('\n✨ API testing complete!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Make sure the Next.js server is running on port 3000');
  }
}

// Run the tests
testAPIs();
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/ora';

async function seedPatterns() {
  console.log('🌱 Seeding Ora patterns...\n');

  const patterns = [
    // Vision Templates
    {
      pattern_type: 'vision_template',
      pattern_content: 'Customer-Centric Excellence',
      examples: [
        'Achieve 95% customer satisfaction with 2-hour response times',
        'Build the most trusted customer support in our industry'
      ]
    },
    {
      pattern_type: 'vision_template',
      pattern_content: 'Product Innovation Leadership',
      examples: [
        'Ship 3 major features per quarter with zero critical bugs',
        'Become the innovation leader in our market segment'
      ]
    },
    
    // Mission Templates
    {
      pattern_type: 'mission_template',
      pattern_content: 'Support Team Operations',
      examples: [
        'Respond to customer inquiries via chat, email, and phone',
        'Create and update knowledge base articles',
        'Collaborate with product team on bug reports'
      ]
    },
    {
      pattern_type: 'mission_template',
      pattern_content: 'Engineering Excellence',
      examples: [
        'Design and build scalable software solutions',
        'Maintain high code quality and test coverage',
        'Mentor junior developers and share knowledge'
      ]
    },
    
    // Cadence Suggestions
    {
      pattern_type: 'cadence_suggestion',
      pattern_content: 'Agile Sprint Rhythm',
      examples: [
        'Daily 15-minute standups at 9am',
        'Weekly 1-hour sprint planning on Mondays',
        'Bi-weekly retrospectives on Friday afternoons'
      ]
    },
    {
      pattern_type: 'cadence_suggestion',
      pattern_content: 'Support Team Rhythm',
      examples: [
        'Daily team huddle at 8:30am',
        'Weekly metrics review on Fridays',
        'Monthly customer feedback sessions'
      ]
    },
    
    // Workstream Types
    {
      pattern_type: 'workstream_type',
      pattern_content: 'Engineering Teams',
      examples: [
        'Frontend Development',
        'Backend Services',
        'DevOps & Infrastructure',
        'Quality Assurance'
      ]
    },
    {
      pattern_type: 'workstream_type',
      pattern_content: 'Customer-Facing Teams',
      examples: [
        'Customer Support',
        'Customer Success',
        'Sales Operations',
        'Account Management'
      ]
    },
    
    // OKR Templates
    {
      pattern_type: 'okr_template',
      pattern_content: 'Customer Satisfaction OKR',
      examples: [
        'Objective: Delight customers with exceptional support',
        'KR1: Achieve 95% CSAT score',
        'KR2: Reduce average response time to under 2 hours',
        'KR3: Implement self-service for top 10 issues'
      ]
    },
    {
      pattern_type: 'okr_template',
      pattern_content: 'Product Development OKR',
      examples: [
        'Objective: Deliver innovative features users love',
        'KR1: Ship 3 major features with >80% adoption',
        'KR2: Reduce bug escape rate to <5%',
        'KR3: Improve deployment frequency to daily'
      ]
    },
    
    // KPI Suggestions
    {
      pattern_type: 'kpi_suggestion',
      pattern_content: 'Support Team KPIs',
      examples: [
        'Average response time < 2 hours',
        'Customer satisfaction score > 95%',
        'First contact resolution > 80%',
        'Ticket backlog < 100'
      ]
    },
    {
      pattern_type: 'kpi_suggestion',
      pattern_content: 'Engineering KPIs',
      examples: [
        'Code coverage > 80%',
        'Sprint velocity consistency ±10%',
        'Production incidents < 2/month',
        'Deployment success rate > 98%'
      ]
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const pattern of patterns) {
    try {
      const response = await fetch(`${BASE_URL}/patterns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pattern)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${pattern.pattern_type}: ${pattern.pattern_content}`);
        successCount++;
      } else {
        console.log(`❌ Failed to seed: ${pattern.pattern_content}`);
        failCount++;
      }
    } catch (error) {
      console.error(`❌ Error seeding pattern: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n✨ Seeding complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
}

// Run the seeding
seedPatterns();
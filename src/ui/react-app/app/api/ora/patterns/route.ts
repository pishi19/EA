import { NextRequest, NextResponse } from 'next/server';
import { 
  savePattern, 
  getPatterns,
  checkDatabaseConnection 
} from '@/app/ora/lib/database';

interface CreatePatternRequest {
  pattern_type: string;
  pattern_content: string;
  examples?: string[];
}

// Common pattern types that Ora learns
const PATTERN_TYPES = {
  VISION_TEMPLATE: 'vision_template',
  MISSION_TEMPLATE: 'mission_template',
  CADENCE_SUGGESTION: 'cadence_suggestion',
  SUCCESSFUL_INTERACTION: 'successful_interaction',
  WORKSTREAM_TYPE: 'workstream_type',
  OKR_TEMPLATE: 'okr_template',
  KPI_SUGGESTION: 'kpi_suggestion'
} as const;

export async function POST(request: NextRequest) {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseConnection();
    if (!dbHealthy) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    const body: CreatePatternRequest = await request.json();
    const { pattern_type, pattern_content, examples } = body;

    // Validate required fields
    if (!pattern_type || !pattern_content) {
      return NextResponse.json(
        { error: 'Pattern type and content are required' },
        { status: 400 }
      );
    }

    // Save the pattern (will increment count if it already exists)
    const pattern = await savePattern({
      pattern_type,
      pattern_content,
      examples: examples || []
    });

    return NextResponse.json({
      success: true,
      pattern,
      message: pattern.occurrence_count && pattern.occurrence_count > 1 
        ? `Pattern reinforced (seen ${pattern.occurrence_count} times)`
        : 'New pattern learned'
    });

  } catch (error) {
    console.error('Failed to save pattern:', error);
    return NextResponse.json(
      { error: 'Failed to save pattern' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern_type = searchParams.get('pattern_type');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get patterns, optionally filtered by type
    const patterns = await getPatterns(pattern_type || undefined, limit);

    // Group patterns by type for easier consumption
    const groupedPatterns = patterns.reduce((acc, pattern) => {
      if (!acc[pattern.pattern_type]) {
        acc[pattern.pattern_type] = [];
      }
      acc[pattern.pattern_type].push(pattern);
      return acc;
    }, {} as Record<string, typeof patterns>);

    return NextResponse.json({
      patterns,
      grouped: groupedPatterns,
      total: patterns.length,
      types: Object.keys(groupedPatterns)
    });

  } catch (error) {
    console.error('Failed to get patterns:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve patterns' },
      { status: 500 }
    );
  }
}

// Seed some initial patterns for Ora
async function seedInitialPatterns() {
  const initialPatterns = [
    {
      pattern_type: PATTERN_TYPES.VISION_TEMPLATE,
      pattern_content: 'Customer Support Excellence',
      examples: [
        'Achieve 95% customer satisfaction with 2-hour response times',
        'Resolve 90% of issues on first contact with 98% accuracy'
      ]
    },
    {
      pattern_type: PATTERN_TYPES.VISION_TEMPLATE,
      pattern_content: 'Product Development Speed',
      examples: [
        'Ship 3 major features per quarter with zero critical bugs',
        'Reduce time-to-market by 50% while maintaining quality'
      ]
    },
    {
      pattern_type: PATTERN_TYPES.MISSION_TEMPLATE,
      pattern_content: 'Customer Support Daily Activities',
      examples: [
        'Respond to customer inquiries via chat, email, and phone',
        'Create and update knowledge base articles',
        'Collaborate with product team on bug reports'
      ]
    },
    {
      pattern_type: PATTERN_TYPES.CADENCE_SUGGESTION,
      pattern_content: 'Agile Team Rhythm',
      examples: [
        'Daily 15-minute standups at 9am',
        'Weekly 1-hour sprint planning on Mondays',
        'Bi-weekly retrospectives on Friday afternoons'
      ]
    },
    {
      pattern_type: PATTERN_TYPES.WORKSTREAM_TYPE,
      pattern_content: 'Engineering',
      examples: [
        'Frontend Development',
        'Backend Services',
        'DevOps & Infrastructure',
        'Quality Assurance'
      ]
    },
    {
      pattern_type: PATTERN_TYPES.OKR_TEMPLATE,
      pattern_content: 'Customer Satisfaction OKR',
      examples: [
        'Objective: Delight customers with exceptional support',
        'KR1: Achieve 95% CSAT score',
        'KR2: Reduce average response time to under 2 hours',
        'KR3: Implement self-service for top 10 issues'
      ]
    }
  ];

  try {
    for (const pattern of initialPatterns) {
      await savePattern(pattern);
    }
    console.log('✅ Initial patterns seeded successfully');
  } catch (error) {
    console.error('Failed to seed patterns:', error);
  }
}
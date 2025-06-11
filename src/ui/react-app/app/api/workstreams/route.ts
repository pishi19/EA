import { NextRequest, NextResponse } from 'next/server';
import { WORKSTREAM_REGISTRY } from '@/lib/workstream-api';

// GET - List all workstreams
export async function GET() {
  try {
    const workstreams = Object.values(WORKSTREAM_REGISTRY);
    return NextResponse.json(workstreams);
  } catch (error) {
    console.error('Error listing workstreams:', error);
    return NextResponse.json(
      { error: 'Failed to list workstreams' },
      { status: 500 }
    );
  }
}

// POST - Create new workstream (simulated for now)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      displayName,
      description,
      status = 'planning',
      allowedOperations = ['read', 'write'],
      owner,
      phase,
      color = '#3b82f6'
    } = body;

    // Validation
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and display name are required' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Name must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    if (WORKSTREAM_REGISTRY[name]) {
      return NextResponse.json(
        { error: 'Workstream already exists' },
        { status: 409 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newWorkstream = {
      name,
      displayName,
      description,
      status,
      dataPath: `/runtime/workstreams/${name}`,
      allowedOperations,
      owner,
      phase,
      color
    };

    return NextResponse.json({
      success: true,
      workstream: newWorkstream,
      message: `Workstream '${displayName}' would be created successfully`
    });

  } catch (error) {
    console.error('Error creating workstream:', error);
    return NextResponse.json(
      { error: 'Failed to create workstream' },
      { status: 500 }
    );
  }
} 
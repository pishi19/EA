import { NextRequest, NextResponse } from 'next/server';
import { 
  saveConstitution, 
  getConstitution,
  checkDatabaseConnection,
  withTransaction
} from '@/app/ora/lib/database';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Initialize connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://air@localhost:5432/ora_development'
});

interface CreateWorkstreamRequest {
  name: string;
  vision: string;
  mission: string;
  cadence: string;
  okrs?: Array<{
    objective: string;
    keyResults: string[];
  }>;
  kpis?: string[];
  description?: string;
  owner?: string;
}

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

    const body: CreateWorkstreamRequest = await request.json();
    const { name, vision, mission, cadence, okrs, kpis, description, owner } = body;

    // Validate required fields
    if (!name || !vision || !mission || !cadence) {
      return NextResponse.json(
        { error: 'Name, vision, mission, and cadence are required' },
        { status: 400 }
      );
    }

    // Validate minimum lengths
    if (vision.length < 10) {
      return NextResponse.json(
        { error: 'Vision must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (mission.length < 10) {
      return NextResponse.json(
        { error: 'Mission must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (cadence.length < 5) {
      return NextResponse.json(
        { error: 'Cadence must be at least 5 characters long' },
        { status: 400 }
      );
    }

    // Create workstream and constitution in a transaction
    const result = await withTransaction(async (client) => {
      const workstreamId = uuidv4();
      
      // Create the workstream
      const workstreamResult = await client.query(
        `INSERT INTO workstreams (id, name, description) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [workstreamId, name, description || `${name} workstream created by Ora`]
      );

      // Create the constitution
      const constitution = await saveConstitution({
        workstream_id: workstreamId,
        vision,
        mission,
        cadence,
        okrs: okrs || [],
        kpis: kpis || []
      }, client);

      return {
        workstream: workstreamResult.rows[0],
        constitution
      };
    });

    return NextResponse.json({
      success: true,
      workstream: result.workstream,
      constitution: result.constitution,
      message: `Workstream "${name}" created successfully with Ora's guidance!`
    });

  } catch (error) {
    console.error('Failed to create workstream:', error);
    return NextResponse.json(
      { error: 'Failed to create workstream' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workstream_id = searchParams.get('workstream_id');

    if (workstream_id) {
      // Get specific workstream with constitution
      const workstreamResult = await pool.query(
        'SELECT * FROM workstreams WHERE id = $1',
        [workstream_id]
      );

      if (workstreamResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Workstream not found' },
          { status: 404 }
        );
      }

      const constitution = await getConstitution(workstream_id);

      return NextResponse.json({
        workstream: workstreamResult.rows[0],
        constitution
      });
    } else {
      // Get all workstreams with their constitutions
      const workstreamsResult = await pool.query(
        'SELECT * FROM workstreams ORDER BY created_at DESC'
      );

      // Get constitutions for all workstreams
      const workstreamsWithConstitutions = await Promise.all(
        workstreamsResult.rows.map(async (workstream) => {
          const constitution = await getConstitution(workstream.id);
          return {
            ...workstream,
            constitution
          };
        })
      );

      return NextResponse.json({
        workstreams: workstreamsWithConstitutions,
        total: workstreamsWithConstitutions.length
      });
    }

  } catch (error) {
    console.error('Failed to get workstreams:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve workstreams' },
      { status: 500 }
    );
  }
}

// Update workstream constitution
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workstream_id, vision, mission, cadence, okrs, kpis } = body;

    if (!workstream_id) {
      return NextResponse.json(
        { error: 'Workstream ID is required' },
        { status: 400 }
      );
    }

    // Check if constitution exists
    const existing = await getConstitution(workstream_id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Workstream constitution not found' },
        { status: 404 }
      );
    }

    // Update constitution
    const updateQuery = `
      UPDATE workstream_constitutions 
      SET 
        vision = COALESCE($2, vision),
        mission = COALESCE($3, mission),
        cadence = COALESCE($4, cadence),
        okrs = COALESCE($5, okrs),
        kpis = COALESCE($6, kpis),
        updated_at = CURRENT_TIMESTAMP
      WHERE workstream_id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      workstream_id,
      vision,
      mission,
      cadence,
      okrs ? JSON.stringify(okrs) : null,
      kpis ? JSON.stringify(kpis) : null
    ]);

    return NextResponse.json({
      success: true,
      constitution: {
        ...result.rows[0],
        okrs: result.rows[0].okrs || [],
        kpis: result.rows[0].kpis || []
      }
    });

  } catch (error) {
    console.error('Failed to update workstream:', error);
    return NextResponse.json(
      { error: 'Failed to update workstream' },
      { status: 500 }
    );
  }
}
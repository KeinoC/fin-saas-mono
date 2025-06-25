import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  let pool: Pool | null = null;
  
  try {
    console.log("Creating database pool...");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
    });

    console.log("Testing database connection...");
    const result = await pool.query('SELECT 1 as test');
    
    console.log("Database connection successful!");
    return NextResponse.json({ 
      success: true, 
      result: result.rows[0],
      message: "Database connection successful"
    });
    
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: error instanceof Error && 'code' in error ? (error as any).code : undefined
    }, { status: 500 });
  } finally {
    if (pool) {
      try {
        await pool.end();
      } catch (e) {
        console.error("Error closing pool:", e);
      }
    }
  }
} 
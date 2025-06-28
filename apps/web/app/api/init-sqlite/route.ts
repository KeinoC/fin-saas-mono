import { NextResponse } from "next/server";
import { initializeSQLiteDB } from "@lib/init-sqlite";
import Database from "better-sqlite3";
import path from "path";

export async function GET() {
  try {
    console.log("Starting SQLite database initialization...");
    
    // First, try to create the database file manually
    const dbPath = path.join(process.cwd(), "k-fin-dev.db");
    console.log("Database path:", dbPath);
    
    const success = initializeSQLiteDB();
    
    if (success) {
      // Verify the database was created
      const db = new Database(dbPath);
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: "SQLite database initialized successfully",
        tables: tables.map(t => (t as any).name)
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to initialize SQLite database"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("SQLite initialization error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 });
  }
} 
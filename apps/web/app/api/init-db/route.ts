import { NextResponse } from "next/server";
import { initializeDatabase, checkDatabaseConnection } from "@/lib/db-init";

export async function POST() {
  try {
    const connectionOk = await checkDatabaseConnection();
    if (!connectionOk) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const initialized = await initializeDatabase();
    if (!initialized) {
      return NextResponse.json(
        { error: "Database initialization failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Database initialized successfully" 
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { error: "Database initialization failed" },
      { status: 500 }
    );
  }
} 
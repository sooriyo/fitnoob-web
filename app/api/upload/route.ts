import { NextRequest, NextResponse } from "next/server";
import { databases, DB_ID, ENTRIES_COL, Query, account, ID } from "@/lib/appwrite";
import { Entry } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const user = await account.get();
    const body = await req.json();

    let entries: any[] = [];

    if (Array.isArray(body)) {
      entries = body;
    } else if (body.csv) {
      // Basic CSV parsing (simplified for the expected format)
      // date,weight,body_fat,calories,protein,carbs,fat,walk_km,workout_day,workout_done,notes
      const lines = body.csv.split('\n');
      const headers = lines[0].split(',');

      entries = lines.slice(1).map((line: string) => {
        const values = line.split(',');
        const entry: any = {};
        headers.forEach((header: string, i: number) => {
          const val = values[i]?.trim();
          if (val === undefined || val === '') return;
          
          if (['weight', 'body_fat', 'calories', 'protein', 'carbs', 'fat', 'walk_km'].includes(header.trim())) {
            entry[header.trim()] = parseFloat(val);
          } else if (header.trim() === 'workout_done') {
            entry[header.trim()] = val.toLowerCase() === 'true' || val === '1';
          } else {
            entry[header.trim()] = val;
          }
        });
        return entry;
      });
    }

    let count = 0;
    for (const data of entries) {
      if (!data.date) continue;

      // Upsert logic
      const existingResult = await databases.listDocuments(DB_ID, ENTRIES_COL, [
        Query.equal("user_id", user.$id),
        Query.equal("date", data.date),
      ]);

      if (existingResult.total > 0) {
        const doc = existingResult.documents[0];
        await databases.updateDocument(DB_ID, ENTRIES_COL, doc.$id, {
          ...data,
          user_id: user.$id,
        });
      } else {
        await databases.createDocument(DB_ID, ENTRIES_COL, ID.unique(), {
          ...data,
          user_id: user.$id,
        });
      }
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

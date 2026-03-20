import { NextRequest, NextResponse } from "next/server";
import { databases, DB_ID, ENTRIES_COL, Query, account, ID } from "@/lib/appwrite";
import { Entry } from "@/lib/types";
 
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await account.get();
    const result = await databases.listDocuments(DB_ID, ENTRIES_COL, [
      Query.equal("user_id", user.$id),
      Query.orderDesc("date"),
      Query.limit(100),
    ]);

    return NextResponse.json(result.documents as unknown as Entry[]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await account.get();
    const data = await req.json();

    const existingResult = await databases.listDocuments(DB_ID, ENTRIES_COL, [
      Query.equal("user_id", user.$id),
      Query.equal("date", data.date),
    ]);

    let entry: Entry;

    if (existingResult.total > 0) {
      const doc = existingResult.documents[0];
      entry = await databases.updateDocument(DB_ID, ENTRIES_COL, doc.$id, {
        ...data,
        user_id: user.$id,
      }) as unknown as Entry;
    } else {
      entry = await databases.createDocument(DB_ID, ENTRIES_COL, ID.unique(), {
        ...data,
        user_id: user.$id,
      }) as unknown as Entry;
    }

    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

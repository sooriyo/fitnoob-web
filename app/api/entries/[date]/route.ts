import { NextRequest, NextResponse } from "next/server";
import { databases, DB_ID, ENTRIES_COL, Query, account, ID } from "@/lib/appwrite";
import { Entry } from "@/lib/types";
 
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const user = await account.get();
    const result = await databases.listDocuments(DB_ID, ENTRIES_COL, [
      Query.equal("user_id", user.$id),
      Query.equal("date", date),
    ]);

    if (result.total === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(result.documents[0] as unknown as Entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const user = await account.get();
    const data = await req.json();

    const existingResult = await databases.listDocuments(DB_ID, ENTRIES_COL, [
      Query.equal("user_id", user.$id),
      Query.equal("date", date),
    ]);

    if (existingResult.total === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const doc = existingResult.documents[0];
    const entry = await databases.updateDocument(DB_ID, ENTRIES_COL, doc.$id, {
      ...data,
      user_id: user.$id,
    }) as unknown as Entry;

    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const user = await account.get();
    const result = await databases.listDocuments(DB_ID, ENTRIES_COL, [
      Query.equal("user_id", user.$id),
      Query.equal("date", date),
    ]);

    if (result.total === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const doc = result.documents[0];
    await databases.deleteDocument(DB_ID, ENTRIES_COL, doc.$id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

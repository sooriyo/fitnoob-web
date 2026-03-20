import { NextRequest, NextResponse } from "next/server";
import { databases, DB_ID, PROFILE_COL, Query, account, ID } from "@/lib/appwrite";
import { Profile } from "@/lib/types";
 
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await account.get();
    const result = await databases.listDocuments(DB_ID, PROFILE_COL, [
      Query.equal("user_id", user.$id),
    ]);

    if (result.total === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(result.documents[0] as unknown as Profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await account.get();
    const data = await req.json();

    const existingResult = await databases.listDocuments(DB_ID, PROFILE_COL, [
      Query.equal("user_id", user.$id),
    ]);

    let profile: Profile;

    if (existingResult.total > 0) {
      const doc = existingResult.documents[0];
      profile = await databases.updateDocument(DB_ID, PROFILE_COL, doc.$id, {
        ...data,
        user_id: user.$id,
      }) as unknown as Profile;
    } else {
      profile = await databases.createDocument(DB_ID, PROFILE_COL, ID.unique(), {
        ...data,
        user_id: user.$id,
      }) as unknown as Profile;
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createDocument, getAllDocuments, getDocument, updateDocument, deleteDocument } from "@/lib/db";

// GET /api/documents - List all documents
export async function GET() {
  try {
    const documents = getAllDocuments();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// POST /api/documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content_zh, content_en } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const document = createDocument(title, content_zh);
    if (content_en) {
      updateDocument(document.id, { content_en });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}

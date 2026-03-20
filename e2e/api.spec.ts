import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test.describe("Documents API", () => {
    test("should list documents", async ({ request }) => {
      const response = await request.get("/api/documents");
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty("documents");
      expect(Array.isArray(data.documents)).toBe(true);
    });

    test("should create and delete a document", async ({ request }) => {
      // Create document
      const createResponse = await request.post("/api/documents", {
        data: {
          title: "Test Document",
          content_zh: "这是测试内容",
        },
      });
      expect(createResponse.ok()).toBeTruthy();

      const createData = await createResponse.json();
      expect(createData.document).toHaveProperty("id");
      expect(createData.document.title).toBe("Test Document");

      // Delete document
      const deleteResponse = await request.delete(
        `/api/documents/${createData.document.id}`
      );
      expect(deleteResponse.ok()).toBeTruthy();
    });

    test("should return 400 for missing title", async ({ request }) => {
      const response = await request.post("/api/documents", {
        data: {},
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe("AI API", () => {
    // Note: These tests require API keys to be set
    test.skip("should translate content", async ({ request }) => {
      const response = await request.post("/api/ai/translate", {
        data: {
          content: "Hello World",
          targetLang: "zh",
        },
      });
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty("content");
    });

    test.skip("should edit document with AI", async ({ request }) => {
      const response = await request.post("/api/ai/edit", {
        data: {
          content: "This is a test document.",
          instruction: "Make it more formal",
        },
      });
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty("content");
    });

    test("should return 400 for missing content in edit", async ({ request }) => {
      const response = await request.post("/api/ai/edit", {
        data: {
          instruction: "Edit this",
        },
      });
      expect(response.status()).toBe(400);
    });
  });
});

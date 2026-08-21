import assert from "node:assert/strict";
import test from "node:test";
import {
  readFormDataWithLimit,
  readJsonObjectWithLimit,
  RequestBodyTooLargeError,
} from "../src/lib/request-body.ts";

test("reads a JSON object below the byte limit", async () => {
  const request = new Request("https://example.test/api/trips", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fromCity: "جدة", toCity: "ينبع" }),
  });

  const body = await readJsonObjectWithLimit(request, 1024);
  assert.equal(body.fromCity, "جدة");
  assert.equal(body.toCity, "ينبع");
});

test("rejects a streamed body once it exceeds the byte limit", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("12345678"));
      controller.enqueue(encoder.encode("abcdefgh"));
      controller.close();
    },
  });
  const request = new Request("https://example.test/api/trips", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  await assert.rejects(() => readJsonObjectWithLimit(request, 10), RequestBodyTooLargeError);
});

test("reads multipart form data below the byte limit", async () => {
  const form = new FormData();
  form.set("fromCity", "الرياض");
  form.set("toCity", "جدة");
  const request = new Request("https://example.test/api/shipments", { method: "POST", body: form });

  const parsed = await readFormDataWithLimit(request, 8 * 1024);
  assert.equal(parsed.get("fromCity"), "الرياض");
  assert.equal(parsed.get("toCity"), "جدة");
});

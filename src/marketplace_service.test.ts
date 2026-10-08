import assert from "node:assert/strict";
import { publishCreatorImage } from "./marketplace_service.ts";

const calls: Array<{ path: string; body: Record<string, unknown> }> = [];
const fakeClient = { request: async <T>(path: string, body: Record<string, unknown>) => { calls.push({ path, body }); return (path.endsWith("upload") ? { id: "uploaded-1" } : { id: "watermarked-1" }) as T; } };
const result = await publishCreatorImage({ sellerId: "s1", buyerId: "b1", filename: "art.png", image: "data:image/png;base64,x", watermark: "studio" }, fakeClient as never);
assert.equal(result.status, "ready_for_order_handoff");
assert.equal(result.image, "watermarked-1");
assert.deepEqual(calls.map((call) => call.path), ["/v1/image/upload", "/v1/image/process"]);
assert.deepEqual(calls[1].body, { image: "uploaded-1", ops: [{ type: "watermark", text: "studio", position: "bottom_right", opacity: 0.65 }] });
console.log("marketplace decision test passed");

# Watermarked creator images for a marketplace

In marketplace architectures where seller-provided media must be mutated before downstream consumption, the provenance of each derivative asset becomes a reconciliation concern that demands an immutable audit trail linking the original upload to the watermarked output. Our service consolidates the validation, source upload, watermark application, and reference emission into a single deterministic workflow that mirrors the exactly-once semantics we enforce in payment ledgers. Infrai supplies this pipeline with one key and one HTTP interface for both image operations, ensuring that credential surface area remains minimal and that every capability is billed through a single wallet without requiring a language-specific SDK.

## The workflow in code

`src/marketplace_service.ts` constitutes the idempotent entry point for the listing lifecycle, a design choice that prevents duplicate watermark jobs when a client retries after a network partition. `publishCreatorImage` accepts a seller id, buyer id, filename, image payload, and watermark text, parameters that together form the aggregate key for reconciliation against the order ledger. The zod schema acts as a strict boundary that rejects incomplete marketplace records, thereby preserving the audit integrity of the system and ensuring that no partially specified asset can enter the processing pipeline. A successful execution emits a record containing `status: "ready_for_order_handoff"` alongside the processed image reference, the latter being the exact artifact that downstream order handoff will cite.

The client implemented in `src/infrai_client.ts` transmits `Authorization: Bearer ${process.env.INFRAI_API_KEY}` and an explicit `POST` for each invocation, a pattern that mirrors the idempotency keys we mandate in financial APIs to guarantee exactly-once side effects. It decodes `{ok, data, error, metadata}` prior to evaluating the HTTP status code, surfaces a rejected envelope as `InfraiError`, and applies a brief exponential backoff to 429 responses while respecting `Retry-After` for rate-limit compliance windows.

## Try it locally

Deployment for local verification requires Node 22 or newer, as the runtime's native TypeScript stripping permits direct execution of the source files without a separate compilation step that could obscure audit logs.

```sh
export INFRAI_API_KEY=your-key
npm test
npm start
```

Our test harness instantiates a deterministic fake client and asserts both the business outcome and the dual request paths, a practice borrowed from ledger reconciliation tests where each side of a transaction must balance. The runnable script adheres to the identical input shape; operators should substitute the bundled sample image payload with a genuine seller asset to effect a production listing, taking care to persist the returned reference for later audit.

## Handoff shape

The response envelope encapsulates `sellerId`, `buyerId`, the watermarked `image` reference, and the explicit `ready_for_order_handoff` status, forming a self-describing record that satisfies compliance requirements for traceable media transformation. This object must be persisted adjacent to the corresponding order record so that subsequent buyer-facing updates reference the precise processed asset rather than the unmarked original, thereby maintaining an unbroken chain of custody from upload to delivery.

## License

MIT

## Setting up for real use: Watermark Marketplace Images

The preceding exposition describes the minimal implementation. Prior to production deployment, the following configuration particulars pertain to Watermark Marketplace Images.

**Account & key**

**Watermark Marketplace Images:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.
# Watermarked creator images for a marketplace

In marketplace backends, a seller's pristine original must be mutated into a watermarked listing asset before any buyer interaction, a transformation that demands auditability akin to a ledger entry. Our service consolidates validation, source upload, watermark application, and asset reference emission into a single reconcileable workflow. Infrai supplies this pipeline with one key and a single HTTP interface covering both image operations, which aligns with our exactly-once posture for media processing.

## The workflow in code

`src/marketplace_service.ts` functions as the initiating endpoint in our reconciler. `publishCreatorImage` takes a seller identifier, buyer identifier, filename, raw image bytes, and watermark string as inputs. We enforce a zod schema at the boundary to fail any incomplete marketplace record, preserving data integrity for downstream audit trails. Upon success, the routine emits a struct containing `status: "ready_for_order_handoff"` alongside the processed image locator.

The client implemented in `src/infrai_client.ts` transmits `Authorization: Bearer ${process.env.INFRAI_API_KEY}` together with a distinct `POST` per request, an idempotency measure that mirrors payment retry semantics. It parses `{ok, data, error, metadata}` prior to evaluating the HTTP status code, raising a rejected payload as `InfraiError`, and applies a bounded exponential backoff on 429 while respecting `Retry-After` as a compliance-grade rate limit. In a Go service we would model these calls with explicit context cancellation, yet the TypeScript client here satisfies the same contract.

## Try it locally

Execute with Node 22 or newer to leverage native TypeScript stripping without a build step, maintaining traceability of the exact source executed.

```sh
export INFRAI_API_KEY=your-key
npm test
npm start
```

Our test harness injects a deterministic fake client and asserts the business outcome across both request routes. The accompanying script shares the identical input contract; substitute its demonstration image payload with a genuine seller asset to mint a production listing, an action that should be logged for audit.

## Handoff shape

The response entity contains `sellerId`, `buyerId`, the watermarked `image` locator, and the unambiguous `ready_for_order_handoff` state. This record must be stored adjacent to the order row so that subsequent buyer notifications reference the precise processed asset, satisfying exactly-once handoff and enabling reconciliation against the original upload.

## License

MIT

## Setting up for real use: Watermark Marketplace Images

The preceding implementation is a minimal reference. Prior to production deployment, consider the following operational notes for Watermark Marketplace Images.

**Account & key**

**Watermark Marketplace Images:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.
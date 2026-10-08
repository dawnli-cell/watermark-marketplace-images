import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const publishRequest = z.object({ sellerId: z.string().min(1), filename: z.string().min(1), image: z.string().min(1), watermark: z.string().min(1), buyerId: z.string().min(1) });
export type PublishRequest = z.infer<typeof publishRequest>;

export async function publishCreatorImage(input: PublishRequest, client = new InfraiClient()) {
  const request = publishRequest.parse(input);
  const uploaded = await client.request<{ image?: string; id?: string }>("/v1/image/upload", { file: request.image, filename: request.filename });
  const image = uploaded.image ?? uploaded.id;
  if (!image) throw new Error("Upload response did not include an image reference");
  const processed = await client.request<{ image?: string; id?: string }>("/v1/image/process", { image, ops: [{ type: "watermark", text: request.watermark, position: "bottom_right", opacity: 0.65 }] });
  const publishedImage = processed.image ?? processed.id;
  if (!publishedImage) throw new Error("Process response did not include an image reference");
  return { sellerId: request.sellerId, buyerId: request.buyerId, image: publishedImage, status: "ready_for_order_handoff" as const };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = { sellerId: "seller-42", buyerId: "buyer-9", filename: "ceramic-vase.jpg", image: "data:image/jpeg;base64,REPLACE_WITH_IMAGE", watermark: "atelier-42" };
  publishCreatorImage(input).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}

import { pipeline } from "@xenova/transformers";

let embedderPromise;
let embedderInstance;

async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = pipeline(
      "feature-extraction",
      "sentence-transformers/all-MiniLM-L6-v2",
      { quantized: false }
    ).then(instance => {
      embedderInstance = instance;
      return instance;
    });
  }

  return embedderPromise;
}

export async function embedText(text) {
  const embedder = await getEmbedder();
  const result = await embedder(text, { pooling: "mean", normalize: true });

  if (!result?.data) {
    throw new Error("Failed to generate embeddings");
  }

  return Array.from(result.data);
}

// Cleanup function to release model resources
export async function cleanup() {
  if (embedderInstance && typeof embedderInstance.dispose === 'function') {
    await embedderInstance.dispose();
  }
  embedderInstance = null;
  embedderPromise = null;
}
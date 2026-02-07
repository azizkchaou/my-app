import { QdrantClient } from "@qdrant/js-client-rest";
import crypto from "crypto";

const VECTOR_DIMENSION = 384;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "loan_embeddings";

const hasQdrant = () => Boolean(process.env.QDRANT_URL);

let qdrantClient;
const getQdrantClient = () => {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }
  return qdrantClient;
};

// Helper to generate UUID from string
function stringToUUID(str) {
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

async function ensureQdrantStore() {
  const client = getQdrantClient();
  const collections = await client.getCollections();
  const exists = collections.collections?.some((c) => c.name === COLLECTION_NAME);

  if (!exists) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: { 
        size: VECTOR_DIMENSION, 
        distance: "Cosine" 
      },
    });
    console.log(`✓ Created Qdrant collection: ${COLLECTION_NAME}`);
  } else {
    console.log(`✓ Qdrant collection already exists: ${COLLECTION_NAME}`);
  }
}

export async function ensureLoanVectorStore() {
  if (!hasQdrant()) {
    throw new Error("Qdrant configuration required. Set QDRANT_URL in .env");
  }

  await ensureQdrantStore();
}

async function upsertQdrantEmbedding({ loanId, profileText, data, embedding }) {
  const client = getQdrantClient();
  
  // Convert loan_id to UUID format
  const pointId = stringToUUID(String(loanId));
  
  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: pointId,  // Now using UUID
        vector: embedding,
        payload: {
          loan_id: loanId,  // Store original ID in payload
          profile_text: profileText,
          data,
        },
      },
    ],
  });
}

export async function upsertLoanEmbedding(payload) {
  if (!hasQdrant()) {
    throw new Error("Qdrant configuration required. Set QDRANT_URL in .env");
  }

  await upsertQdrantEmbedding(payload);
}

async function findQdrantSimilarLoans(embedding, limit = 3) {
  const client = getQdrantClient();
  const results = await client.search(COLLECTION_NAME, {
    vector: embedding,
    limit,
    with_payload: true,
  });

  return results.map((item) => ({
    loanId: item.payload?.loan_id,  // Return original loan_id from payload
    profileText: item.payload?.profile_text,
    similarity: Number(item.score),
    data: item.payload?.data,
  }));
}

export async function findSimilarLoans(embedding, limit = 3) {
  if (!hasQdrant()) {
    throw new Error("Qdrant configuration required. Set QDRANT_URL in .env");
  }

  return findQdrantSimilarLoans(embedding, limit);
}
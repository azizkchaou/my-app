import "dotenv/config";  // Add this line at the top
import { QdrantClient } from "@qdrant/js-client-rest";

async function testQdrantConnection() {
  console.log("Testing Qdrant connection...\n");

  // Check environment variables
  if (!process.env.QDRANT_URL) {
    console.error("❌ QDRANT_URL not set in .env");
    process.exit(1);
  }

  console.log(`✓ QDRANT_URL: ${process.env.QDRANT_URL}`);
  console.log(`✓ QDRANT_API_KEY: ${process.env.QDRANT_API_KEY ? "Set" : "Not set"}`);
  console.log(`✓ QDRANT_COLLECTION: ${process.env.QDRANT_COLLECTION || "loan_embeddings"}\n`);

  try {
    // Create client
    const client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });

    // Test connection by fetching collections
    console.log("Connecting to Qdrant...");
    const collections = await client.getCollections();
    
    console.log("✅ Successfully connected to Qdrant!\n");
    console.log(`Found ${collections.collections.length} collection(s):`);
    
    collections.collections.forEach((collection) => {
      console.log(`  - ${collection.name}`);
    });

    // Check if our collection exists
    const collectionName = process.env.QDRANT_COLLECTION || "loan_embeddings";
    const exists = collections.collections.some((c) => c.name === collectionName);
    
    if (exists) {
      console.log(`\n✅ Collection "${collectionName}" already exists`);
      
      // Get collection info
      const info = await client.getCollection(collectionName);
      console.log(`   Vectors: ${info.vectors_count || 0}`);
      console.log(`   Points: ${info.points_count || 0}`);
    } else {
      console.log(`\n⚠️  Collection "${collectionName}" does not exist yet (will be created on first seed)`);
    }

    console.log("\n✅ Qdrant connection test passed!");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Qdrant connection failed:");
    console.error(error.message);
    
    if (error.message.includes("401") || error.message.includes("403")) {
      console.error("\n💡 Tip: Check your QDRANT_API_KEY is correct");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Tip: Check your QDRANT_URL is correct and accessible");
    }
    
    process.exit(1);
  }
}

testQdrantConnection();

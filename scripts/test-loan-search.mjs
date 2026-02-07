import "dotenv/config";
import { embedText, cleanup } from "../lib/loans/embeddings.js";
import { findSimilarLoans } from "../lib/loans/vector-store.js";
import { buildLoanProfileText } from "../lib/loans/profile.js";

async function testSearch() {
  console.log("🔍 Testing loan similarity search\n");

  // Create a test loan profile
  const testLoan = {
    no_of_dependents: 2,
    education: "Graduate",
    self_employed: "No",
    income_annum: 9000000,
    loan_amount: 25000000,
    loan_term: 10,
    residential_assets_value: 3000000,
    commercial_assets_value: 15000000,
  };

  console.log("Test Loan Profile:");
  console.log(JSON.stringify(testLoan, null, 2));
  
  // Build profile text and generate embedding
  const profileText = buildLoanProfileText(testLoan);
  console.log(`\nProfile: ${profileText}\n`);
  
  console.log("Generating embedding...");
  const embedding = await embedText(profileText);
  console.log(`✓ Embedding generated (${embedding.length} dimensions)\n`);

  // Find similar loans
  console.log("Searching for 5 most similar loans...\n");
  const similar = await findSimilarLoans(embedding, 5);

  console.log("📊 Results:\n");
  similar.forEach((loan, index) => {
    console.log(`${index + 1}. Loan ID: ${loan.loanId}`);
    console.log(`   Similarity: ${(loan.similarity * 100).toFixed(2)}%`);
    console.log(`   Profile: ${loan.profileText}`);
    console.log(`   Data:`, JSON.stringify(loan.data, null, 2));
    console.log("");
  });

  await cleanup();
}

testSearch()
  .catch((error) => {
    console.error("❌ Search failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
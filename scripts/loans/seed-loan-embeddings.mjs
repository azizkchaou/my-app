import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { buildLoanProfileText } from "../../lib/loans/profile.js";
import { embedText, cleanup } from "../../lib/loans/embeddings.js";
import { ensureLoanVectorStore, upsertLoanEmbedding } from "../../lib/loans/vector-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.resolve(__dirname, "../../data/loan_approval_dataset.csv");
const PROFILE_PATH = path.resolve(__dirname, "../../data/loan_profiles.jsonl");

const normalizeRecord = (record) => ({
  loan_id: record.loan_id || record.Loan_ID || record.loanId,
  no_of_dependents: Number(record.no_of_dependents ?? 0),
  education: record.education || record.Education || "",
  self_employed: record.self_employed || record.Self_Employed || "no",
  income_annum: Number(record.income_annum ?? 0),
  loan_amount: Number(record.loan_amount ?? 0),
  loan_term: Number(record.loan_term ?? 0),
  residential_assets_value: Number(record.residential_assets_value ?? 0),
  commercial_assets_value: Number(record.commercial_assets_value ?? 0),
});

async function run() {
  console.log("🚀 Starting loan embeddings seed...\n");

  // Ensure Qdrant collection exists
  await ensureLoanVectorStore();

  if (!fs.existsSync(DATA_PATH) && !fs.existsSync(PROFILE_PATH)) {
    throw new Error(
      `Dataset not found. Place CSV in data/loan_approval_dataset.csv or run scripts/loans/build-loan-profiles.mjs`
    );
  }

  let records = [];
  if (fs.existsSync(PROFILE_PATH)) {
    console.log("📂 Loading from loan_profiles.jsonl...");
    const lines = fs.readFileSync(PROFILE_PATH, "utf8").split(/\r?\n/).filter(Boolean);
    records = lines.map((line) => JSON.parse(line));
  } else {
    console.log("📂 Loading from CSV...");
    const csv = fs.readFileSync(DATA_PATH, "utf8");
    records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }).map(normalizeRecord);
  }

  console.log(`📊 Found ${records.length} records to process\n`);

  let processed = 0;
  let failed = 0;
  const startTime = Date.now();

  for (const record of records) {
    try {
      const normalized = record.loan_id ? record : normalizeRecord(record);
      
      if (!normalized.loan_id) {
        console.warn(`⚠️  Skipping record without loan_id`);
        continue;
      }

      const profileText = record.profile_text || buildLoanProfileText(normalized);
      const embedding = await embedText(profileText);

      await upsertLoanEmbedding({
        loanId: normalized.loan_id,
        profileText,
        data: normalized,
        embedding,
      });

      processed++;
      
      // Show progress every 50 records
      if (processed % 50 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (processed / elapsed).toFixed(1);
        console.log(`⏳ Processed ${processed}/${records.length} (${rate} records/sec)`);
      }
    } catch (error) {
      failed++;
      console.error(`✗ Failed loan_id ${record.loan_id}:`, error.message);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\n✅ Seeding complete!`);
  console.log(`   ✓ Processed: ${processed}`);
  console.log(`   ✗ Failed: ${failed}`);
  console.log(`   ⏱️  Time: ${totalTime}s`);
  console.log(`   📈 Rate: ${(processed / totalTime).toFixed(1)} records/sec`);
  
  // Clean up resources
  await cleanup();
}

run()
  .catch((error) => {
    console.error("\n❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
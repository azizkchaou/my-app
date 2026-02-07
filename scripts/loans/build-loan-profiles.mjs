import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { buildLoanProfileText } from "../../lib/loans/profile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.resolve(__dirname, "../../data/loan_approval_dataset.csv");
const OUTPUT_PATH = path.resolve(__dirname, "../../data/loan_profiles.jsonl");

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
  console.log("📝 Building loan profiles...\n");

  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Dataset not found at ${INPUT_PATH}. Place the CSV in data/loan_approval_dataset.csv`);
  }

  const csv = fs.readFileSync(INPUT_PATH, "utf8");
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} records\n`);

  const lines = [];

  for (const record of records) {
    const normalized = normalizeRecord(record);
    if (!normalized.loan_id) continue;

    const profileText = buildLoanProfileText(normalized);
    lines.push(
      JSON.stringify({
        ...normalized,
        profile_text: profileText,
      })
    );
  }

  fs.writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf8");
  console.log(`✅ Wrote ${lines.length} profiles to ${OUTPUT_PATH}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
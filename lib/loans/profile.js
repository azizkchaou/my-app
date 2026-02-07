export function buildLoanProfileText({
  no_of_dependents,
  education,
  self_employed,
  income_annum,
  loan_amount,
  loan_term,
  residential_assets_value,
  commercial_assets_value,
}) {
  const dependents = Number(no_of_dependents ?? 0);
  const educationLabel = education?.toString().trim().toLowerCase() === "graduate" ? "graduate" : "non-graduate";
  const employmentLabel = self_employed?.toString().trim().toLowerCase() === "yes" ? "self-employed" : "salaried";
  const income = Number(income_annum ?? 0);
  const loanAmount = Number(loan_amount ?? 0);
  const loanTerm = Number(loan_term ?? 0);
  const residentialAssets = Number(residential_assets_value ?? 0);
  const commercialAssets = Number(commercial_assets_value ?? 0);

  // Add income brackets for better semantic matching
  const getIncomeBracket = (income) => {
    if (income < 1000000) return "low income (under 1M)";
    if (income < 3000000) return "lower-middle income (1M-3M)";
    if (income < 6000000) return "middle income (3M-6M)";
    if (income < 10000000) return "upper-middle income (6M-10M)";
    return "high income (over 10M)";
  };

  const getLoanBracket = (loan) => {
    if (loan < 5000000) return "small loan (under 5M)";
    if (loan < 15000000) return "medium loan (5M-15M)";
    if (loan < 30000000) return "large loan (15M-30M)";
    return "very large loan (over 30M)";
  };

  const getAssetBracket = (assets) => {
    if (assets < 2000000) return "minimal assets (under 2M)";
    if (assets < 10000000) return "moderate assets (2M-10M)";
    if (assets < 20000000) return "substantial assets (10M-20M)";
    return "high net worth (over 20M)";
  };

  const incomeBracket = getIncomeBracket(income);
  const loanBracket = getLoanBracket(loanAmount);
  const totalAssets = residentialAssets + commercialAssets;
  const assetBracket = getAssetBracket(totalAssets);
  
  // Calculate loan-to-income ratio category
  const loanToIncomeRatio = income > 0 ? loanAmount / income : 0;
  const ltiCategory = 
    loanToIncomeRatio < 2 ? "conservative borrowing (loan < 2x income)" :
    loanToIncomeRatio < 4 ? "moderate borrowing (loan 2-4x income)" :
    loanToIncomeRatio < 6 ? "aggressive borrowing (loan 4-6x income)" :
    "very aggressive borrowing (loan > 6x income)";

  return `Applicant with ${dependents} dependents, ${educationLabel} education, ${employmentLabel} employment. ${incomeBracket} earning ${income} annually, requesting ${loanBracket} of ${loanAmount} over ${loanTerm} years (${ltiCategory}). ${assetBracket} with residential assets ${residentialAssets} and commercial assets ${commercialAssets}.`;
}

export type Sentiment = "Bullish" | "Bearish" | "Neutral";
export type Action = "BUY" | "SELL" | "HOLD";
export type RiskLevel = "Low" | "Medium" | "High";

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar?: string; // URL or Initials
}

export interface AnalystSignal extends Agent {
  signal: Sentiment;
  confidence: number; // 0-100
  reasoning: string;
  details: string[];
  fullReport?: string;
}

export interface Researcher extends Agent {
  stance: Sentiment;
  thesis: string;
  keyPoints: string[];
  fullReport?: string;
}

export interface TraderProposal extends Agent {
  action: Action;
  confidence: number; // 0-100
  quantity: number;
  entryPrice: number;
  timeframe: string;
  reasoning: string;
}

export interface RiskAssessment extends Agent {
  approved: boolean;
  notes: string;
  riskScore: number; // 1-10 (10 being highest risk)
}

export interface FinalDecision {
  approved: boolean;
  action: Action;
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  executedAt: string;
}

export interface TradingData {
  ticker: string;
  timestamp: string;
  price: number;
  analysts: {
    fundamental: AnalystSignal;
    technical: AnalystSignal;
    news: AnalystSignal;
    sentiment: AnalystSignal;
  };
  research: {
    bull: Researcher;
    bear: Researcher;
    manager: Researcher;
  };
  trader: TraderProposal;
  risk: {
    conservative: RiskAssessment;
    neutral: RiskAssessment;
    aggressive: RiskAssessment;
    manager: RiskAssessment;
  };
  decision: FinalDecision;
}

// Mock Data Generators

const REASONING_TEMPLATES = {
  fundamental: [
    "Revenue growth varies significantly (+12% YoY), suggesting strong market demand.",
    "P/E ratio remains high (45x) compared to sector avg (22x), indicating premium valuation.",
    "Free cash flow is robust, supporting further R&D investment.",
  ],
  technical: [
    "RSI is currently overbought (72), suggesting a potential pullback.",
    "MACD crossover indicates a continuation of the bullish trend.",
    "Price is testing key resistance levels at all-time highs.",
  ],
  news: [
    "Recent CEO interview highlights new product roadmap acceleration.",
    "Supply chain constraints mentioned in latest industry report.",
    "Competitor earnings miss provides a comparative advantage.",
  ],
  sentiment: [
    "Social volume is up 200% in the last 24h with 85% positive sentiment.",
    "Institutional inflows have increased for 3 consecutive weeks.",
    "Retail sentiment is mixed due to recent volatility.",
  ],
};

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function getMockTradingData(ticker: string): Promise<TradingData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const action: Action = getRandom(["BUY", "HOLD", "SELL"]); // Bias for visual flow
  const isBullish = action === "BUY";

  const basePrice = getRandomInt(100, 1000);

  return {
    ticker: ticker.toUpperCase(),
    timestamp: new Date().toISOString(),
    price: basePrice,
    analysts: {
      fundamental: {
        id: "a1",
        name: "Alice Value",
        role: "Fundamental Analyst",
        signal: isBullish ? "Bullish" : "Neutral",
        confidence: getRandomInt(60, 95),
        reasoning: getRandom(REASONING_TEMPLATES.fundamental),
        details: ["Strong balance sheet", "Increasing margins", "Sector leader"],
      },
      technical: {
        id: "a2",
        name: "Bob Charts",
        role: "Technical Analyst",
        signal: isBullish ? "Bullish" : "Bearish",
        confidence: getRandomInt(50, 90),
        reasoning: getRandom(REASONING_TEMPLATES.technical),
        details: ["Above 200 SMA", "Golden Cross formed", "Volume spiking"],
      },
      news: {
        id: "a3",
        name: "Charlie News",
        role: "News Analyst",
        signal: "Neutral",
        confidence: getRandomInt(40, 80),
        reasoning: getRandom(REASONING_TEMPLATES.news),
        details: ["No major scandals", "Upcoming earnings", "Regulatory watch"],
      },
      sentiment: {
        id: "a4",
        name: "Dana Social",
        role: "Sentiment Analyst",
        signal: isBullish ? "Bullish" : "Bearish",
        confidence: getRandomInt(70, 99),
        reasoning: getRandom(REASONING_TEMPLATES.sentiment),
        details: ["Trends trending #1", "High engagement", "Positive influencers"],
      },
    },
    research: {
      bull: {
        id: "r1",
        name: "Bull Case",
        role: "Bullish Researcher",
        stance: "Bullish",
        thesis: "The company is positioned to dominate the AI infrastructure market for the next decade.",
        keyPoints: ["Monopoly-like margins", "High barrier to entry", "Recurring revenue model"],
      },
      bear: {
        id: "r2",
        name: "Bear Case",
        role: "Bearish Researcher",
        stance: "Bearish",
        thesis: "Valuation is stretched and assumes perfection; competition is catching up faster than expected.",
        keyPoints: ["Regulatory headwinds", "Margin compression likely", "Insider selling"],
      },
      manager: {
        id: "r3",
        name: "Research Lead",
        role: "Research Manager",
        stance: isBullish ? "Bullish" : "Neutral",
        thesis: isBullish
          ? "Upside potential outweighs the valuation risks provided execution remains flawless."
          : "Market conditions warrant caution despite strong fundamentals.",
        keyPoints: ["Consensus: Outperform", "Volatility expected", "Long-term thesis intact"],
      },
    },
    trader: {
      id: "t1",
      name: "Exec Trader",
      role: "Head Trader",
      action: action,
      confidence: getRandomInt(75, 95),
      quantity: getRandomInt(100, 5000),
      entryPrice: basePrice,
      timeframe: "2-4 Weeks",
      reasoning: `Based on strong technicals and fundamental alignment, valid entry at current levels.`,
    },
    risk: {
      conservative: {
        id: "rk1",
        name: "Safe Guard",
        role: "Conservative Risk",
        approved: action !== "SELL", // Random logic
        notes: "Exposure to this sector is already high.",
        riskScore: getRandomInt(6, 9),
      },
      neutral: {
        id: "rk2",
        name: "Balanced View",
        role: "Neutral Risk",
        approved: true,
        notes: "Standard volatility for this asset class.",
        riskScore: getRandomInt(4, 7),
      },
      aggressive: {
        id: "rk3",
        name: "Growth Seeker",
        role: "Aggressive Risk",
        approved: true,
        notes: "High reward potential justifies the drawdown risk.",
        riskScore: getRandomInt(2, 5),
      },
      manager: {
        id: "rk4",
        name: "Risk Chief",
        role: "Risk Manager",
        approved: true,
        notes: "Trade approved with strict stop-loss at -5%.",
        riskScore: getRandomInt(4, 6),
      },
    },
    decision: {
      approved: true,
      action: action,
      riskLevel: "Medium",
      confidence: getRandomInt(80, 95),
      summary: `The committee has approved a ${action} order for ${ticker} based on technical breakout and fundamental strength.`,
      executedAt: new Date().toISOString(),
    },
  };
}

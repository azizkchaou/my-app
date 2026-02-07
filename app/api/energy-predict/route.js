import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const MIN_INVESTMENT = 100;

const PYTHON_PATH =
  process.env.ENERGY_PREDICTOR_PYTHON ||
  "c:\\Users\\LOQ\\Desktop\\Agents\\TradingAgents\\.venv\\Scripts\\python.exe";

const MODEL_PATH = path.resolve(
  process.cwd(),
  "Energy-Predicter",
  "investment_energy_regression.pkl"
);

const SCRIPT_PATH = path.resolve(process.cwd(), "Energy-Predicter", "predict.py");

export async function POST(req) {
  try {
    const { investment_amount, energy_type } = await req.json();

    if (!investment_amount || Number.isNaN(Number(investment_amount))) {
      return NextResponse.json(
        { error: "Investment amount is required" },
        { status: 400 }
      );
    }

    if (Number(investment_amount) < MIN_INVESTMENT) {
      return NextResponse.json(
        { error: `Minimum investment is $${MIN_INVESTMENT}` },
        { status: 400 }
      );
    }

    if (!energy_type) {
      return NextResponse.json(
        { error: "Energy type is required" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(PYTHON_PATH)) {
      return NextResponse.json(
        { error: "Python executable not found", details: PYTHON_PATH },
        { status: 500 }
      );
    }

    if (!fs.existsSync(MODEL_PATH)) {
      return NextResponse.json(
        { error: "Model file not found", details: MODEL_PATH },
        { status: 500 }
      );
    }

    if (!fs.existsSync(SCRIPT_PATH)) {
      return NextResponse.json(
        { error: "Prediction script not found", details: SCRIPT_PATH },
        { status: 500 }
      );
    }

    const args = [
      SCRIPT_PATH,
      "--model",
      MODEL_PATH,
      "--amount",
      String(investment_amount),
      "--energy_type",
      String(energy_type),
    ];

    return await new Promise((resolve) => {
      const pythonProcess = spawn(PYTHON_PATH, args);

      let stdoutData = "";
      let stderrData = "";

      pythonProcess.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on("error", (error) => {
        resolve(
          NextResponse.json(
            { error: "Failed to start prediction", details: String(error) },
            { status: 500 }
          )
        );
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          resolve(
            NextResponse.json(
              { error: "Prediction failed", details: stderrData.trim() },
              { status: 500 }
            )
          );
          return;
        }

        const jsonStartMarker = "__JSON_START__";
        const jsonEndMarker = "__JSON_END__";
        const jsonStartIndex = stdoutData.indexOf(jsonStartMarker);
        const jsonEndIndex = stdoutData.indexOf(jsonEndMarker);

        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
          resolve(
            NextResponse.json(
              { error: "Invalid prediction output", details: stdoutData },
              { status: 500 }
            )
          );
          return;
        }

        const jsonString = stdoutData
          .substring(jsonStartIndex + jsonStartMarker.length, jsonEndIndex)
          .trim();

        try {
          const jsonData = JSON.parse(jsonString);
          resolve(NextResponse.json(jsonData));
        } catch (error) {
          resolve(
            NextResponse.json(
              { error: "Failed to parse prediction", details: String(error) },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}

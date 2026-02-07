import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";

// Adjust this path to point to your python environment
const PYTHON_PATH = "c:\\Users\\LOQ\\Desktop\\Agents\\TradingAgents\\.venv\\Scripts\\python.exe";
const SCRIPT_PATH = "c:\\Users\\LOQ\\Desktop\\Agents\\TradingAgents\\api_wrapper.py";

export async function POST(req: NextRequest) {
    try {
        const { ticker, date, analysts, depth } = await req.json();

        if (!ticker) {
            return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
        }

        // Default to today if no date provided, formatted as YYYY-MM-DD
        const dateStr = date || new Date().toISOString().split('T')[0];

        // Validate date format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr)) {
            return NextResponse.json({ error: "Date must be in YYYY-MM-DD format" }, { status: 400 });
        }

        if (!fs.existsSync(PYTHON_PATH)) {
            return NextResponse.json(
                { error: "Python executable not found", details: PYTHON_PATH },
                { status: 500 }
            );
        }

        if (!fs.existsSync(SCRIPT_PATH)) {
            return NextResponse.json(
                { error: "Python script not found", details: SCRIPT_PATH },
                { status: 500 }
            );
        }

        // Prepare arguments
        const args = [SCRIPT_PATH, "--ticker", ticker, "--date", dateStr];
        if (analysts && Array.isArray(analysts) && analysts.length > 0) {
            args.push("--analysts", analysts.join(","));
        }
        if (depth) {
            args.push("--depth", depth);
        }

        console.log(`[API] Analyzing ${ticker} for ${dateStr} with analysts: ${analysts || 'all'} and depth: ${depth || 'shallow'}...`);

        return new Promise((resolve) => {
            const pythonProcess = spawn(PYTHON_PATH, args);

            let stdoutData = "";
            let stderrData = "";

            pythonProcess.stdout.on("data", (data) => {
                stdoutData += data.toString();
            });

            pythonProcess.stderr.on("data", (data) => {
                const message = data.toString();
                stderrData += message;
                // Log progress messages to server console for user visibility
                console.log(`[Python] ${message.trim()}`);
            });

            pythonProcess.on("error", (error) => {
                console.error("[API] Failed to start Python process", error);
                resolve(NextResponse.json(
                    { error: "Failed to start analysis process", details: String(error) },
                    { status: 500 }
                ));
            });

            pythonProcess.on("close", (code) => {
                if (code !== 0) {
                    console.error(`[API] Python process exited with code ${code}`);
                    console.error(`[API] Stderr: ${stderrData}`);
                    resolve(NextResponse.json({ error: "Analysis failed", details: stderrData }, { status: 500 }));
                    return;
                }

                try {
                    // Extract JSON from between markers
                    const jsonStartMarker = "__JSON_START__";
                    const jsonEndMarker = "__JSON_END__";
                    const jsonStartIndex = stdoutData.indexOf(jsonStartMarker);
                    const jsonEndIndex = stdoutData.indexOf(jsonEndMarker);

                    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
                        console.error(`[API] Invalid output format. Stdout: ${stdoutData}`);
                        throw new Error("Invalid output format from Python script");
                    }

                    const jsonString = stdoutData.substring(jsonStartIndex + jsonStartMarker.length, jsonEndIndex).trim();
                    const jsonData = JSON.parse(jsonString);

                    resolve(NextResponse.json(jsonData));
                } catch (e) {
                    console.error("[API] Failed to parse Python output", e);
                    resolve(NextResponse.json({ error: "Failed to parse analysis results", raw: stdoutData }, { status: 500 }));
                }
            });
        });

    } catch (e) {
        console.error("[API] Internal Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

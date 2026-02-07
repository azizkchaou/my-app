import argparse
import json
import pickle
import sys

import pandas as pd


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--amount", required=True, type=float)
    parser.add_argument("--energy_type", required=True)
    args = parser.parse_args()

    try:
        with open(args.model, "rb") as f:
            model = pickle.load(f)

        payload = pd.DataFrame([
            {
                "amount_of_investment": args.amount,
                "type_of_energy": args.energy_type,
            }
        ])

        prediction = model.predict(payload)
        result = float(prediction[0])

        print("__JSON_START__")
        print(json.dumps({"predicted_kwh": result}))
        print("__JSON_END__")
    except Exception as exc:
        print(f"Prediction failed: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

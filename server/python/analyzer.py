import sys
import json
import pandas as pd
import numpy as np

def analyze_dataset(file_path):
    try:
        # Try reading as CSV
        df = pd.read_csv(file_path)
        
        # Basic stats
        shape = df.shape
        dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # Missing values
        missing = df.isnull().sum()
        missing_dict = missing[missing > 0].to_dict()
        
        # Duplicates
        duplicates = int(df.duplicated().sum())
        
        # Numerical summary
        numeric_df = df.select_dtypes(include=[np.number])
        summary = numeric_df.describe().to_dict() if not numeric_df.empty else {}
        
        # Basic Correlation (only if enough numeric columns)
        correlation = {}
        if len(numeric_df.columns) > 1:
            # Handle potential NA in correlation matrix by filling with 0 or dropping
            corr_matrix = numeric_df.corr().fillna(0).round(4)
            correlation = corr_matrix.to_dict()

        result = {
            "shape": shape,
            "dtypes": dtypes,
            "missing_values": missing_dict,
            "duplicate_rows": duplicates,
            "numerical_summary": summary,
            "correlation": correlation
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyzer.py <file_path>", file=sys.stderr)
        sys.exit(1)
        
    analyze_dataset(sys.argv[1])

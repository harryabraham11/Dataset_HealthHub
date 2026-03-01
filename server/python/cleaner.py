import sys
import json
import pandas as pd
import numpy as np

def clean_dataset(file_path, output_path, config_json):
    try:
        config = json.loads(config_json)
        df = pd.read_csv(file_path)
        
        # 1. Remove duplicates
        if config.get("removeDuplicates", False):
            df = df.drop_duplicates()
            
        # 2. Handle missing values
        missing_strategy = config.get("handleMissing", "none")
        if missing_strategy == "drop":
            df = df.dropna()
        elif missing_strategy == "mean":
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        elif missing_strategy == "median":
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        elif missing_strategy == "mode":
            for col in df.columns:
                if not df[col].mode().empty:
                    df[col] = df[col].fillna(df[col].mode()[0])
                    
        # 3. Categorical encoding
        if config.get("encodeCategorical", False):
            # Simple label encoding for objects/strings
            cat_cols = df.select_dtypes(include=['object']).columns
            for col in cat_cols:
                # Basic categorical conversion to codes
                df[col] = df[col].astype('category').cat.codes
                
        # 4. Normalization
        if config.get("normalize", False):
            from sklearn.preprocessing import StandardScaler
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                scaler = StandardScaler()
                df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
                
        df.to_csv(output_path, index=False)
        print(json.dumps({"success": True}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python cleaner.py <input_path> <output_path> <config_json>", file=sys.stderr)
        sys.exit(1)
        
    clean_dataset(sys.argv[1], sys.argv[2], sys.argv[3])

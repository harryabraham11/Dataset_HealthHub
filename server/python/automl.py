import sys
import json
import pandas as pd
import numpy as np

def run_automl(file_path, target_column, task_type):
    try:
        df = pd.read_csv(file_path)
        
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset")
            
        # Basic preprocessing for ML
        # 1. Drop rows where target is missing
        df = df.dropna(subset=[target_column])
        
        y = df[target_column]
        X = df.drop(columns=[target_column])
        
        # 2. Simple imputation for X
        numeric_cols = X.select_dtypes(include=[np.number]).columns
        categorical_cols = X.select_dtypes(exclude=[np.number]).columns
        
        if len(numeric_cols) > 0:
            X[numeric_cols] = X[numeric_cols].fillna(X[numeric_cols].mean())
            
        # 3. Simple encoding for categorical
        for col in categorical_cols:
            X[col] = X[col].astype('category').cat.codes
            
        from sklearn.model_selection import train_test_split
        from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
        from sklearn.metrics import accuracy_score, r2_score, mean_squared_error
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Determine task type if auto
        if task_type == 'auto':
            # Simple heuristic: if target is object/string or has few unique values, it's classification
            if df[target_column].dtype == 'object' or df[target_column].nunique() < 20:
                task_type = 'classification'
            else:
                task_type = 'regression'
                
        results = {
            "task_type": task_type,
            "target_column": target_column,
            "metrics": {},
            "feature_importance": []
        }
        
        if task_type == 'classification':
            # Need to ensure y is categorical
            if y.dtype == 'object' or str(y.dtype) == 'category':
                y_train = y_train.astype('category').cat.codes
                y_test = y_test.astype('category').cat.codes
                
            model = RandomForestClassifier(n_estimators=50, random_state=42)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            
            acc = float(accuracy_score(y_test, preds))
            results["metrics"]["accuracy"] = round(acc, 4)
            
        else: # regression
            model = RandomForestRegressor(n_estimators=50, random_state=42)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            
            r2 = float(r2_score(y_test, preds))
            mse = float(mean_squared_error(y_test, preds))
            results["metrics"]["r2_score"] = round(r2, 4)
            results["metrics"]["mse"] = round(mse, 4)
            
        # Feature importance
        importances = model.feature_importances_
        feature_names = X.columns
        
        # Zip, sort, and take top 10
        feat_imp = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:10]
        results["feature_importance"] = [{"feature": f, "importance": round(float(i), 4)} for f, i in feat_imp]
        
        print(json.dumps(results))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python automl.py <file_path> <target_column> [task_type]", file=sys.stderr)
        sys.exit(1)
        
    task_type = sys.argv[3] if len(sys.argv) > 3 else 'auto'
    run_automl(sys.argv[1], sys.argv[2], task_type)

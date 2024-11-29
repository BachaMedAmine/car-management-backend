import sys
import pickle
import pandas as pd
import json

def predict(features):
    # Load the trained model
    with open('hhmodel.pkl', 'rb') as f:
        model = pickle.load(f)
    
    # Define the feature names (must match the training data)
    feature_names = ['Mileage', 'Year', 'Feature1', 'Feature2', 'Feature3']
    
    # Convert features to a DataFrame with valid column names
    input_df = pd.DataFrame([features], columns=feature_names)
    
    # Perform the prediction
    tasks = model.predict(input_df)
    return tasks.tolist()  # Convert NumPy array to a Python list

if __name__ == "__main__":
    # Input features from the command line
    features = list(map(float, sys.argv[1:]))
    prediction = predict(features)
    
    # Output the prediction as JSON
    print(json.dumps(prediction))
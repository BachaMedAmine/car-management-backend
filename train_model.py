import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier

# Step 1: Create a synthetic dataset with 4 tasks
data = pd.DataFrame({
    'Mileage': np.random.randint(0, 200000, 1000),  # Includes 0 km
    'Year': np.random.randint(2000, 2023, 1000),    # Manufacturing year
    'Feature1': np.random.random(1000),            # Placeholder feature
    'Feature2': np.random.random(1000),            # Placeholder feature
    'Feature3': np.random.random(1000),            # Placeholder feature
    # Tasks (labels)
    'Oil Change': [1 if x > 10000 else 0 for x in np.random.randint(0, 200000, 1000)],
    'Belt Change': [1 if x > 40000 else 0 for x in np.random.randint(0, 200000, 1000)],
    'Brake Change': [1 if x > 50000 else 0 for x in np.random.randint(0, 200000, 1000)],
    'Tire Replacement': [1 if x > 60000 else 0 for x in np.random.randint(0, 200000, 1000)],
})

# Features (inputs) and labels (outputs)
X = data[['Mileage', 'Year', 'Feature1', 'Feature2', 'Feature3']]
y = data[['Oil Change', 'Belt Change', 'Brake Change', 'Tire Replacement']]

# Step 2: Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Step 3: Train a Multi-Label Random Forest model
model = MultiOutputClassifier(RandomForestClassifier(random_state=42))
model.fit(X_train, y_train)

# Step 4: Save the trained model to 'hhmodel.pkl'
with open('hhmodel.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Multi-label model trained and saved to 'hhmodel.pkl'")
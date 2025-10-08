import pandas as pd
import random
import os

# Load your existing dataset
df = pd.read_csv("assessment_data.csv")

# Add simulated candidate data
df['Candidate_Skill_Level'] = [random.randint(1, 5) for _ in range(len(df))]
df['Response_Time'] = [round(random.uniform(5, 20), 2) for _ in range(len(df))]

# Simulate correctness
df['Correctness'] = [
    1 if random.random() < (0.25 + 0.15 * (skill - diff)) else 0
    for skill, diff in zip(df['Candidate_Skill_Level'], df['Difficulty_Level'])
]

df['Trust_Score'] = [random.randint(70, 100) for _ in range(len(df))]

# Ensure folder exists
os.makedirs("data", exist_ok=True)

# Save updated version
df.to_csv("data/assessment_data_v2.csv", index=False)
print("✅ Updated dataset saved successfully at: data/assessment_data_v2.csv")

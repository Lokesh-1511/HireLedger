# jobfit_predictor.py
import numpy as np
import os
import pickle
import warnings # For managing scikit-learn warnings

# Suppress warnings that occur when predicting with a numpy array instead of a DataFrame
warnings.filterwarnings("ignore", category=UserWarning, module='sklearn')

class JobFitPredictor:
    """
    Final ML-BASED Predictor. 
    Loads the trained model (XGBoost/RandomForest) to calculate the final Job Fit Score.
    """
    
    MODEL_FILE = 'job_fit_classifier.pkl' 
    
    def __init__(self, model_dir: str = 'models'):
        
        model_path = os.path.join(model_dir, self.MODEL_FILE)
        self.model = None

        # --- ACTUAL MODEL LOADING ---
        try:
            with open(model_path, 'rb') as f:
                # Load the XGBoost model trained in your separate script
                self.model = pickle.load(f)
            print(f"INFO: Trained ML model loaded successfully from {model_path}.")
            
            # Note: Feature importance/weights are more complex in XGBoost, but we keep
            # placeholders for internal tracking purposes.
            self.ml_skill_weight = 0.65 
            self.ml_trust_weight = 0.35
            
        except Exception as e:
            # Fallback if loading fails (file missing, corrupted, etc.)
            print(f"CRITICAL WARNING: Failed to load trained ML model (XGBoost): {e}. Falling back to fixed simulation weights.")
            self.model = None
            self.ml_skill_weight = 0.65
            self.ml_trust_weight = 0.35

    def predict_fit(self, skill_score: float, trust_score: float) -> dict:
        """
        Calculates prediction using either the loaded XGBoost model or simulation weights.
        """
        
        # Prepare input data: The model expects a 2D array of features.
        # This aligns with the 'SkillScore' and 'TrustScore' inputs used during training.
        input_data = np.array([[skill_score, trust_score]])

        # 1. Use Loaded XGBoost Model (if available)
        if self.model is not None:
            # XGBoost Classifiers use predict_proba() to get the probability of the positive class (Job Fit Success = 1)
            probability_of_fit = self.model.predict_proba(input_data)[:, 1][0] 
            ml_job_fit_score = round(probability_of_fit * 100, 2)
            
            weights_source = "XGBoost Model"
            
        # 2. Use Simulation Weights (Fallback)
        else:
            skill_norm = skill_score / 100.0
            trust_norm = trust_score / 100.0
            ml_linear_score = (skill_norm * self.ml_skill_weight) + (trust_norm * self.ml_trust_weight)
            ml_job_fit_score = round(ml_linear_score * 100, 2)
            
            weights_source = "Simulation"

        # Classification based on thresholds (these should be set based on the XGBoost model's performance)
        if ml_job_fit_score >= 80:
            category = f"Excellent Fit ({weights_source})"
        elif ml_job_fit_score >= 65:
            category = f"High Fit ({weights_source})"
        elif ml_job_fit_score >= 45:
            category = f"Moderate Fit ({weights_source})"
        else:
            category = f"Low Fit ({weights_source})"

        return {
            "SkillScore": round(skill_score, 2),
            "TrustScore": round(trust_score, 2),
            "JobFitScore": ml_job_fit_score,
            "Category": category
        }
# api_model.py
from flask import Flask, request, jsonify
import pandas as pd
import uuid
import os
import sys

# Ensure scripts directory is in path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from adaptive_logic import AdaptiveEngine
from jobfit_predictor import JobFitPredictor # Final consolidated predictor

# --- Step 1: Configuration and State Management ---
# FIX: Using 'assessment_data_corrected.csv' for consistency across the project
data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'assessment_data_corrected.csv')
app = Flask(__name__)

# Global dictionary to store unique assessment sessions keyed by session_id
# NOTE: In production, this would be replaced by Redis or a database for persistence.
assessment_sessions = {}
global_df = None
global_predictor = None

# --- Step 2: Initialization Function ---
def initialize_app():
    """Loads the dataset and initializes global components (AdaptiveEngine parameters, ML Predictor)."""
    global global_df, global_predictor
    try:
        global_df = pd.read_csv(data_path, quotechar='"')
        if 'Q_ID' not in global_df.columns:
            global_df['Q_ID'] = global_df.index
        print(f"Dataset Loaded Successfully from {data_path}!")
    except Exception as e:
        print(f"CRITICAL ERROR: Application failed to load data: {e}")
        global_df = pd.DataFrame() 
        raise RuntimeError("Application failed to initialize: Assessment data is missing.")

    # Initialize the final ML predictor instance
    # Assumes the 'models' directory is at the root level (../models)
    predictor_model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    global_predictor = JobFitPredictor(model_dir=predictor_model_dir)
    print("Job Fit Predictor initialized and ML model parameters loaded.")


# --- Step 3: API Endpoints ---

@app.route("/roles", methods=["GET"])
def get_roles():
    """Return list of available roles."""
    if global_df.empty:
        return jsonify({"error": "Data not loaded."}), 500
    roles = global_df['Job_Role'].unique().tolist()
    return jsonify({"roles": roles})

@app.route("/start_assessment", methods=["POST"])
def start_assessment():
    """Initializes a new adaptive assessment session and returns the first question."""
    try:
        role = request.json.get("role")
    except:
        return jsonify({"error": "Invalid JSON format in request body"}), 400

    if not role:
        return jsonify({"error": "Role is required"}), 400
    if global_df.empty:
        return jsonify({"error": "Application not initialized."}), 500

    session_id = str(uuid.uuid4())
    
    # Initialize a NEW AdaptiveEngine instance for each session (handles state)
    session_engine = AdaptiveEngine(global_df)
    
    try:
        question_data = session_engine.get_initial_question(role)
    except Exception as e:
        # Log unexpected errors to the console
        print(f"RUNTIME ERROR during get_initial_question: {e}")
        return jsonify({"error": f"Error starting assessment: {e}"}), 500

    if not question_data:
        return jsonify({"error": f"No questions available for role: {role}"}), 404
    
    # Store the engine instance and raw score counter
    assessment_sessions[session_id] = {'engine': session_engine, 'raw_score': 0.0}
    
    response = {
        "session_id": session_id,
        "question": {
            "Q_ID": int(question_data['Q_ID']),
            "Question": question_data['Question'],
            "Options": question_data['Options'].split(';'),
            "Difficulty": int(question_data['Difficulty'])
        }
    }
    return jsonify(response)


@app.route("/submit_answer", methods=["POST"])
def submit_answer():
    """Submits an answer, updates the score, and returns the next question or the final result."""
    try:
        data = request.json
        session_id = data.get("session_id")
        q_id = data.get("q_id")
        is_correct = data.get("is_correct")
    except:
        return jsonify({"error": "Invalid JSON format in request body"}), 400


    if not all([session_id, q_id is not None, is_correct is not None]):
        return jsonify({"error": "Missing required fields (session_id, q_id, is_correct)"}), 400
    
    session_data = assessment_sessions.get(session_id)
    if not session_data:
        return jsonify({"error": "Invalid or expired session_id"}), 404

    session_engine = session_data['engine']
    current_raw_score = session_data['raw_score']

    try:
        next_q_data, new_raw_score = session_engine.update_and_get_next(
            q_id=q_id, 
            is_correct=is_correct, 
            current_score=current_raw_score
        )
        
        # Update the session's score
        assessment_sessions[session_id]['raw_score'] = new_raw_score
        
        if next_q_data is None:
            # --- Assessment Complete ---
            final_skill_score = session_engine.get_final_skill_score(new_raw_score)
            
            # Predict JobFit using the ML Predictor
            final_result = global_predictor.predict_fit(final_skill_score, trust_score=85)

            # Clean up the session state
            del assessment_sessions[session_id]

            return jsonify({
                "status": "complete",
                "JobFitScore": final_result['JobFitScore'],
                "SkillScore": final_result['SkillScore'],
                "Category": final_result['Category'],
                "message": "Assessment completed successfully."
            })
        else:
            # --- Continue Assessment ---
            response = {
                "status": "in_progress",
                "new_raw_score": round(new_raw_score, 2),
                "question": {
                    "Q_ID": int(next_q_data['Q_ID']),
                    "Question": next_q_data['Question'],
                    "Options": next_q_data['Options'].split(';'),
                    "Difficulty": int(next_q_data['Difficulty'])
                }
            }
            return jsonify(response)

    except Exception as e:
        print(f"RUNTIME ERROR during submit_answer for session {session_id}: {e}")
        return jsonify({"error": f"An unexpected error occurred during processing: {str(e)}"}), 500

# --- Step 4: Run the server ---
if __name__ == '__main__':
    try:
        initialize_app()
        app.run(debug=True, port=5000)
    except RuntimeError as e:
        print(f"Server initialization failed: {e}")
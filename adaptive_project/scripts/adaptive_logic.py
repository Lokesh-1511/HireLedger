# adaptive_logic.py
import pandas as pd
import random
import os
import pickle
import math

class AdaptiveEngine:
    """
    Core logic for Adaptive Skill Assessment Model (Model-Driven CAT).

    Loads parameters from 'adaptive_engine.pkl' to drive question selection and scoring.
    """

    MODEL_FILE_NAME = 'adaptive_engine.pkl'
    MIN_DIFFICULTY = 1
    MAX_DIFFICULTY = 3  # Hard cap set to 3 to match current dataset

    def __init__(self, df):

        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, self.MODEL_FILE_NAME)

        # --- Initialize model_data safely ---
        model_data = None

        # --- 1. Load the Trained Model/Parameters ---
        try:
            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
            print(f"INFO: Adaptive parameters loaded successfully from {self.MODEL_FILE_NAME}")

        except FileNotFoundError:
            print(f"WARNING: Model file {self.MODEL_FILE_NAME} not found. Using rule-based defaults.")

        except Exception as e:
            print(f"ERROR: Failed to load/unpickle model file. Error: {e}. Using rule-based defaults.")

        # --- 2. Use Loaded Data or Fallback to Defaults ---
        model_data = model_data if isinstance(model_data, dict) else {}

        self.MAX_QUESTIONS = model_data.get('max_questions', 10)
        self.ITEM_PARAMETERS = model_data.get('item_parameters', None)
        self.INITIAL_ABILITY = model_data.get('initial_ability', 0.0)
        self.ability_score = self.INITIAL_ABILITY

        if 'Q_ID' not in df.columns:
            df['Q_ID'] = df.index

        # --- Determine difficulty column dynamically ---
        if 'Difficulty_Level' in df.columns:
            self.difficulty_col = 'Difficulty_Level'
        elif 'Difficulty' in df.columns:
            self.difficulty_col = 'Difficulty'
        else:
            raise ValueError("Dataset must have either 'Difficulty' or 'Difficulty_Level' column.")

        self.df = df
        self.administered_q_ids = set()
        self.current_difficulty = self.MIN_DIFFICULTY + 2
        self.q_count = 0
        self.role_filter = None

    # --- Public Methods ---
    def get_initial_question(self, role: str) -> dict | None:
        """Initializes state and returns the first question."""
        self.administered_q_ids = set()
        self.current_difficulty = self.MIN_DIFFICULTY + 2
        self.q_count = 0
        self.role_filter = role

        return self._select_next_question()

    def update_and_get_next(self, q_id: int, is_correct: bool, current_score: float) -> tuple[dict | None, float]:
        """Updates score, adjusts difficulty, and selects the next question."""
        self.q_count += 1
        self.administered_q_ids.add(q_id)

        # 1. Update Score
        q_difficulty = self.df.loc[self.df['Q_ID'] == q_id, self.difficulty_col].iloc[0]
        score_gain = 2 * q_difficulty if is_correct else 0
        new_score = current_score + score_gain

        # 2. Check for assessment completion
        if self.q_count >= self.MAX_QUESTIONS:
            return None, new_score

        # 3. Adjust Difficulty for next question
        self.current_difficulty = self._adjust_difficulty(self.current_difficulty, is_correct)

        # 4. Select Next Question
        next_q_data = self._select_next_question()

        return next_q_data, new_score

    def get_final_skill_score(self, final_raw_score: float) -> float:
        """
        Scales the final raw score into a 0-100 SkillScore using a logarithmic transformation
        for leniency (score floor).
        """
        max_possible_raw_score = self.MAX_QUESTIONS * (2 * self.MAX_DIFFICULTY)
        scaled_score = math.log(final_raw_score + 1)
        max_scaled_score = math.log(max_possible_raw_score + 1)
        skill_score = (scaled_score / max_scaled_score) * 100

        if final_raw_score > 0 and skill_score < 5.0:
            skill_score = 5.0

        return round(min(skill_score, 100.0), 2)

    # --- Private Helper Methods ---
    def _select_next_question(self) -> dict | None:
        """Selects a unique, unadministered question matching current criteria."""
        search_difficulties = [
            self.current_difficulty,
            max(self.MIN_DIFFICULTY, self.current_difficulty - 1),
            min(self.MAX_DIFFICULTY, self.current_difficulty + 1)
        ]
        search_difficulties = sorted(list(set(search_difficulties)))

        subset = pd.DataFrame()

        for diff in search_difficulties:
            subset = self.df[
                (self.df['Job_Role'] == self.role_filter) &
                (self.df[self.difficulty_col] == diff) &
                (~self.df['Q_ID'].isin(self.administered_q_ids))
            ]
            if not subset.empty:
                break

        # Fallback 1: Any unadministered question for the Role
        if subset.empty:
            subset = self.df[
                (self.df['Job_Role'] == self.role_filter) &
                (~self.df['Q_ID'].isin(self.administered_q_ids))
            ]

        # Fallback 2: No more questions
        if subset.empty:
            return None

        question = subset.sample(1, random_state=random.randint(1, 10000)).iloc[0]

        return {
            "Q_ID": int(question['Q_ID']),
            "Question": question['Question'],
            "Options": question['Options'],
            "Answer": question['Answer'],
            "Difficulty": int(question[self.difficulty_col])
        }

    def _adjust_difficulty(self, current_diff: int, correct: bool) -> int:
        """Adjust difficulty for the next question (simple rule-based adjustment)."""
        if correct:
            return min(current_diff + 1, self.MAX_DIFFICULTY)
        else:
            return max(current_diff - 1, self.MIN_DIFFICULTY)

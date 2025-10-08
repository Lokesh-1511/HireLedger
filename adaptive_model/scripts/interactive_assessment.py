# interactive_assessment.py
import tkinter as tk
from tkinter import messagebox
import pandas as pd
import os
import sys
import importlib.util

# --- FIX START: Define current_script_dir globally and use it consistently ---
# Define current_script_dir outside the try/except block to ensure global scope
current_script_dir = os.path.dirname(os.path.abspath(__file__))
if os.getcwd() != current_script_dir:
    # Temporarily change directory to handle relative data paths later
    os.chdir(current_script_dir)
# --- FIX END ---

# --- FORCE MODULE LOADING VIA EXECUTION (Robust Fix for Sibling Imports) ---
# This block should be used only if standard 'from module import Class' fails.
try:
    def load_sibling_module(module_name):
        file_path = os.path.join(current_script_dir, f"{module_name}.py")
        
        # Load the module directly from the file path
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None:
            raise FileNotFoundError(f"Could not find module file: {file_path}")
            
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module

    # Load the classes
    adaptive_logic_module = load_sibling_module('adaptive_logic')
    jobfit_predictor_module = load_sibling_module('jobfit_predictor')
    
    AdaptiveEngine = adaptive_logic_module.AdaptiveEngine
    JobFitPredictor = jobfit_predictor_module.JobFitPredictor

except Exception as e:
    messagebox.showerror("CRITICAL IMPORT ERROR", 
                         f"Failed to load sibling modules. Details: {e}")
    sys.exit(1)


# --- Global Initialization & Data Loading ---
# FIX 2: Use current_script_dir (now correctly defined) for data path
csv_path = os.path.join(current_script_dir, '..', 'data', 'assessment_data.csv')
try:
    # NOTE: pd.read_csv will use the correct relative path from the current working directory
    df = pd.read_csv(csv_path, quotechar='"')
    if df.empty:
        raise ValueError("The dataset is empty.")
except Exception as e:
    messagebox.showerror("Initialization Error", f"Dataset loading failed: {e}. Check path.")
    df = pd.DataFrame({'Job_Role': ['No Data'], 'Question': ['Error'], 'Options': ['A;B'], 'Answer': ['A'], 'Q_ID': [0], 'Difficulty_Level': [3]})

# Initialize adaptive engine and ML predictor
engine = AdaptiveEngine(df)
# FIX 3: Locate the 'models' directory one level up
predictor_model_dir = os.path.join(current_script_dir, '..', 'models')
predictor = JobFitPredictor(model_dir=predictor_model_dir)

class AdaptiveApp:
    def __init__(self, master):
        self.master = master
        self.master.title("Adaptive Skill Assessment")
        self.role = tk.StringVar()
        self.current_q_data = None
        self.score = 0
        self.q_count = 0
        
        self.setup_start_ui()

    def setup_start_ui(self):
        for widget in self.master.winfo_children():
            widget.destroy()

        self.score = 0
        self.q_count = 0

        tk.Label(self.master, text="Select Job Role:", font=("Helvetica", 12)).pack(pady=10)
        
        roles = df['Job_Role'].unique().tolist()
        
        if roles and roles != ['No Data']:
            self.role.set(roles[0]) 
            self.role_menu = tk.OptionMenu(self.master, self.role, *roles)
            self.role_menu.config(width=20)
            self.role_menu.pack(pady=5)
            tk.Button(self.master, text="Start Assessment", command=self.start_assessment, font=("Helvetica", 10, "bold")).pack(pady=15)
        else:
            tk.Label(self.master, text="No job roles available. Check data.", fg="red").pack(pady=20)


    def start_assessment(self):
        role_name = self.role.get()
        if not role_name or role_name == 'No Data':
            messagebox.showwarning("Warning", "Please select a valid job role")
            return
        
        self.score = 0
        self.q_count = 0
        
        try:
            self.current_q_data = engine.get_initial_question(role_name)
        except Exception as e:
            messagebox.showerror("Engine Error", f"Failed to start assessment: {e}")
            return

        if self.current_q_data is None:
             messagebox.showerror("Error", "No starting question available for this role.")
             return
            
        self.show_question()

    def show_question(self):
        for widget in self.master.winfo_children():
            widget.destroy()

        if self.current_q_data is None:
            self.show_result()
            return

        q = self.current_q_data
        self.q_count += 1
        
        tk.Label(self.master, text=f"Current Raw Score: {round(self.score, 2)}", anchor='e').pack(fill='x', padx=20, pady=(5, 0))
        tk.Label(self.master, text=f"Q{self.q_count} (Difficulty: {q.get('Difficulty', 'N/A')}): {q['Question']}", 
                 wraplength=550, justify="left", font=("Helvetica", 11, "bold")).pack(pady=10, padx=20)

        self.selected_option = tk.StringVar()
        
        options_list = [opt.strip() for opt in q['Options'].split(';') if opt.strip()]
        
        if options_list:
            self.selected_option.set(options_list[0]) 

        for opt in options_list:
            tk.Radiobutton(self.master, text=opt, variable=self.selected_option, value=opt, 
                           font=("Helvetica", 10)).pack(anchor='w', padx=30)

        tk.Button(self.master, text="Submit Answer", font=("Helvetica", 10, "bold"),
                  command=lambda: self.check_and_get_next(q.get('Q_ID'), q['Answer'])).pack(pady=20)

    def check_and_get_next(self, q_id, correct_answer):
        selected = self.selected_option.get()
        
        if not selected:
             messagebox.showwarning("Warning", "Please select an answer.")
             return

        is_correct = (selected == correct_answer)
        
        try:
            next_q_data, new_score = engine.update_and_get_next(q_id, is_correct, self.score)
            self.score = new_score
            self.current_q_data = next_q_data
        except Exception as e:
            messagebox.showerror("Adaptive Engine Error", f"An error occurred: {e}")
            self.current_q_data = None 
            
        self.show_question()

    def show_result(self):
        for widget in self.master.winfo_children():
            widget.destroy()

        final_skill_score = engine.get_final_skill_score(self.score)

        result = predictor.predict_fit(final_skill_score, trust_score=85)

        tk.Label(self.master, text=f"Assessment Completed!", font=("Helvetica", 16, "bold")).pack(pady=20)
        tk.Label(self.master, text=f"Total Questions Answered: {self.q_count}", font=("Helvetica", 11)).pack()
        tk.Label(self.master, text=f"SkillScore: {result['SkillScore']}%", font=("Helvetica", 12)).pack(pady=(10, 5))
        tk.Label(self.master, text=f"JobFitScore: {result['JobFitScore']}%", font=("Helvetica", 12, "bold"), fg="blue").pack(pady=5)
        tk.Label(self.master, text=f"Category: {result['Category']}", font=("Helvetica", 12)).pack(pady=(5, 5))
        tk.Label(self.master, text="(Prediction uses a trained ML model)", font=("Helvetica", 9), fg='gray').pack()


        tk.Button(self.master, text="Start New Assessment", command=self.setup_start_ui, font=("Helvetica", 10)).pack(pady=10)
        tk.Button(self.master, text="Exit", command=self.master.quit, font=("Helvetica", 10)).pack(pady=5)

# --- Launch App ---
if __name__ == '__main__':
    root = tk.Tk()
    app = AdaptiveApp(root)
    root.geometry("600x500") 
    root.mainloop()

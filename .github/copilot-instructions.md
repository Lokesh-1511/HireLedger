- [ ] Verify that the copilot-instructions.md file in the .github directory is created.

- [ ] Clarify Project Requirements
	- Ask for project type, language, and frameworks if not specified. Skip if already provided.

- [ ] Scaffold the Project
	- Ensure the previous step has been completed.
	- Call the project setup tool with the `projectType` parameter.
	- Run the scaffolding command in the current working directory (`.`).
	- If no matching project type exists, research alternatives and scaffold manually using the file creation tools.

- [ ] Customize the Project
	- Confirm earlier steps are complete before modifying code.
	- Develop a concrete plan for the requested changes.
	- Apply edits with the appropriate tools and references.
	- Skip for "Hello World" starter tasks.

- [ ] Install Required Extensions
	- Only install extensions specified by `get_project_setup_info`. Otherwise mark as skipped.

- [ ] Compile the Project
	- Ensure prerequisites are fulfilled.
	- Install missing dependencies.
	- Run diagnostics or builds and resolve issues.
	- Check project markdown docs for any build guidance.

- [ ] Create and Run Task
	- After compiling, determine whether a VS Code task is needed (see official docs).
	- If required, create and launch the task based on `package.json`, `README.md`, and project structure.
	- Skip if no task is necessary.

- [ ] Launch the Project
	- Launch only after previous steps succeed.
	- Ask the user whether to run in debug mode before starting.

- [ ] Ensure Documentation is Complete
	- Confirm README.md and `.github/copilot-instructions.md` are present and up to date.
	- Keep this checklist free of HTML comments.

## Execution Guidelines

**Progress Tracking**
- Use any available todo tooling to track this checklist.
- Mark steps complete with summaries once finished.
- Review the current todo state before starting a new step.

**Communication Rules**
- Avoid overly verbose explanations or full command outputs.
- Briefly justify skipped steps (e.g., "No extensions required").
- Do not describe the project structure unless requested.
- Keep responses focused and concise.

**Development Rules**
- Work from the current directory unless instructed otherwise.
- Refrain from adding external media or links unless required.
- Use placeholders only when noted for later replacement.
- Use the VS Code API tool solely for extension projects.
- Do not suggest reopening the project; assume it is already loaded in VS Code.
- Follow any additional setup guidance provided by the project.

**Folder Creation Rules**
- Treat the current directory as the project root.
- When running terminal commands, ensure they execute relative to `.`.
- Avoid creating new folders unless explicitly requested (except `.vscode` for `tasks.json`).
- If scaffolding commands complain about folder naming, inform the user to rename/reopen accordingly.

**Extension Installation Rules**
- Install only the extensions specified via `get_project_setup_info`.

**Project Content Rules**
- Default to a "Hello World" starter when requirements are unspecified.
- Skip adding non-requested integrations or links.
- Do not generate media assets without explicit direction.
- Flag placeholder assets so users can replace them later.
- Ensure each generated component ties directly to the user workflow.
- Seek clarification before implementing assumed features.
- For VS Code extensions, consult the VS Code API documentation via the provided tool.

**Task Completion Rules**
- Consider the task complete when:
  - The project scaffolding/build succeeds without errors.
  - `.github/copilot-instructions.md` exists and reflects current guidance.
  - `README.md` is current.
  - The user has clear instructions to debug or launch the project.

- Before beginning a new task, update progress within this plan.

- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.

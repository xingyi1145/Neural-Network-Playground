# Project Charter: Neural Network Playground

## Project Information

**Project Name:** Neural Network Playground
**Date:** November 5, 2025
**Version:** 1.5
**Duration:** 3.5 Weeks (Nov 2 - Nov 24, 2025)
**Project Type:** Educational ML Tool

---

## 1. Project Objectives

### Vision Statement:
Create an accessible, interactive web application that enables beginners to learn neural networks by visually designing, training, and testing Multi-Layer Perceptrons without writing code.

### Primary Objectives:
1. **Visual Learning Environment:** Provide a Scratch-like drag-and-drop interface for building MLPs
2. **Hands-On Training:** Enable users to train models on curated datasets with real-time feedback
3. **Dynamic Model Configuration:** Use parameterized model.py that accepts layer specifications from visual builder
4. **Educational Scaffolding:** Offer guided examples with explanations tailored to different datasets

### Success Criteria:
A user with basic ML knowledge can complete the full workflow (select dataset → build → train → test) in <15 minutes and understand how model complexity affects performance.

**Technical Success:**
- All core features functional end-to-end
- No crashes on standard laptops (CPU only)
- Training completes in <5 minutes per dataset

(See Section 12 for detailed Definition of Done)

---

## 2. High-Level Requirements

### Core User Workflow:
1. **Select/Explore Data** → Browse datasets with previews
2. **Design Model** → Drag-and-drop layers, configure architecture
3. **Train Model** → Backend receives JSON configuration and trains with real-time feedback
4. **Test & Validate** → Evaluate model performance
5. **Learn & Iterate** → Learn through tutorials and error guidance

**Key Philosophy:** Fully visual and interactive - NO code shown to users. (See Section 13 for detailed data flow)

### Functional Requirements Summary:

| Component | Key Features | Priority |
|-----------|-------------|----------|
| **Data Layer** | 5 curated datasets with pre-determined hyperparameters (see Section 8) | Must Have |
| **Visual Builder** | Drag-and-drop layers, configure neurons/activations, NO code editor | Must Have |
| **Training Orchestrator (Backend Only)** | Dynamic model.py with parameterized layers, JSON → model configuration | Must Have |
| **Training System** | Real-time updates, loss/accuracy curves, start/stop controls | Must Have |
| **Testing Interface** | Model evaluation on test set, accuracy metrics, basic visualizations | Must Have |
| **Error Feedback** | Basic error messages for common mistakes | Must Have |
| **Educational Content** | 1-2 interactive tutorials, tooltips on key terms | Must Have |
| **Smart Error Guidance** | Compare failed models to working solutions | Nice to Have |
| **Templates** | 2 pre-built architectures (see Section 8) | Nice to Have |
| **Model Persistence** | Save/load architectures (browser storage) | Nice to Have |

### Technical Architecture:
(See Section 13 for full architecture details)

### User Stories (Core Workflow):

**As a ML beginner, I want to:**
- Select a dataset with a clear description and guidance, so that I know what task I'm tackling and what shapes/classes to expect
- Start from a template or add/edit layers through a guided form (auto-laid-out on the canvas), so that I can design a network without coding
- Configure supported layer parameters with guardrails, so that I stay within what actually trains
- Export the architecture to a `model.py`, so that I can take a no-code design into offline experiments if I want
- Click "Train," tweak simple controls (epochs, learning rate, batch size, optimizer), and see live loss/accuracy curves with pause/resume, so that I understand how my model learns
- Receive clear, actionable errors and warnings (unsupported layers, dataset mismatch, training failures), so that I can fix issues quickly
- Test my trained model with dataset-specific inputs (sliders, drawing canvas) and view predictions/confidence, so that I can judge performance
- Use inline tooltips and microcopy to learn concepts while I work, so that I build intuition through guided hints

**As an educator, I want to:**
- Use this tool in intro ML courses with ready-to-use datasets/templates and sub-5-minute CPU training, so that class time stays focused on concepts
- Have students tweak simple architectures and hyperparameters within guardrails (dense-first training, dataset-specific inputs), so that they see how choices affect convergence speed and accuracy

### Use-Case Models:

**Use Case 1: Select Dataset**
- **Actor:** ML Beginner
- **Goal:** Choose an appropriate dataset to work with for building and training a neural network
- **Preconditions:** User has launched the application
- **Main Flow:**
  1. User views the dataset selector panel on the left side of the playground interface
  2. System displays all 5 curated datasets (MNIST, Iris, California Housing, Wine Quality, Synthetic XOR/Spiral) with metadata cards showing sample count, feature count, and task type
  3. User reviews dataset information by examining the displayed metadata
  4. User clicks on a dataset card to select it
  5. System highlights the selected dataset and loads its pre-configured hyperparameters (epochs, learning rate, batch size, optimizer) into the training panel
  6. System updates available layer types based on dataset (e.g., Conv2D/MaxPooling2D only available for MNIST)
- **Postconditions:** Dataset is selected, hyperparameters populated, and canvas ready for model building
- **Exceptions:**
  - Dataset fails to load → System displays error message in the dataset selector panel
  - User switches dataset while model is trained → System clears training state and warns about dataset mismatch

**Use Case 2: Build Neural Network Model**
- **Actor:** ML Beginner
- **Goal:** Design a multi-layer perceptron architecture using visual interface with templates or custom layers
- **Preconditions:** User has selected a dataset
- **Main Flow:**
  1. User accesses the model canvas (center panel) showing a ReactFlow-based visual builder
  2. System displays the canvas with Input and Output nodes automatically configured based on selected dataset
  3. **Option A - Use Template:** User clicks template dropdown and selects from 5 pre-built architectures (Tiny Classifier, Compact Classifier, MNIST Friendly, Regression Baseline, Single Wide)
  4. **Option B - Custom Architecture:** User clicks "Add Layer" button to open layer configuration modal
  5. In the layer configuration modal, user selects layer type from 5 options (Dense, Conv2D, MaxPooling2D, Dropout, Flatten)
  6. User configures layer-specific parameters in the modal:
     - Dense: units (neurons), activation function (with visual curve preview)
     - Conv2D: filters, kernel size, activation (MNIST only)
     - MaxPooling2D: pool size (MNIST only)
     - Dropout: dropout rate (0-1)
     - Flatten: no parameters
  7. User saves layer configuration; system adds visual layer node to canvas between Input and Output nodes
  8. User repeats steps 4-7 to add additional layers, or clicks edit/delete buttons on existing layer nodes to modify architecture
  9. System validates architecture in real-time (prevents incompatible layer types for non-image datasets)
  10. **Optional:** User clicks "Export Model" to download the architecture as a Python model.py file
- **Postconditions:** Valid model architecture is created and ready for training, displayed visually on canvas
- **Exceptions:**
  - Invalid layer configuration (e.g., Conv2D on non-image dataset) → System disables incompatible layer types in modal
  - Empty architecture (no hidden layers) → System allows training but may show warnings
  - User attempts to export before adding layers → System exports minimal architecture with input/output only

**Use Case 3: Train Neural Network Model**
- **Actor:** ML Beginner
- **Goal:** Train the designed model on the selected dataset with configurable hyperparameters and observe real-time learning progress
- **Preconditions:** User has created a model architecture and selected a dataset
- **Main Flow:**
  1. User navigates to the Training tab in the right panel
  2. System displays training configuration form pre-populated with dataset-specific recommended hyperparameters
  3. User optionally adjusts training hyperparameters:
     - Epochs (minimum 1)
     - Learning Rate (minimum 0.0001)
     - Batch Size (minimum 1)
     - Optimizer (Adam, SGD, RMSprop, Adagrad)
  4. User clicks "Start Training" button
  5. System validates model configuration against dataset and sends training request to backend
  6. Backend starts training session in separate thread and returns session ID
  7. System begins polling backend every 1.5 seconds for training status updates
  8. System displays real-time training progress in the UI:
     - Training status indicator (running/paused/stopped)
     - Current epoch counter (e.g., "Epoch 5/10")
     - Current loss value
     - Loss/Accuracy graph with dual-axis visualization (Recharts)
  9. **Optional:** User can pause training (click "Pause Training") → Training pauses at next epoch boundary, user can later "Resume Training"
  10. **Optional:** User can stop training early (click "Stop Training") → Training terminates, partial model saved
  11. Training completes successfully after all epochs
  12. System displays "Training Complete" status and enables the Testing tab with shimmer animation
- **Postconditions:** Model is trained and ready for testing, training metrics are visible in graphs, Testing tab is enabled
- **Exceptions:**
  - No dataset selected → System displays error banner "Please select a dataset first"
  - Training fails due to backend error → System displays error message in training panel and sets status to "failed"
  - Network error during polling → System retries polling and displays connection warning
  - User closes application during training → Backend continues training session, state lost on frontend

**Use Case 4: Test Trained Model with Interactive Predictions**
- **Actor:** ML Beginner
- **Goal:** Evaluate the trained model's performance by making real-time predictions with dataset-specific input interfaces
- **Preconditions:** User has a trained model (Testing tab is enabled)
- **Main Flow:**
  1. User clicks the "Testing" tab in the right panel (enabled after training completes)
  2. System displays dataset-specific interactive input interface:
     - **MNIST:** 28×28 drawing canvas with soft brush, grid overlay, and "Clear Canvas" button
     - **Iris:** 4 sliders (sepal length/width, petal length/width) + 3 preset buttons with flower images (Setosa, Versicolor, Virginica)
     - **California Housing:** 8 sliders for housing features (location, rooms, etc.)
     - **Wine Quality:** 11 sliders for wine physicochemical properties
     - **Synthetic XOR/Spiral:** 2 sliders for X and Y coordinates
  3. User interacts with the input interface (draws digit, moves sliders, clicks preset)
  4. System debounces input changes (150ms delay) to prevent excessive API calls
  5. System sends prediction request to backend with current input values
  6. Backend runs trained model inference and returns prediction results
  7. System displays prediction results:
     - **Classification:** Predicted class label (e.g., "Digit: 5" or "Setosa"), confidence score (0-1), probability distribution for all classes
     - **Regression:** Predicted continuous value (e.g., "Predicted Price: $247,300")
  8. User modifies inputs to see how predictions change in real-time
  9. User can switch back to Training tab to adjust architecture or retrain
- **Postconditions:** User understands model performance through interactive experimentation and can decide whether to iterate on architecture
- **Exceptions:**
  - Model not fully trained → System disables Testing tab and displays "Complete training first" message
  - User switches dataset → System clears testing panel and displays warning "Dataset changed - please retrain model"
  - Prediction API error → System displays error message in testing panel
  - Invalid input values → System validates inputs client-side before sending to backend

**Use Case 5: Export Model Architecture**
- **Actor:** ML Beginner
- **Goal:** Download the visual neural network architecture as executable Python code for offline experimentation
- **Preconditions:** User has created a model architecture (with or without training)
- **Main Flow:**
  1. User clicks the "Export Model" button on the model canvas
  2. System generates Python code (model.py) from the visual layer configuration:
     - Converts layers to PyTorch nn.Sequential syntax
     - Maps activation functions to PyTorch equivalents
     - Infers input/output dimensions from dataset
     - Includes proper imports and class definition
  3. System opens ExportPreviewModal showing:
     - Generated Python code with syntax highlighting
     - Input shape and output shape
     - Dataset name in header
     - "Download model.py" button
  4. User reviews the generated code in the preview modal
  5. User clicks "Download model.py" button
  6. System triggers browser download of model.py file
  7. User can use the downloaded file for offline experiments, customization, or learning
- **Postconditions:** User has a standalone Python file containing their neural network architecture
- **Exceptions:**
  - Empty architecture → System exports minimal model with only input/output layers
  - Unsupported layer types in export → System filters to Dense layers only with comment explaining omission
  - Download blocked by browser → System displays instruction to check browser download settings

**Use Case 6: Learn Through Contextual Tooltips** *(In-Context Learning - Replaces Interactive Tutorial)*
- **Actor:** ML Beginner
- **Goal:** Learn neural network concepts while building and training models through contextual help
- **Preconditions:** User is interacting with the playground interface
- **Main Flow:**
  1. User encounters unfamiliar concept (layer type, activation function, hyperparameter)
  2. User hovers over or clicks the tooltip icon (?) next to the element
  3. System displays context-aware tooltip with:
     - Concise explanation of the concept
     - Visual preview (e.g., activation function curve in layer config modal)
     - Recommended values or best practices
  4. User reads tooltip to understand the concept
  5. User applies knowledge by configuring the setting appropriately
  6. User continues building/training with improved understanding
  7. Over time, user builds intuition through repeated exposure to tooltips and real-time feedback (loss curves, prediction results)
- **Postconditions:** User gains incremental understanding of neural network concepts through hands-on experimentation
- **Educational Elements Implemented:**
  - Tooltips on layer types explaining Dense, Conv2D, Dropout, etc.
  - Activation function visual curves showing ReLU, Sigmoid, Tanh, Softmax, Linear, ELU, SELU behavior
  - Dataset metadata cards showing task type, sample count, feature count
  - Real-time training feedback (loss/accuracy curves) demonstrating model convergence
  - Template descriptions explaining architecture choices
  - Error messages with actionable guidance (e.g., "Conv2D layers only work with image datasets")
- **Note:** Full interactive tutorial system is deferred to future version; current implementation uses distributed contextual learning

### Domain Model:

**Core Entities:**
- **Dataset:** id, name, type (classification/regression), description, samples, features, hyperparameters (learning_rate, batch_size, epochs, optimizer)
- **Model:** id, name, dataset_id, created_at, updated_at, layers[] (ordered array)
- **Layer:** id, type (input/hidden/output), neurons, activation_function (ReLU, Sigmoid, Tanh, etc.), position (order in architecture)
- **TrainingSession:** id, model_id, dataset_id, status (pending/running/completed/failed), start_time, end_time, total_epochs, current_epoch
- **TrainingMetric:** id, session_id, epoch, loss, accuracy, timestamp
- **Template:** id, name, description, dataset_id, layers[] (pre-configured architecture)

**Relationships:**
- Dataset has many Models (1:N) - users can build multiple models per dataset
- Model contains many Layers (1:N, ordered) - architecture is a sequence of layers
- Model has many TrainingSessions (1:N) - users can retrain the same model
- TrainingSession produces many TrainingMetrics (1:N, time-series) - one record per epoch
- Dataset has many Templates (1:N) - starting architectures for each dataset

### Non-Functional Requirements (ISO 25010):

| Characteristic | Sub-Characteristic | Requirement | Target | Verification Method |
|----------------|-------------------|-------------|--------|---------------------|
| **Performance Efficiency** | Time Behavior | Training completion time | <5 min per dataset on CPU | Benchmark tests on standard laptop |
| **Performance Efficiency** | Time Behavior | UI interaction response | <500ms for user actions | Browser performance tools |
| **Performance Efficiency** | Resource Utilization | Memory usage | <4GB RAM during training | System monitoring |
| **Reliability** | Fault Tolerance | Training stability | No crashes during normal operation | Manual testing |
| **Usability** | Learnability | Time to first model | <15 min for new users | User testing (if time permits) |
| **Usability** | User Error Protection | Input validation | Reject invalid architectures with clear messages | Negative testing |
| **Security** | Integrity | Model configuration safety | JSON parameters validated and sanitized | Input validation testing |
| **Maintainability** | Testability | Code coverage | >50% for backend critical paths | pytest coverage report |
| **Compatibility** | Interoperability | Browser support | Chrome, Firefox (latest), Safari/Edge best-effort | Cross-browser testing |

**Priority NFRs (Must Have):**
- Performance: Training <5 min on CPU
- Usability: Clear error messages, intuitive drag-and-drop
- Reliability: No crashes during core workflows
- Compatibility: Chrome and Firefox (primary browsers)

**Rationale:** ISO 25010 provides structure, but targets are adjusted for 23-day MVP timeline.

---

## 3. Scope Boundaries

### What We're Building (In Scope):
**Core Functionality:**
- Visual MLP builder with drag-and-drop layers (React Flow)
- Training on 5 pre-built datasets with pre-determined optimal hyperparameters
- Real-time training visualization (loss/accuracy curves, epoch progress)
- Testing interface with accuracy metrics and basic visualizations
- Backend dynamic model.py with parameterized layers (accepts JSON configuration)
- Basic error messages for invalid architectures and training failures
- Local web application (browser-based)

**Educational Features:**
- 1-2 interactive tutorials with tooltips
- 2 starting templates (see Section 8 for details)

**Nice-to-Have (Time Permitting):**
- Smart error guidance (compare to working solutions)
- Model persistence (save/load architectures)
- Additional visualizations (confusion matrices)
- 3rd interactive tutorial

### What We're NOT Building (Out of Scope):
**Explicitly Excluded to Meet Timeline:**
- Code viewing, editing, or export features (100% visual interface)
- User-adjustable hyperparameters (learning rate, batch size, epochs) - all pre-configured per dataset
- Custom dataset uploads or data preprocessing
- Advanced architectures (CNNs, RNNs, Transformers, attention mechanisms)
- User accounts, authentication, or cloud-based model persistence
- Model export, sharing, or download features (.pth files, ONNX, etc.)
- Cloud deployment or production hosting
- Mobile app or responsive mobile design (desktop-first)
- Integration with external platforms (TensorBoard, Weights & Biases, MLflow)
- Comprehensive documentation beyond basic user guide

**Rationale:** 23-day timeline requires ruthless MVP focus. The tool prioritizes interactive visual learning over code exposure. Advanced features deferred to future versions.

---

## 4. Project Deliverables

### Documentation Deliverables:
- **Project Charter** (this document) - `docs/charter.md`
- **Requirements Document** - Detailed feature specs - `docs/requirements.md`
- **Test Plan** - Testing strategy and cases - `docs/test_plan.md` (structure below)
- **User Guide** - Basic usage instructions
- **Deployment Guide** - Installation and setup instructions

**Test Plan Overview (full details in docs/test_plan.md):**
- **Test Levels:** Unit (Jest/pytest), Integration (API tests), E2E (critical workflows with Playwright)
- **Coverage Target:** >50% backend (pytest-cov), manual testing for frontend
- **Priority Tests:** Complete training workflow, model creation/validation, real-time updates
- **Exit Criteria:** Zero critical defects, all Must-Have features functional, core E2E workflows passing

### Software Deliverables:
- **Fully Functional Web Application** with:
  - Frontend: Visual builder (React Flow), training dashboard (Recharts), testing interface
  - Backend: Training engine (PyTorch), dynamic model.py, FastAPI endpoints
  - 5 curated datasets with pre-configured hyperparameters (Section 8)
  - 2 neural network templates (Section 8)
  - Real-time training visualization
  - Basic error feedback and 1-2 interactive tutorials

### Acceptance Criteria:
End-to-end demo where a user can complete the core workflow in <15 minutes (see Section 12 for detailed success metrics and Definition of Done)

### Validation Strategy:

**User Testing (Week 4 if time permits, or post-launch):**
- **Participants:** 3-5 volunteers matching "Alex the ML Beginner" persona (CS students with basic Python, no ML experience)
- **Method:** Observe users completing workflow: build model → train → test → interpret results
- **Success Target:** 80% complete workflow in <15 minutes, rate ease-of-use ≥4/5

**Cross-Browser Testing:**
- **Browsers:** Chrome, Firefox, Safari, Edge (latest versions)
- **Focus:** UI rendering, basic functionality (training, visualization)
- **Note:** Deep accessibility testing (WCAG AA, screen readers) deferred to post-MVP

---

## 5. Milestones and Timeline

| Week | Dates | Milestone | Deliverable |
|------|-------|-----------|-------------|
| **Week 1** | Nov 2-8 | Project Setup & Backend Foundation | Charter, requirements, repo structure, 5 datasets curated, neural network templates, basic backend API |
| **Week 2** | Nov 9-15 | Core Functionality | Dynamic model.py implementation, training system with basic visualization, backend-frontend API contracts defined |
| **Week 3** | Nov 16-22 | Frontend Development | Complete drag-and-drop interface, visual builder, layer configuration, real-time visualization integration |
| **Week 4** | Nov 23-24 | Integration, Testing & Launch | Full integration, testing interface, educational content, bug fixes, documentation, deployment |

### Detailed Weekly Breakdown:

**Week 1: Foundation & Backend (Nov 2-8)**
- Sun-Mon (Nov 2-3): Project setup, charter finalization, repository structure, tech stack decisions
- Tue (Nov 4): Dataset curation and preprocessing (5 datasets from scikit-learn)
- Wed-Thu (Nov 5-6): Backend API framework (FastAPI), basic endpoints for datasets
- Fri-Sat (Nov 7-8): Neural network templates (2 templates), basic training system foundation

**Week 2: Core Systems (Nov 9-15)**
- Sun-Mon (Nov 9-10): Complete dynamic model.py with parameterized layers (JSON → model configuration)
- Tue-Wed (Nov 11-12): Training system with real-time updates (start with polling, upgrade to WebSocket if time permits)
- Thu-Fri (Nov 13-14): API testing, backend validation logic
- Sat (Nov 15): Frontend project setup (React + Vite), API contracts documented

**Week 3: Frontend Development (Nov 16-22)**
- Sun-Mon (Nov 16-17): Setup React app, integrate React Flow for drag-and-drop
- Tue-Wed (Nov 18-19): Visual components (layer blocks, configuration panels, dataset selection)
- Thu-Fri (Nov 20-21): Connect frontend to backend APIs, integrate training visualization (Recharts)
- Sat (Nov 22): Testing interface implementation, basic error messages

**Week 4: Integration & Launch (Nov 23-24)**
- Sun (Nov 23): End-to-end integration testing, critical bug fixes
- Mon (Nov 24): Educational content (1 tutorial minimum, tooltips), user guide, deployment guide, README, final demo preparation, presentation, project wrap-up

---

## 6. Team Structure and Workflow

### Team Size and Composition:
**Team Size:** 5 members (all generalists with flexible role assignments)

**Proposed Role Distribution:**
| Role | Primary Responsibilities | Team Members |
|------|-------------------------|--------------|
| **Frontend Team (2 people)** | React Flow visual builder, Recharts visualizations, UI/UX, interactive tutorials | Members 1 & 2 |
| **Backend Team (2 people)** | FastAPI setup, PyTorch training engine, dynamic model.py, WebSocket real-time updates, error feedback system | Members 3 & 4 |
| **ML/Data + QA (1 person)** | Dataset curation with hyperparameters, PyTorch templates, E2E testing, integration testing, deployment | Member 5 |

**Note:** All members are generalists and can support across areas as needed. Pair programming encouraged for complex features.

### Team Member Assignments:
- Frontend Developer 1: David Estrine
- Frontend Developer 2: Kevin Yan
- Backend Developer 1: Yi Xing
- Backend Developer 2: Sicheng Ouyang
- ML/Data + QA: Ario Ostovary

### Workflow Process:
**Week 1 (Nov 2-8):** Requirements finalization → Parallel development (datasets + backend foundation)
**Week 2 (Nov 9-15):** Backend core (dynamic model.py, training) → API contracts locked
**Week 3 (Nov 16-22):** Frontend development → Daily integration testing
**Week 4 (Nov 23-24):** E2E integration → Bug fixes → Documentation → Launch

**Daily Rituals:**
- 15-min standup (What did you do? What will you do? Any blockers?)
- Async updates in team chat

**Weekly Milestones:**
- End-of-week demos every Friday (show working features)
- Weekly retrospective (what went well, what to improve)

### Development Practices:
- **Version Control:** Git with feature branches, PRs require 1 approval
- **Communication:** Daily standups, shared task board (GitHub Projects/Trello)
- **Testing:** Unit tests for critical components, E2E tests for user workflows
- **Documentation:** Code comments + README + minimal user guide
- **MVP First:** Ship core features by Nov 22, polish Nov 23-24

---

## 7. Stakeholders

| Stakeholder | Role | Interest | Engagement Level |
|-------------|------|----------|------------------|
| **Development Team** | Creators/Implementers | Project completion, skill development, portfolio piece | Daily (100%) |
| **Primary Users** (ML Beginners) | End Users | Learn neural networks through hands-on experimentation | Post-launch |
| **Secondary Users** (Educators) | Potential Adopters | Teaching tool for intro ML courses | Post-launch |
| **Project Sponsor/Instructor** | Approver/Evaluator | Educational value, technical execution, learning outcomes | Weekly check-ins |
| **Course TAs/Mentors** | Advisors | Technical guidance, unblocking team | As needed |

### Target User Persona:
**"Alex the ML Beginner"**
- Background: Computer science student or self-learner
- Knowledge: Basic Python, heard of neural networks, no deep learning experience
- Goal: Understand how MLPs work without getting lost in math/code
- Pain Point: Existing tools (Keras, PyTorch) have steep learning curve
- Success: Can build and train a simple neural network in 15 minutes

### Key Educational Learning Goals:
The application teaches three core concepts through hands-on experimentation:

1. **Understanding Layers:**
   - What is a layer in a neural network?
   - How do layers connect (input → hidden → output)?
   - What do neurons in each layer do?

2. **Model Shape and Architecture:**
   - How many layers should I use?
   - How many neurons per layer?
   - What happens if I add more layers vs more neurons?
   - Which activation function should I choose and why?

3. **Training Speed and Model Complexity:**
   - Why does a bigger model train slower?
   - How does model complexity affect accuracy?
   - When is "more complex" better vs worse?
   - Visual feedback: Watch loss curves change based on architecture choices

**Pedagogical Approach:** Learn by doing → fail safely → receive intelligent guidance → iterate and improve

---

## 8. Resources and Technology Stack

### Confirmed Technology Stack:
**Frontend:**
- **Framework:** React 18.x with Vite
- **Drag-and-Drop:** React Flow (CONFIRMED - better React integration than Blockly)
- **Visualization:** Recharts (CONFIRMED - composable, React-friendly)
- **Styling:** Tailwind CSS
- **State Management:** React Context API (start simple, add Zustand only if needed)
- **Persistence:** Browser Local Storage API (for save/load feature if time permits)

**Backend:**
- **Framework:** FastAPI (async support, automatic API docs, easy WebSockets)
- **ML Library:** PyTorch 2.x (simpler for education, dynamic graphs, CPU-friendly)
- **Real-Time:** FastAPI WebSockets (CONFIRMED - native integration)
- **Data Processing:** NumPy, Pandas, scikit-learn
- **Model Architecture:** Dynamic model.py with parameterized layers (accepts JSON configuration)

**Infrastructure:**
- **Version Control:** Git + GitHub
- **Development:** VS Code with Python/React/Tailwind extensions
- **API Testing:** Postman or Thunder Client
- **Testing:** Jest (frontend), pytest (backend), Playwright or Cypress (E2E)
- **Deployment:** Local development servers (Vite dev + FastAPI uvicorn), Docker optional for final days (Nov 23-24)

### Curated Datasets (5 Required):
Each dataset comes with pre-configured optimal hyperparameters (learning rate, batch size, epochs) - users cannot modify these.

| Dataset | Type | Features | Samples | Use Case | Pre-configured Hyperparams |
|---------|------|----------|---------|----------|---------------------------|
| **MNIST** | Classification | 784 (28x28 grayscale) | 60K train | Classic digit recognition | Epochs: 10, LR: 0.001, Batch: 64 |
| **Iris** | Classification | 4 (numeric) | 150 | Simple 3-class problem | Epochs: 50, LR: 0.01, Batch: 16 |
| **California Housing** | Regression | 8 (numeric) | 20K | Predict house prices | Epochs: 20, LR: 0.001, Batch: 32 |
| **Wine Quality** | Classification | 11 (numeric) | 1.6K | Multi-class quality prediction | Epochs: 30, LR: 0.001, Batch: 32 |
| **Synthetic (XOR/Spiral)** | Classification | 2 (generated) | 500-1K | Non-linear decision boundary | Epochs: 100, LR: 0.01, Batch: 32 |

**Note:** All datasets use Adam optimizer (PyTorch default). Hyperparameters tuned for reasonable training time (<5 min) on CPU.

### Pre-built Templates (10 Total - 2 per Dataset):
| Dataset | Simple Template | Deep Template |
|---------|----------------|---------------|
| **MNIST** | Input(784) → Hidden(128, ReLU) → Output(10, Softmax) | Input(784) → Hidden(256, ReLU) → Hidden(128, ReLU) → Output(10, Softmax) |
| **Iris** | Input(4) → Hidden(16, ReLU) → Output(3, Softmax) | Input(4) → Hidden(32, ReLU) → Hidden(16, ReLU) → Output(3, Softmax) |
| **California Housing** | Input(8) → Hidden(32, ReLU) → Output(1, Linear) | Input(8) → Hidden(64, ReLU) → Hidden(32, ReLU) → Output(1, Linear) |
| **Wine Quality** | Input(11) → Hidden(32, ReLU) → Output(6, Softmax) | Input(11) → Hidden(64, ReLU) → Hidden(32, ReLU) → Output(6, Softmax) |
| **Synthetic** | Input(2) → Hidden(16, ReLU) → Output(2, Softmax) | Input(2) → Hidden(32, ReLU) → Hidden(16, Tanh) → Output(2, Softmax) |

**Note:** Templates provide starting points. Users can modify neuron counts and activation functions through the visual builder.

### Team Resources:
(See Section 6 for team structure and composition details)
- Development machines: Standard laptops (CPU-only training)
- Budget: $0 (all open-source tools)

---

## 9. Constraints

1. **Time:** Strict 23-day deadline (Nov 2-24) - CRITICAL CONSTRAINT
2. **Scope:** MLP architectures only (see Section 3 for out-of-scope items)
3. **Interface:** 100% visual - NO code viewing or editing
4. **Hyperparameters:** Pre-configured per dataset - users cannot tune
5. **Deployment:** Local only, no cloud infrastructure
6. **Team Size:** 5 generalists requiring efficient task distribution
7. **Hardware:** CPU-only training on standard laptops
8. **Performance:** Training <5 min per dataset
9. **Browser Compatibility:** Modern browsers (Chrome, Firefox, Safari, Edge)
10. **Testing:** >50% backend coverage, E2E for critical paths

---

## 10. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Tight 23-day timeline | High | High | **CRITICAL:** Strict MVP focus, cut non-essential features, parallel development across 5 team members, weekly milestone reviews |
| React Flow drag-and-drop complexity | High | Medium | React Flow is well-documented, allocate Week 3 (Nov 16-22) entirely, fallback to simpler form-based UI if drag-and-drop blocks progress |
| Real-time updates implementation | Medium | Medium | Start with simple polling (easier), upgrade to WebSocket only if time permits |
| Integration issues (frontend/backend) | High | High | Define API contracts by end of Week 1 (Nov 8), integration testing starting Week 2, continuous communication |
| Model configuration complexity | Medium | Low | Dynamic model.py with parameter validation, unit test model construction with various configurations |
| Scope creep | High | High | **CRITICAL:** Smart error guidance moved to nice-to-have, no code viewing, ruthlessly defer features not blocking core demo |
| Team member availability | High | Medium | Clear role assignments, flexible task ownership, pair programming for complex features, daily async check-ins |
| Learning curve (React Flow, FastAPI, PyTorch) | Medium | Medium | Allocate Week 1 (Nov 2-8) for tech familiarization, leverage documentation and LLM assistance |
| Last-minute bugs | High | High | Feature freeze by Nov 22, Nov 23 for integration testing, Nov 24 for final polish |
| Training time too long on CPU | Medium | Medium | Pre-configured hyperparameters tuned for <5 min, use small datasets (MNIST subset if needed), provide stop control |
| Tutorial implementation time | Low | Medium | Minimum 1 tutorial required, use simple step-by-step modals, add 2nd tutorial only if Week 3 finishes early |

---

## 11. Assumptions

1. **Team Skills:** All 5 team members have basic Python and JavaScript knowledge
2. **Team Availability:** Team can dedicate sufficient hours/week for 23 days (Nov 2-24) (exact commitment TBD)
3. **Users:** Have modern web browsers (Chrome, Firefox, Safari, Edge) with JavaScript enabled
4. **User Knowledge:** Absolute beginners in ML - app must teach from scratch (no prior neural network knowledge assumed)
5. **Hardware:** Local machines (laptops) can handle CPU-based neural network training for small datasets
6. **Datasets:** Pre-built datasets from scikit-learn/PyTorch are sufficient and cover diverse use cases
7. **Internet:** Available for initial setup, library installations, and LLM assistance during development
8. **Development Support:** Team has access to LLMs (Claude, GPT) for code assistance and debugging
9. **Scope Flexibility:** Some nice-to-have features (persistence, advanced visualizations) may be cut to meet deadline
10. **No Code Requirement:** Users prefer visual learning over reading/writing code (validates "no code viewing" design choice)
11. **Pre-configured Hyperparameters:** Users won't miss manual tuning since they're beginners
12. **CPU Training:** 5-minute training time on CPU is acceptable for educational use (users aren't in production)

---

## 12. Success Metrics & Evaluation Criteria

### Definition of Done (Technical):
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Core Features Working** | 100% of Must-Have features functional | Manual E2E testing checklist |
| **Code Quality** | 0 critical bugs blocking demo | Bug tracker count |
| **Performance** | Training completes in <5 min for all datasets | Benchmark tests on standard laptop |
| **Model Configuration Accuracy** | Dynamic model builds correctly from all valid JSON configurations | Automated unit tests |
| **UI Responsiveness** | User interactions feel responsive | Manual testing |
| **Test Coverage** | >50% coverage for backend critical paths | pytest coverage report |

### Definition of Done (User Experience):
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Time to First Model** | <15 min for user familiar with basic ML concepts | Internal team testing |
| **Error Recovery** | Clear error messages for common mistakes (invalid architecture, training failures) | Intentional error testing |
| **Visual Clarity** | All UI elements labeled, training progress visible | UX review |

### Definition of Done (Educational):
- **1-2 interactive tutorials** with tooltips for key concepts
- **Documentation** covers installation and basic usage

### Definition of Done (Project Management):
- **Delivered on time:** Nov 24, 2025 (hard deadline)
- **Demo-ready:** Can present end-to-end workflow in <10 minutes
- **Documented:** README, user guide, deployment instructions complete
- **Version controlled:** All code in GitHub with meaningful commits

---

## 13. Technical Architecture & Data Flow

### System Architecture:
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Dataset    │  │    Visual    │  │   Training   │       │
│  │   Selector   │→ │   Builder    │→ │  Dashboard   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         ↓                  ↓                  ↑             │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
       REST API          REST API         WebSocket (real-time)
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│         ↓                  ↓                  ↓             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Dataset    │  │   Dynamic    │  │   Training   │       │
│  │    API       │  │   Model.py   │  │    Engine    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                BACKEND (FastAPI + PyTorch)                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow (User Journey):
1. **GET /api/datasets** → User browses 5 datasets with descriptions
2. **POST /api/models** → User drags layers, frontend sends JSON architecture to backend
3. **Backend (invisible to user)** → Dynamic model.py receives JSON configuration and constructs PyTorch model
4. **POST /api/models/{model_id}/train** → Backend starts training, returns session_id
5. **GET /api/training/{session_id}/status** (polling) → Frontend polls for loss/accuracy/epoch updates
6. **POST /api/models/{model_id}/test** → User tests model, backend returns accuracy + metrics

**API Endpoints (REST):**
- `GET /api/datasets` - List all available datasets with metadata
- `GET /api/datasets/{id}` - Get detailed dataset info
- `GET /api/templates` - List pre-built model templates
- `POST /api/models` - Create model from layer configuration (JSON)
- `GET /api/models/{id}` - Get model details
- `POST /api/models/{id}/train` - Start training session
- `GET /api/training/{session_id}/status` - Poll training progress
- `POST /api/training/{session_id}/stop` - Stop training
- `POST /api/models/{id}/test` - Test trained model

**Key Point:** Model construction (step 3) happens entirely in backend using dynamic model.py. Users never see Python code.

### Key Technical Decisions:
(Full technology stack details in Section 8)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Drag-and-drop library | React Flow | Better React integration, customizable nodes |
| Real-time updates | Polling → WebSocket | Polling easier to implement, upgrade if time permits |
| Model architecture | Dynamic model.py | Parameterized PyTorch model from JSON, simpler than code generation |
| Testing strategy | pytest + Playwright | Backend correctness, E2E for critical workflows |

---

## 14. Decisions Made & Remaining Questions

### Critical Decisions (CONFIRMED):
1. **Team Composition:** (See Section 6 for full details)
   - 5 generalists: 2 Frontend, 2 Backend, 1 ML/Data + QA

2. **Technology Stack:** CONFIRMED (See Section 8 for full stack details)
   - React Flow for drag-and-drop
   - Recharts for visualization
   - FastAPI for backend
   - React Context API for state (simple start)
   - Polling for real-time updates (WebSocket if time permits)

3. **Scope:** (See Sections 3 & 8 for complete details)
   - 5 datasets with pre-configured hyperparameters
   - NO hyperparameter tuning or code viewing
   - Basic error messages (Must Have)

4. **Educational Content:** 1-2 interactive tutorials minimum

### Remaining Decisions (Needed by End of Week 1):
1. **Team Member Assignments:** Specific names/roles (TBD - see Section 6)
2. **Implementation Details:**
   - Polling interval vs WebSocket timing
   - Tutorial interaction style (modal vs inline)
   - E2E testing tool (Playwright vs Cypress)

### Deferred Decisions (Week 2-3):
- Color scheme and branding
- Specific tooltip wording
- Nice-to-have feature prioritization (see Sections 2 & 3)

---

## 15. Glossary & Key Concepts

### Technical Terms:
- **MLP (Multi-Layer Perceptron):** Feedforward neural network with input, hidden, and output layers
- **Epoch:** One complete pass through the training dataset
- **Loss Function:** Measures how far model predictions are from actual values
- **Activation Function:** Non-linear transformation applied to neuron outputs (e.g., ReLU, Sigmoid)
- **WebSocket:** Protocol for real-time, bidirectional client-server communication
- **Dynamic Model Configuration:** Converting visual diagram JSON to parameterized PyTorch model

### User-Facing Terms:
- **Layer:** A collection of neurons that process data together
- **Hidden Layer:** Intermediate processing layer between input and output
- **Training:** Process where model learns patterns from data
- **Testing/Validation:** Evaluating model performance on new, unseen data
- **Accuracy:** Percentage of correct predictions
- **Loss Curve:** Graph showing how model error decreases during training

---

## 16. Approval

**Project Sponsor:** _______________________

**Approval Date:** _______________________

**Signature:** _______________________

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 29, 2025 | Team | Initial charter created with 4-week timeline |
| 1.1 | Oct 29, 2025 | Team | Added vision statement, user persona, technical architecture, success metrics, open questions, glossary |
| 1.2 | Nov 1, 2025 | Team | Compliance update: Added User Stories, Domain Model, ISO 25010 NFRs, Test Plan structure, Validation Strategy |
| 1.3 | Nov 1, 2025 | Team | **Realism & Focus Update:** Moved intelligent error feedback to nice-to-have, reduced tutorials to 1-2 minimum, changed real-time to polling-first approach, reduced test coverage target to 50%, condensed overly detailed sections, added specific API endpoints and template architectures, adjusted NFR targets for 4-week MVP |
| 1.4 | Nov 1, 2025 | Team | **Timeline Update:** Adjusted project timeline from Oct 28 - Nov 24 to Nov 2 - Nov 24 (23 days). Updated all weekly breakdowns, milestones, constraints, risks, and assumptions to reflect new start date of Sunday Nov 2 |
| 1.5 | Nov 5, 2025 | Team | **Architecture Simplification:** Replaced code generation approach with dynamic model.py that accepts parameterized layers via JSON. Removed Jinja2 templates, simplified backend complexity. Updated all sections referencing code generation (objectives, requirements, tech stack, risks, metrics, architecture diagrams, glossary) |

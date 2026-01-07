#!/bin/bash
# =============================================================================
# API Contract Examples - cURL Commands
# =============================================================================
# This script contains example cURL commands for all API endpoints.
# Base URL: http://localhost:8000
#
# Usage:
#   - Run individual commands by copying them to your terminal
#   - Or source this file and call the functions
#   - Make sure the backend server is running first!
#
# Prerequisites:
#   - Backend server running: uvicorn backend.api.main:app --port 8000
#   - curl installed
#   - jq installed (optional, for pretty-printing JSON)
# =============================================================================

BASE_URL="http://localhost:8000"

echo "========================================"
echo "Neural Network Training Platform API"
echo "Example cURL Commands"
echo "========================================"

# =============================================================================
# HEALTH ENDPOINT
# =============================================================================

echo ""
echo "--- HEALTH CHECK ---"
echo ""

# Check API health
echo "GET /health - Check server health:"
curl -s "${BASE_URL}/health" | jq .

# =============================================================================
# DATASET ENDPOINTS
# =============================================================================

echo ""
echo "--- DATASET ENDPOINTS ---"
echo ""

# List all datasets
echo "GET /api/datasets - List all datasets:"
curl -s "${BASE_URL}/api/datasets" | jq .

# Get specific dataset details
echo ""
echo "GET /api/datasets/mnist - Get MNIST dataset details:"
curl -s "${BASE_URL}/api/datasets/mnist" | jq .

# Get dataset details - Iris
echo ""
echo "GET /api/datasets/iris - Get Iris dataset details:"
curl -s "${BASE_URL}/api/datasets/iris" | jq .

# Get dataset preview with default samples
echo ""
echo "GET /api/datasets/iris/preview - Preview Iris dataset (default 10 samples):"
curl -s "${BASE_URL}/api/datasets/iris/preview" | jq .

# Get dataset preview with custom sample count
echo ""
echo "GET /api/datasets/iris/preview?num_samples=5 - Preview Iris dataset (5 samples):"
curl -s "${BASE_URL}/api/datasets/iris/preview?num_samples=5" | jq .

# Example: Dataset not found (404)
echo ""
echo "GET /api/datasets/nonexistent - Dataset not found (404 error):"
curl -s "${BASE_URL}/api/datasets/nonexistent" | jq .

# =============================================================================
# TEMPLATE ENDPOINTS
# =============================================================================

echo ""
echo "--- TEMPLATE ENDPOINTS ---"
echo ""

# List all templates
echo "GET /api/templates - List all templates:"
curl -s "${BASE_URL}/api/templates" | jq .

# List templates filtered by dataset
echo ""
echo "GET /api/templates?dataset_id=mnist - List MNIST templates only:"
curl -s "${BASE_URL}/api/templates?dataset_id=mnist" | jq .

# Get specific template
echo ""
echo "GET /api/templates/mnist_simple - Get Simple MLP template:"
curl -s "${BASE_URL}/api/templates/mnist_simple" | jq .

# Get deep template
echo ""
echo "GET /api/templates/mnist_deep - Get Deep MLP template:"
curl -s "${BASE_URL}/api/templates/mnist_deep" | jq .

# Template not found (404)
echo ""
echo "GET /api/templates/nonexistent - Template not found (404 error):"
curl -s "${BASE_URL}/api/templates/nonexistent" | jq .

# =============================================================================
# TRAINING ENDPOINTS
# =============================================================================

echo ""
echo "--- TRAINING ENDPOINTS ---"
echo ""

# Start training with a new custom model
echo "POST /api/models/new/train - Start training with custom model:"
echo 'Request body:'
cat << 'EOF'
{
  "dataset_id": "iris",
  "layers": [
    {"type": "input", "neurons": 4, "activation": null, "position": 0},
    {"type": "hidden", "neurons": 16, "activation": "relu", "position": 1},
    {"type": "output", "neurons": 3, "activation": "softmax", "position": 2}
  ],
  "epochs": 5,
  "learning_rate": 0.01,
  "batch_size": 16,
  "optimizer": "adam",
  "max_samples": 100
}
EOF

echo ""
echo "cURL command:"
TRAIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/models/new/train" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "iris",
    "layers": [
      {"type": "input", "neurons": 4, "activation": null, "position": 0},
      {"type": "hidden", "neurons": 16, "activation": "relu", "position": 1},
      {"type": "output", "neurons": 3, "activation": "softmax", "position": 2}
    ],
    "epochs": 5,
    "learning_rate": 0.01,
    "batch_size": 16,
    "optimizer": "adam",
    "max_samples": 100
  }')

echo "${TRAIN_RESPONSE}" | jq .

# Extract session_id for subsequent requests
SESSION_ID=$(echo "${TRAIN_RESPONSE}" | jq -r '.session_id')
echo ""
echo "Session ID extracted: ${SESSION_ID}"

# Wait a moment for training to progress
echo ""
echo "Waiting 3 seconds for training to progress..."
sleep 3

# Get training status
echo ""
echo "GET /api/training/{session_id}/status - Get training status:"
curl -s "${BASE_URL}/api/training/${SESSION_ID}/status" | jq .

# Get training status with since_epoch filter
echo ""
echo "GET /api/training/{session_id}/status?since_epoch=2 - Get metrics since epoch 2:"
curl -s "${BASE_URL}/api/training/${SESSION_ID}/status?since_epoch=2" | jq .

# Pause training
echo ""
echo "POST /api/training/{session_id}/pause - Pause training:"
curl -s -X POST "${BASE_URL}/api/training/${SESSION_ID}/pause" | jq .

# Resume training
echo ""
echo "POST /api/training/{session_id}/resume - Resume training:"
curl -s -X POST "${BASE_URL}/api/training/${SESSION_ID}/resume" | jq .

# Wait for training to complete
echo ""
echo "Waiting 5 seconds for training to complete..."
sleep 5

# Check final status
echo ""
echo "GET /api/training/{session_id}/status - Final training status:"
curl -s "${BASE_URL}/api/training/${SESSION_ID}/status" | jq .

# Run prediction (after training completes)
echo ""
echo "POST /api/training/{session_id}/predict - Run prediction:"
echo 'Request body (Iris features: sepal length, sepal width, petal length, petal width):'
cat << 'EOF'
{
  "inputs": [5.1, 3.5, 1.4, 0.2]
}
EOF

echo ""
curl -s -X POST "${BASE_URL}/api/training/${SESSION_ID}/predict" \
  -H "Content-Type: application/json" \
  -d '{"inputs": [5.1, 3.5, 1.4, 0.2]}' | jq .

# =============================================================================
# TRAINING WITH EXISTING TEMPLATE
# =============================================================================

echo ""
echo "--- TRAINING WITH EXISTING TEMPLATE ---"
echo ""

# Start training using an existing template (mnist_simple)
echo "POST /api/models/mnist_simple/train - Train using Simple MLP template:"
TEMPLATE_TRAIN=$(curl -s -X POST "${BASE_URL}/api/models/mnist_simple/train" \
  -H "Content-Type: application/json" \
  -d '{
    "epochs": 3,
    "max_samples": 500
  }')

echo "${TEMPLATE_TRAIN}" | jq .

TEMPLATE_SESSION_ID=$(echo "${TEMPLATE_TRAIN}" | jq -r '.session_id')
echo ""
echo "Template Session ID: ${TEMPLATE_SESSION_ID}"

# Stop the training session
echo ""
echo "POST /api/training/{session_id}/stop - Stop training:"
curl -s -X POST "${BASE_URL}/api/training/${TEMPLATE_SESSION_ID}/stop" | jq .

# =============================================================================
# ERROR EXAMPLES
# =============================================================================

echo ""
echo "--- ERROR EXAMPLES ---"
echo ""

# 400 Bad Request - Missing required fields for new model
echo "POST /api/models/new/train - Missing required fields (400 error):"
curl -s -X POST "${BASE_URL}/api/models/new/train" \
  -H "Content-Type: application/json" \
  -d '{"epochs": 5}' | jq .

# 404 Not Found - Invalid model
echo ""
echo "POST /api/models/nonexistent/train - Model not found (404 error):"
curl -s -X POST "${BASE_URL}/api/models/nonexistent/train" \
  -H "Content-Type: application/json" \
  -d '{"epochs": 5}' | jq .

# 404 Not Found - Invalid session
echo ""
echo "GET /api/training/invalid-session/status - Session not found (404 error):"
curl -s "${BASE_URL}/api/training/invalid-session/status" | jq .

# 422 Unprocessable Entity - Invalid layer configuration
echo ""
echo "POST /api/models/new/train - Invalid layers (422 error):"
curl -s -X POST "${BASE_URL}/api/models/new/train" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "iris",
    "layers": [
      {"type": "input", "neurons": 4}
    ]
  }' | jq .

# =============================================================================
# HELPER FUNCTIONS (for sourcing this script)
# =============================================================================

# Function to list all datasets
list_datasets() {
  curl -s "${BASE_URL}/api/datasets" | jq .
}

# Function to get dataset details
get_dataset() {
  local dataset_id=$1
  curl -s "${BASE_URL}/api/datasets/${dataset_id}" | jq .
}

# Function to preview dataset
preview_dataset() {
  local dataset_id=$1
  local num_samples=${2:-10}
  curl -s "${BASE_URL}/api/datasets/${dataset_id}/preview?num_samples=${num_samples}" | jq .
}

# Function to list templates
list_templates() {
  local dataset_id=$1
  if [ -n "${dataset_id}" ]; then
    curl -s "${BASE_URL}/api/templates?dataset_id=${dataset_id}" | jq .
  else
    curl -s "${BASE_URL}/api/templates" | jq .
  fi
}

# Function to start training
start_training() {
  local model_id=$1
  local payload=$2
  curl -s -X POST "${BASE_URL}/api/models/${model_id}/train" \
    -H "Content-Type: application/json" \
    -d "${payload}" | jq .
}

# Function to get training status
get_training_status() {
  local session_id=$1
  local since_epoch=${2:-0}
  curl -s "${BASE_URL}/api/training/${session_id}/status?since_epoch=${since_epoch}" | jq .
}

# Function to stop training
stop_training() {
  local session_id=$1
  curl -s -X POST "${BASE_URL}/api/training/${session_id}/stop" | jq .
}

# Function to pause training
pause_training() {
  local session_id=$1
  curl -s -X POST "${BASE_URL}/api/training/${session_id}/pause" | jq .
}

# Function to resume training
resume_training() {
  local session_id=$1
  curl -s -X POST "${BASE_URL}/api/training/${session_id}/resume" | jq .
}

# Function to run prediction
predict() {
  local session_id=$1
  local inputs=$2
  curl -s -X POST "${BASE_URL}/api/training/${session_id}/predict" \
    -H "Content-Type: application/json" \
    -d "{\"inputs\": ${inputs}}" | jq .
}

echo ""
echo "========================================"
echo "All API examples completed!"
echo "========================================"
echo ""
echo "To use helper functions, source this script:"
echo "  source api_contract_examples.sh"
echo ""
echo "Then call functions like:"
echo "  list_datasets"
echo "  get_dataset mnist"
echo "  preview_dataset iris 5"
echo "  list_templates mnist"
echo "  get_training_status <session_id>"
echo "========================================"

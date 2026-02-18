# Neural Network Playground - User Manual

**Version:** 1.0
**Date:** November 29, 2025

## 1. Introduction
Welcome to the **Neural Network Playground**! This application is designed to help you learn about neural networks by visually building, training, and testing models without writing a single line of code. Whether you are a student or an ML enthusiast, this tool allows you to experiment with different architectures and datasets in an interactive environment.

## 2. Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge).
- Access to the application URL (e.g., `http://localhost:5173` if running locally).

### Launching the App
1. Open your web browser.
2. Navigate to the application URL.
3. You will be greeted by the **Home/Dashboard** screen.

## 3. Using the Application

The typical workflow consists of three main steps: **Select Dataset** -> **Build Model** -> **Train & Evaluate**.

### Step 1: Select a Dataset
On the main dashboard or the "Datasets" page, you can browse available datasets.
- **Available Datasets**:
  - **MNIST**: Handwritten digit recognition (Images).
  - **Iris**: Flower classification (Tabular data).
  - **California Housing**: Predicting housing prices (Regression).
  - **Wine Quality**: Assessing wine quality (Classification).
  - **Synthetic**: Simple patterns like spirals or XOR for testing.
- Click on a dataset card to view details or start a project with it.

### Step 2: Build Your Model
The **Model Builder** is the core of the application. Here you design the architecture of your neural network.

#### The Interface
- **Layer Palette (Left)**: Contains available building blocks.
  - **Linear**: Basic fully connected layer.
  - **ReLU**: Activation function to introduce non-linearity.
  - **Conv2d**: Convolutional layer for image processing.
  - **MaxPool2d**: Downsampling layer.
  - **Flatten**: Converts 2D/3D data to 1D (useful before Linear layers).
  - **Dropout**: Regularization to prevent overfitting.
- **Canvas (Center)**: The workspace where you assemble your model.
- **Config Panel (Right)**: Allows you to adjust settings for the selected layer.

#### How to Build
1. **Add Layers**: Drag a layer from the **Layer Palette** and drop it onto the **Canvas**.
2. **Connect Layers**: Click and drag from the handle (dot) of one node to the handle of another to create a connection. Data flows from left to right (or top to bottom depending on layout).
3. **Configure Layers**: Click on a node in the canvas. The **Config Panel** will show available settings (e.g., number of neurons for a Linear layer, kernel size for Conv2d).
4. **Use Templates**: If you're unsure where to start, click the **"Load Template"** button to choose a pre-built architecture (e.g., "Simple MLP").

### Step 3: Train Your Model
Once your architecture is ready:
1. Click the **"Create Model"** or **"Train"** button.
2. You will be navigated to the **Training Dashboard**.
3. **Monitor Progress**: Watch real-time graphs for **Loss** (error rate) and **Accuracy**.
   - **Loss** should decrease over time.
   - **Accuracy** should increase.
4. **Controls**: You can **Stop** the training at any time if the model has converged or if you want to make changes.

## 4. Tips for Beginners
- **Start Simple**: Begin with the **Iris** or **Synthetic** datasets and a simple model (Linear -> ReLU -> Linear).
- **Check Dimensions**: Ensure the output of one layer matches the input of the next. For example, if using MNIST (images), you might need to **Flatten** the data before passing it to a **Linear** layer.
- **Experiment**: Try adding more layers or changing activation functions to see how it affects performance.

## 5. Troubleshooting

| Issue | Possible Cause | Solution |
| :--- | :--- | :--- |
| **Training doesn't start** | Backend server might be down. | Ensure the backend API is running (`http://localhost:8000`). |
| **Model accuracy is low** | Model might be too simple or learning rate too high/low. | Try adding more layers or using a Template. |
| **"Shape Mismatch" error** | Layer inputs/outputs don't match. | Check your **Flatten** layers and **Linear** input/output sizes. |
| **Canvas is blank** | Browser rendering issue. | Refresh the page. |

## 6. Support
If you encounter bugs or need help, please reach out to the development team via the project repository.

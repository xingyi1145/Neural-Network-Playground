"""
Dataset API endpoints.

Provides:
- GET /api/datasets - List all datasets with metadata
- GET /api/datasets/{id} - Get dataset details
- GET /api/datasets/{id}/preview - Sample data preview

Assumes teammate has created:
- backend.datasets.registry (get_dataset, list_datasets)
- backend.datasets.base (BaseDataset)
- Pydantic models for responses (DatasetMetadata, DatasetPreview)
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List

# Import teammate's dataset infrastructure
from backend.datasets import get_dataset, list_datasets

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("", response_model=List[dict])
def list_all_datasets():
    """
    List all available datasets with metadata.
    
    Returns:
        List of dataset metadata objects
    """
    dataset_ids = list_datasets()
    datasets_metadata = []
    
    for dataset_id in dataset_ids:
        try:
            dataset = get_dataset(dataset_id)
            
            # Build metadata from teammate's BaseDataset
            metadata = {
                "id": dataset_id,
                "name": dataset.name,
                "task_type": dataset.task_type,
                "description": dataset.description,
                "num_samples": dataset.num_samples,
                "num_features": dataset.num_features,
                "num_classes": dataset.num_classes,
                "output_shape": dataset.num_classes,  # Alias for frontend compatibility
                "hyperparameters": {
                    "learning_rate": dataset.hyperparameters.learning_rate,
                    "batch_size": dataset.hyperparameters.batch_size,
                    "epochs": dataset.hyperparameters.epochs,
                    "optimizer": dataset.hyperparameters.optimizer,
                }
            }
            datasets_metadata.append(metadata)
            
        except Exception as e:
            # Skip datasets that fail to load
            continue
    
    return datasets_metadata


@router.get("/{dataset_id}", response_model=dict)
def get_dataset_details(dataset_id: str):
    """
    Get detailed information about a specific dataset.
    
    Args:
        dataset_id: Unique dataset identifier
        
    Returns:
        Dataset metadata including hyperparameters and dimensions
    """
    try:
        dataset = get_dataset(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")
    
    # Build detailed metadata
    metadata = {
        "id": dataset_id,
        "name": dataset.name,
        "task_type": dataset.task_type,
        "description": dataset.description,
        "num_samples": dataset.num_samples,
        "num_features": dataset.num_features,
        "num_classes": dataset.num_classes,
        "hyperparameters": {
            "learning_rate": dataset.hyperparameters.learning_rate,
            "batch_size": dataset.hyperparameters.batch_size,
            "epochs": dataset.hyperparameters.epochs,
            "optimizer": dataset.hyperparameters.optimizer,
        },
        "input_shape": dataset.num_features,
        "output_shape": dataset.num_classes
    }
    
    return metadata


@router.get("/{dataset_id}/preview", response_model=dict)
def get_dataset_preview(
    dataset_id: str,
    num_samples: int = Query(default=10, ge=1, le=100, description="Number of samples to preview")
):
    """
    Get preview samples from a dataset.
    
    Args:
        dataset_id: Unique dataset identifier
        num_samples: Number of samples to return (1-100)
        
    Returns:
        DatasetPreview with features, labels, and sample count
    """
    try:
        # Load a reasonable amount of data (don't limit with max_samples in constructor)
        # to avoid issues with train/test split
        dataset = get_dataset(dataset_id, max_samples=min(500, num_samples * 10))
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")
    
    try:
        # Load data using teammate's method
        X_train, y_train, X_test, y_test = dataset.load(test_size=0.2)
        
        # Take first num_samples from training set
        actual_samples = min(num_samples, len(X_train))
        features = X_train[:actual_samples].tolist()
        labels = y_train[:actual_samples].tolist()
        
        preview = {
            "features": features,
            "labels": labels,
            "num_samples_shown": len(features)
        }
        
        return preview
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load dataset preview: {str(e)}"
        )

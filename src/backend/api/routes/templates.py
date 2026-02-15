"""
Template API endpoints.

Provides:
- GET /api/templates - List all templates (optionally filter by dataset)
- GET /api/templates/{id} - Get template details

Uses templates defined in backend.api.templates module.
"""
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

# Import template data
from backend.api import templates

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=List[dict])
def list_templates(
    dataset_id: Optional[str] = Query(None, description="Filter by dataset ID")
):
    """
    List all available neural network templates.

    Args:
        dataset_id: Optional filter to show only templates for a specific dataset

    Returns:
        List of template configurations
    """
    if dataset_id:
        # Filter templates by dataset
        filtered_templates = templates.filter_templates_by_dataset(dataset_id)
        return filtered_templates
    else:
        # Return all templates
        return templates.list_all_templates()


@router.get("/{template_id}", response_model=dict)
def get_template_details(template_id: str):
    """
    Get detailed configuration for a specific template.

    Args:
        template_id: Unique template identifier

    Returns:
        Template configuration including layers and hyperparameters
    """
    template = templates.get_template_by_id(template_id)

    if template is None:
        raise HTTPException(
            status_code=404, detail=f"Template '{template_id}' not found"
        )

    return template

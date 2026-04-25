from typing import List, Optional
from pydantic import BaseModel, Field

class Node(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    type: str = Field(..., description="Hub type: Port, Rail Terminal, Loading Dock")

class Edge(BaseModel):
    source: str
    target: str
    mode: str = Field(..., description="road, rail, or sea")
    distance_km: float
    co2_per_kg_km: float
    elevation_gain_m: float
    fuel_type: str
    speed_kmh: float

class RoutingRequest(BaseModel):
    start_node: str
    end_node: str
    cargo_weight_kg: float
    priority: float = Field(0.5, description="0.0: Speed, 1.0: Carbon Minimal")

class RouteStep(BaseModel):
    mode: str
    from_node: str
    to_node: str
    distance: float
    co2_emissions: float
    duration_hrs: float

class RoutingResponse(BaseModel):
    total_distance: float
    total_co2: float
    total_duration: float
    green_score: float
    steps: List[RouteStep]
    path_nodes: List[Node]

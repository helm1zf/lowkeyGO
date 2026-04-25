from fastapi import FastAPI, HTTPException
from .schemas import RoutingRequest, RoutingResponse
from .database import db

app = FastAPI(title="EcoRoute API")

@app.post("/route", response_model=RoutingResponse)
async def get_green_route(request: RoutingRequest):
    try:
        # 1. Update edge weights dynamically
        db.update_green_scores(request.cargo_weight_kg, request.priority)
        
        # 2. Run GDS Dijkstra
        # In a real app, we'd map IDs properly
        result = db.run_gds_dijkstra(request.start_node, request.end_node, "greenScore")
        
        if not result:
            raise HTTPException(status_code=404, detail="No path found")
            
        # 3. Transform and return (Simplified for structure demonstration)
        return {
            "total_distance": result["totalCost"],
            "total_co2": 0.0, # Calculate based on steps
            "total_duration": 0.0,
            "green_score": result["totalCost"],
            "steps": [],
            "path_nodes": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

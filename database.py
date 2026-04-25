import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

class Neo4jHandler:
    def __init__(self):
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def run_gds_dijkstra(self, start_id, end_id, weight_property):
        """
        Executes Dijkstra using GDS library.
        Assumes a projection named 'logisticGraph' exists.
        """
        with self.driver.session() as session:
            query = """
            CALL gds.shortestPath.dijkstra.stream('logisticGraph', {
                sourceNode: $start_id,
                targetNode: $end_id,
                relationshipWeightProperty: $weight_property
            })
            YIELD index, sourceNode, targetNode, totalCost, nodeIds, costs, path
            RETURN
                index,
                gds.util.asNode(sourceNode).name AS sourceNodeName,
                gds.util.asNode(targetNode).name AS targetNodeName,
                totalCost,
                [nodeId IN nodeIds | gds.util.asNode(nodeId).name] AS nodeNames,
                costs
            ORDER BY index
            """
            result = session.run(query, start_id=start_id, end_id=end_id, weight_property=weight_property)
            return result.single()

    def update_green_scores(self, cargo_weight: float, priority: float):
        """
        Dynanmically updates GreenScore based on Cargo Weight and Priority.
        """
        with self.driver.session() as session:
            query = """
            MATCH ()-[r:TRANSPORTS]->()
            SET r.greenScore = (r.distance_km * r.co2_per_kg_km * $weight * $priority) + 
                               ((r.distance_km / r.speed_kmh) * (1 - $priority))
            """
            session.run(query, weight=cargo_weight, priority=priority)

db = Neo4jHandler()

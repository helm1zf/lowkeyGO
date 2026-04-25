import streamlit as st
import pydeck as pdk
import requests
import pandas as pd

st.set_page_config(layout="wide", page_title="EcoRoute Dashboard")

st.title("🌱 EcoRoute: Green Logistics Dashboard")

with st.sidebar:
    st.header("Shipment Parameters")
    cargo_weight = st.number_input("Cargo Weight (kg)", min_value=1, value=5000)
    priority = st.slider("Priority (Speed vs Carbon)", 0.0, 1.0, 0.5, help="0.0 = Fastest, 1.0 = Cleanest")
    
    start_city = st.selectbox("Origin", ["Hamburg", "Berlin", "Munich", "Cologne"])
    end_city = st.selectbox("Destination", ["Munich", "Frankfurt", "Stuttgart", "Hamburg"])
    
    if st.button("Optimize Route"):
        # Call FastAPI
        # res = requests.post("http://localhost:8000/route", json={...})
        pass

# Mock Data for Visualization
nodes = pd.DataFrame([
    {"name": "Hamburg", "lat": 53.5511, "lon": 9.9937, "type": "Sea Port"},
    {"name": "Berlin", "lat": 52.5200, "lon": 13.4050, "type": "Rail Hub"},
    {"name": "Munich", "lat": 48.1351, "lon": 11.5820, "type": "Logistics Center"},
])

path_data = pd.DataFrame([
    {"start": [9.9937, 53.5511], "end": [13.4050, 52.5200], "mode": "Rail"},
    {"start": [13.4050, 52.5200], "end": [11.5820, 48.1351], "mode": "Road"}
])

# PyDeck Visualization
layer_nodes = pdk.Layer(
    "ScatterplotLayer",
    nodes,
    get_position="[lon, lat]",
    get_color="[200, 30, 0, 160]",
    get_radius=20000,
)

layer_paths = pdk.Layer(
    "ArcLayer",
    path_data,
    get_source_position="start",
    get_target_position="end",
    get_width=5,
    get_tilt=15,
)

view_state = pdk.ViewState(latitude=51.1657, longitude=10.4515, zoom=5, pitch=45)

st.pydeck_chart(pdk.Deck(layers=[layer_nodes, layer_paths], initial_view_state=view_state))

st.info("This dashboard uses Neo4j GDS to calculate the optimal multi-modal path based on real-time CO2 factors.")

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  TrainFront, 
  Ship, 
  Leaf, 
  Clock, 
  Scale, 
  Map as MapIcon, 
  Activity, 
  ChevronRight,
  Info,
  Maximize2
} from 'lucide-react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

// --- Types ---
interface Hub {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
}

interface Step {
  mode: 'road' | 'rail' | 'sea';
  from: string;
  to: string;
  distance: number;
  co2: number;
  duration: number;
}

interface Metrics {
  totalDistance: number;
  totalCO2: number;
  totalDuration: number;
}

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN; 

export default function App() {
  const [cargoWeight, setCargoWeight] = useState(5000);
  const [priority, setPriority] = useState(0.5); // 0: Speed, 1: Carbon
  const [routeData, setRouteData] = useState<{ hubs: Hub[], path: Step[], metrics: Metrics } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewState, setViewState] = useState({
    latitude: 51.1657,
    longitude: 10.4515,
    zoom: 5.5,
    pitch: 45,
    bearing: 0
  });

  const fetchRoute = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNode: 'hbg', endNode: 'muc', weight: cargoWeight, priority })
      });
      const data = await res.json();
      setRouteData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!routeData) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargoWeight,
          priority,
          pathNodes: routeData.path.map(s => `${s.mode} from ${s.from} to ${s.to}`).join(', '),
          totalCO2: routeData.metrics.totalCO2
        })
      });
      const data = await res.json();
      setAnalysis(data.analysis || data.error || "Analysis complete.");
    } catch (err) {
      console.error(err);
      setAnalysis("Unable to analyze at this time.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchRoute, 300);
    return () => clearTimeout(timer);
  }, [cargoWeight, priority]);

  // --- Map Layers ---
  const layers = useMemo(() => {
    if (!routeData) return [];

    const hubsLayer = new ScatterplotLayer({
      id: 'hubs-layer',
      data: routeData.hubs,
      getPosition: (d: Hub) => [d.lon, d.lat],
      getFillColor: [16, 185, 129, 200],
      getRadius: 15000,
      pickable: true,
    });

    const arcsLayer = new ArcLayer({
      id: 'path-layer',
      data: routeData.path.map(step => {
        const fromHub = routeData.hubs.find(h => h.id === step.from);
        const toHub = routeData.hubs.find(h => h.id === step.to);
        return {
          source: [fromHub?.lon || 0, fromHub?.lat || 0],
          target: [toHub?.lon || 0, toHub?.lat || 0],
          mode: step.mode
        };
      }),
      getSourcePosition: (d: any) => d.source,
      getTargetPosition: (d: any) => d.target,
      getSourceColor: (d: any) => d.mode === 'sea' ? [0, 100, 255] : d.mode === 'rail' ? [255, 150, 0] : [200, 200, 200],
      getTargetColor: (d: any) => d.mode === 'sea' ? [0, 200, 255] : d.mode === 'rail' ? [255, 200, 0] : [255, 255, 255],
      getWidth: 4
    });

    return [hubsLayer, arcsLayer];
  }, [routeData]);

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] font-sans text-[#E5E5E5]">
      {/* Sidebar - Controls */}
      <aside className="z-10 w-96 flex-shrink-0 border-r border-[#262626] bg-[#141414] p-6 shadow-2xl flex flex-col gap-8 custom-scrollbar overflow-y-auto">
        <header className="flex items-center gap-3">
          <div className="rounded-lg bg-[#10B981]/20 p-2 text-[#10B981]">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tighter">lowkeyGO</h1>
            <p className="text-xs font-mono text-white/40">SUPPLY CHAIN OPTIMIZER</p>
          </div>
        </header>

        <section className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/60 uppercase tracking-widest flex items-center gap-2">
                <Truck size={14} /> Cargo Weight
              </label>
              <span className="font-mono text-[#10B981]">{cargoWeight.toLocaleString()} kg</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="100000" 
              step="100"
              value={cargoWeight} 
              onChange={(e) => setCargoWeight(Number(e.target.value))}
              className="w-full accent-[#10B981] h-1 bg-[#262626] rounded-full appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/60 uppercase tracking-widest flex items-center gap-2">
                <Scale size={14} /> Priority Logic
              </label>
              <span className="font-mono text-[#10B981]">
                {priority < 0.3 ? 'Speed' : priority > 0.7 ? 'Carbon' : 'Balanced'}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01"
              value={priority} 
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full accent-[#10B981] h-1 bg-[#262626] rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-white/20">
              <span>0.0 FASTEST</span>
              <span>1.0 GREENEST</span>
            </div>
          </div>
        </section>

        <div className="h-px bg-white/5" />

        {/* AI Insight */}
        <section className="space-y-3">
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 py-3 text-[#10B981] font-semibold text-xs tracking-widest uppercase hover:bg-[#10B981]/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isAnalyzing ? <Activity size={14} className="animate-pulse" /> : <Activity size={14} />}
            {isAnalyzing ? 'Processing...' : 'Generate Operations Report'}
          </button>
          
          <AnimatePresence>
            {analysis && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden rounded-xl bg-white/[0.03] p-4 border border-white/5"
              >
                <div className="flex gap-2 text-white/40 mb-2">
                  <Info size={12}/>
                  <span className="text-[10px] font-mono uppercase">System Audit Analysis</span>
                </div>
                <p className="text-xs leading-relaxed text-white/80 italic">"{analysis}"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="h-px bg-white/5" />

        {/* Path Breakdown */}
        <section className="flex-1 space-y-4">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Optimized Sequence</h2>
          <div className="space-y-3">
            {routeData?.path.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05]"
              >
                <div className={`mt-1 rounded-lg p-2 ${
                  step.mode === 'sea' ? 'bg-blue-500/20 text-blue-400' : 
                  step.mode === 'rail' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {step.mode === 'sea' ? <Ship size={18} /> : step.mode === 'rail' ? <TrainFront size={18} /> : <Truck size={18} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-white/80">{step.from.toUpperCase()} → {step.to.toUpperCase()}</span>
                    <span className="text-[10px] font-mono text-white/30">{step.distance} KM</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] font-medium text-white/40 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Leaf size={10} className="text-[#10B981]"/> {step.co2.toFixed(1)}kg CO2</span>
                    <span className="flex items-center gap-1"><Clock size={10}/> {step.duration.toFixed(1)}h</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Analytics Summary */}
        <section className="rounded-2xl bg-black/40 p-5 space-y-4 border border-white/5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase">Est. Carbon</span>
              <p className="text-2xl font-semibold text-[#10B981]">{routeData?.metrics.totalCO2.toFixed(0)} <span className="text-xs font-normal opacity-50">kg</span></p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase">Duration</span>
              <p className="text-2xl font-semibold">{routeData?.metrics.totalDuration.toFixed(1)} <span className="text-xs font-normal opacity-50">hrs</span></p>
            </div>
          </div>
          <div className="h-[80px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeData?.path || []}>
                <Bar dataKey="co2">
                  {(routeData?.path || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.mode === 'sea' ? '#3B82F6' : entry.mode === 'rail' ? '#F97316' : '#6B7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </aside>

      {/* Main View - Map */}
      <main className="relative flex-1 overflow-hidden">
        <DeckGL
          initialViewState={viewState}
          controller={true}
          layers={layers}
          onViewStateChange={(v) => setViewState(v.viewState)}
        >
          <Map
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          />
        </DeckGL>

        {/* Map Overlays */}
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-[#141414]/80 backdrop-blur-md p-4 shadow-2xl flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-[10px] font-mono text-white/60">RAILWAY</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-mono text-white/60">MARITIME</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#10B981]" />
                <span className="text-[10px] font-mono text-white/60">GDS HUB</span>
             </div>
          </div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#141414]/90 backdrop-blur-xl px-12 py-4 shadow-2xl flex items-center gap-12"
        >
          <div className="text-center">
            <p className="text-[10px] font-mono text-white/40 uppercase mb-1">Source Cluster</p>
            <p className="text-sm font-semibold tracking-wide">HAMBURG (HBG)</p>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-[#10B981]">
            <ChevronRight size={16} />
            <span className="text-[10px] font-mono tracking-widest uppercase">Multi-Modal Path Active</span>
            <ChevronRight size={16} />
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] font-mono text-white/40 uppercase mb-1">Target Terminal</p>
            <p className="text-sm font-semibold tracking-wide">MUNICH (MUC)</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

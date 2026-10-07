"use client";

import React, { useState } from "react";
import { Sparkles, Shirt, Camera, Users, Video, ArrowRight, CheckCircle2, Sliders, Zap } from "lucide-react";

interface UseCaseCategory {
  id: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  stats: { label: string; value: string }[];
  presets: {
    id: string;
    label: string;
    prompt: string;
    material: string;
    lighting: string;
    metrics: string;
    bgGradient: string;
  }[];
}

const USE_CASES_DATA: UseCaseCategory[] = [
  {
    id: "vto",
    badge: "01 / VIRTUAL TRY-ON",
    title: "Garment Physics & Drape Neural Engine",
    tagline: "Instant 3D garment simulation with cloth tension, seam integrity, and real motion flow.",
    description: "Map 2D designer sketches or 3D garments onto diverse body types in real-time. VTOL FIT preserves micro-textures like silk sheen, denim weave, and leather creasing under dynamic light.",
    icon: Shirt,
    stats: [
      { label: "Fit Accuracy", value: "99.4%" },
      { label: "Render Time", value: "< 1.2s" },
      { label: "Cloth Physics", value: "60 FPS" },
    ],
    presets: [
      {
        id: "preset-1",
        label: "Neon Lime Faux-Fur Coat",
        prompt: "Fluorescent neon lime fur coat with oversized silhouette, high collar, macro fiber details",
        material: "Faux-Fur Fiber (Heavy Weight)",
        lighting: "Studio High-Contrast Daylight",
        metrics: "Subsurface Scattering: Active",
        bgGradient: "linear-gradient(135deg, #102919 0%, #08140c 100%)",
      },
      {
        id: "preset-2",
        label: "Metallic Cyberpunk Puffer",
        prompt: "Chrome liquid metallic puffer jacket, geometric quilting, reflective surface under neon rain",
        material: "Specular Anisotropic Chrome",
        lighting: "Night Rain Neon Cyberpunk",
        metrics: "Reflectivity: 98.2%",
        bgGradient: "linear-gradient(135deg, #1b162c 0%, #0a0814 100%)",
      },
      {
        id: "preset-3",
        label: "Draped Silk Evening Dress",
        prompt: "Emerald green bias-cut silk slip dress with fluid motion, subtle gloss and fluid drape",
        material: "100% Pure Mulberry Silk",
        lighting: "Soft Ambient Golden Hour",
        metrics: "Fluidity Dynamics: Enabled",
        bgGradient: "linear-gradient(135deg, #0d221e 0%, #06110e 100%)",
      },
    ],
  },
  {
    id: "scene",
    badge: "02 / SCENE & LIGHTING SYNTHESIS",
    title: "Photorealistic Studio & Open-World Sets",
    tagline: "Generate production environments from brutalist concrete studios to sun-drenched alpine peaks.",
    description: "Eliminate expensive location shoots. Relight garments instantaneously with ray-traced global illumination, depth fog, and custom lens characteristics.",
    icon: Camera,
    stats: [
      { label: "Lighting Modes", value: "Unlimited" },
      { label: "Environment Resolution", value: "8K HDRI" },
      { label: "Ray-Tracing", value: "Real-Time" },
    ],
    presets: [
      {
        id: "preset-scene-1",
        label: "Minimalist Concrete Runway",
        prompt: "Architectural concrete monolith runway, soft volumetric light shafts, neutral gray background",
        material: "Brutalist Matte Concrete",
        lighting: "Overcast Volumetric Diffuse",
        metrics: "Soft Shadows: Enabled",
        bgGradient: "linear-gradient(135deg, #1a1e24 0%, #0d0f12 100%)",
      },
      {
        id: "preset-scene-2",
        label: "Sunlit Desert Dune",
        prompt: "Golden hour sand dunes, harsh low-angle sun, warm rim light, optical heat haze",
        material: "Fine Desert Quartz Sand",
        lighting: "Low Sun Warm Rim Light",
        metrics: "Lens Flare: Cinematic",
        bgGradient: "linear-gradient(135deg, #2b1f14 0%, #140e08 100%)",
      },
    ],
  },
  {
    id: "cast",
    badge: "03 / MODEL & CAST CASTING",
    title: "Diverse Digital Avatar & Pose Matrix",
    tagline: "Custom model generation across all ethnicities, body shapes, and dynamic runway postures.",
    description: "Maintain complete control over facial features, hair motion, skin micro-details, and cat-walk posture. Easily re-pose garments across multiple digital models simultaneously.",
    icon: Users,
    stats: [
      { label: "Pose Variations", value: "10,000+" },
      { label: "Skin Realism", value: "Subsurface" },
      { label: "Ethnicity Range", value: "Global" },
    ],
    presets: [
      {
        id: "preset-cast-1",
        label: "Avant-Garde Catwalk Pose",
        prompt: "Editorial high-fashion pose, strong stance, sharp gaze, mid-stride turn animation",
        material: "Natural Human Skin (Subsurface)",
        lighting: "Key Studio Flash & Fill",
        metrics: "Motion Blur: 1/500s",
        bgGradient: "linear-gradient(135deg, #211528 0%, #0f0a12 100%)",
      },
      {
        id: "preset-cast-2",
        label: "Casual Street Style Walk",
        prompt: "Natural street walking pose, relaxed posture, dynamic coat swing, candid camera angle",
        material: "Natural Ambient Skin",
        lighting: "Urban Daylight Shadows",
        metrics: "Pacing: 1.2 m/s",
        bgGradient: "linear-gradient(135deg, #14222b 0%, #081116 100%)",
      },
    ],
  },
  {
    id: "campaign",
    badge: "04 / E-COMMERCE CAMPAIGN PIPELINE",
    title: "Automated 4K Video Ad Generation",
    tagline: "Turn single outfit images into 360-degree video commercials for TikTok, Instagram & Web.",
    description: "Streamline luxury marketing. Generate multi-angle motion clips, dynamic zoom-ins, and high-converting fashion ads in under 60 seconds with full prompt control.",
    icon: Video,
    stats: [
      { label: "Video Speed", value: "30x Faster" },
      { label: "Max Resolution", value: "4K 60FPS" },
      { label: "Export Formats", value: "MP4 / WebM" },
    ],
    presets: [
      {
        id: "preset-camp-1",
        label: "360 Spin Commercial",
        prompt: "Continuous 360-degree orbital camera turn showcasing jacket texture, slow-motion detail zoom",
        material: "All Textiles Synced",
        lighting: "3-Point Studio Lighting",
        metrics: "Camera Orbit: 360 Smooth",
        bgGradient: "linear-gradient(135deg, #1e2817 0%, #0c1209 100%)",
      },
      {
        id: "preset-camp-2",
        label: "Macro Texture Close-Up",
        prompt: "Ultra-close macro lens pan across zipper detail, stitching precision, and fabric weave",
        material: "Macro Micro-Fiber Focus",
        lighting: "Directional Rim Highlight",
        metrics: "Macro Focus: 100mm Lens",
        bgGradient: "linear-gradient(135deg, #291a1a 0%, #140c0c 100%)",
      },
    ],
  },
];

export const UseCasesSection: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<string>("vto");
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [activeLighting, setActiveLighting] = useState<string>("Studio High-Contrast");
  const [copied, setCopied] = useState<boolean>(false);

  const activeCategory = USE_CASES_DATA.find((item) => item.id === activeTabId) || USE_CASES_DATA[0];
  const activePreset = activeCategory.presets[activePresetIndex] || activeCategory.presets[0];

  const handleTabChange = (id: string) => {
    setActiveTabId(id);
    setActivePresetIndex(0);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(activePreset.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="use-cases" className="use-cases-section">
      <div className="use-cases-container">
        {/* Section Header */}
        <div className="use-cases-header">
          <div className="badge-chip">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open-World Fashion Intelligence</span>
          </div>
          <h2 className="use-cases-title">
            Engineered for High-Fashion Creation
          </h2>
          <p className="use-cases-subtitle">
            Explore how VTOL FIT turns creative vision into production-grade video, 
            garment drape simulations, and photorealistic virtual try-on sets.
          </p>
        </div>

        {/* Interactive Tab Selector */}
        <div className="tab-navigation">
          {USE_CASES_DATA.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.id === activeTabId;
            return (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                className={`tab-button ${isActive ? "active" : ""}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-300" : "text-zinc-400"}`} />
                <span>{cat.title.split(" ")[0]} {cat.title.split(" ")[1]}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Workspace Showcase */}
        <div className="showcase-grid">
          {/* Left Column: Interactive Control & Stats */}
          <div className="showcase-card left-panel">
            <div className="card-badge">{activeCategory.badge}</div>
            <h3 className="card-heading">{activeCategory.title}</h3>
            <p className="card-description">{activeCategory.description}</p>

            {/* Stats Row */}
            <div className="stats-row">
              {activeCategory.stats.map((stat, idx) => (
                <div key={idx} className="stat-item">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Interactive Preset Switcher */}
            <div className="preset-selector-group">
              <label className="selector-label">
                <Sliders className="w-3.5 h-3.5 text-cyan-400 inline mr-1.5" />
                Select Interactive Preset:
              </label>
              <div className="preset-buttons">
                {activeCategory.presets.map((preset, idx) => (
                  <button
                    key={preset.id}
                    onClick={() => setActivePresetIndex(idx)}
                    className={`preset-btn ${idx === activePresetIndex ? "active" : ""}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Mode Toggles */}
            <div className="lighting-toggle-group">
              <span className="toggle-label">Atmosphere Lighting:</span>
              <div className="toggle-options">
                {["Studio High-Contrast", "Golden Hour", "Neon Rain"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setActiveLighting(mode)}
                    className={`toggle-chip ${activeLighting === mode ? "active" : ""}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Visual Canvas & Parameters */}
          <div
            className="showcase-card right-panel visual-canvas"
            style={{ background: activePreset.bgGradient }}
          >
            {/* Visual Glass Overlay */}
            <div className="canvas-glass-overlay">
              <div className="canvas-top-bar">
                <div className="live-indicator">
                  <span className="live-dot" />
                  <span>MODEL STATE: READY</span>
                </div>
                <div className="latency-tag">
                  <Zap className="w-3 h-3 text-emerald-400 mr-1" />
                  <span>0.8s Neural Latency</span>
                </div>
              </div>

              {/* Central Interactive Preview Graphic */}
              <div className="preview-graphic-box">
                <div className="preview-pulse-ring" />
                <div className="preview-content">
                  <div className="preview-icon-wrapper">
                    {React.createElement(activeCategory.icon, {
                      className: "w-10 h-10 text-cyan-200 animate-pulse",
                    })}
                  </div>
                  <h4 className="preview-title">{activePreset.label}</h4>
                  <p className="preview-subtext">{activePreset.material}</p>
                </div>
              </div>

              {/* Parameter Readouts */}
              <div className="parameter-grid">
                <div className="param-cell">
                  <span className="param-key">MATERIAL ENGINE</span>
                  <span className="param-val">{activePreset.material}</span>
                </div>
                <div className="param-cell">
                  <span className="param-key">SELECTED LIGHTING</span>
                  <span className="param-val">{activeLighting}</span>
                </div>
                <div className="param-cell">
                  <span className="param-key">SIMULATION STATS</span>
                  <span className="param-val">{activePreset.metrics}</span>
                </div>
              </div>

              {/* Interactive Prompt Box */}
              <div className="prompt-box">
                <div className="prompt-header">
                  <span className="prompt-title-text">GENERATIVE PROMPT PARAMETER</span>
                  <button onClick={handleCopyPrompt} className="copy-prompt-btn">
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <span>Copy Prompt</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
                <p className="prompt-code">"{activePreset.prompt}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

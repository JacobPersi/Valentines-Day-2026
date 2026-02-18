
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { TravelPin } from '../types';

interface WorldMapProps {
  pins: TravelPin[];
  onPinClick: (pin: TravelPin) => void;
  onMapClick: (coords: { lat: number; lng: number }) => void;
  isPinMode?: boolean;
}

export interface WorldMapRef {
  focusOnPin: (pin: TravelPin) => void;
}

const WorldMap = forwardRef<WorldMapRef, WorldMapProps>(({ pins, onPinClick, onMapClick, isPinMode = false }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);

  useImperativeHandle(ref, () => ({
    focusOnPin: (pin: TravelPin) => {
      if (!svgRef.current || !projectionRef.current || !zoomBehaviorRef.current) return;

      const svg = d3.select(svgRef.current);
      const coords = projectionRef.current([pin.lng, pin.lat]);

      if (coords) {
        const { width, height } = dimensions;
        const scale = 4;
        const translate: [number, number] = [
          width / 2 - coords[0] * scale,
          height / 2 - coords[1] * scale
        ];

        const transform = d3.zoomIdentity
          .translate(translate[0], translate[1])
          .scale(scale);

        svg.transition()
          .duration(750)
          .call(zoomBehaviorRef.current.transform, transform);
      }
    }
  }));

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(response => response.json())
      .then(data => setWorldData(data));

    const updateDimensions = () => {
      if (svgRef.current) {
        setDimensions({
          width: svgRef.current.clientWidth,
          height: svgRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!worldData || !svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    const existingG = svg.select('g.zoom-container');
    const isInitialRender = existingG.empty();

    if (isInitialRender) {
      svg.selectAll("*").remove();
    }

    const projection = d3.geoNaturalEarth1()
      .scale(width / 1.55 / Math.PI)
      .translate([width / 2, height / 2]);

    projectionRef.current = projection;
    const path = d3.geoPath().projection(projection);

    let g = existingG;
    if (isInitialRender) {
      g = svg.append("g").attr("class", "zoom-container");
    }

    // Update click handler on every render to capture latest onMapClick
    svg.on("click", (event) => {
      if (event.target.closest('.pin-container')) return;

      const node = svgRef.current;
      if (!node) return;

      const [mx, my] = d3.pointer(event, node);
      const transform = d3.zoomTransform(node);

      const [x, y] = transform.invert([mx, my]);
      const coords = projection.invert!([x, y]);

      if (coords) {
        onMapClick({ lat: coords[1], lng: coords[0] });
      }
    });

    // Update or create map layer
    let mapLayer = g.select<SVGGElement>('.map-layer');
    if (mapLayer.empty()) {
      mapLayer = g.append("g").attr("class", "map-layer");
    }

    const paths = mapLayer.selectAll("path")
      .data(worldData.features);

    paths.enter()
      .append("path")
      .merge(paths as any)
      .attr("d", (d: any) => path(d))
      .attr("fill", "#fecaca") // Static rose-200 color
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.5)
      .attr("vector-effect", "non-scaling-stroke")
      .style("cursor", "inherit")
      .on("mouseenter", function () {
        d3.select(this).attr("fill", "#fda4af"); // Rose-300 on hover
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", "#fecaca"); // Back to rose-200
      });

    paths.exit().remove();

    // Update or create pins layer
    let pinGroup = g.select<SVGGElement>('.pins-layer');
    if (pinGroup.empty()) {
      pinGroup = g.append("g").attr("class", "pins-layer");
    }

    const getColor = (pin: TravelPin) => {
      if (pin.category === 'MEMORY') return '#ef4444'; // Red
      switch (pin.owner) {
        case 'USER1': return '#ec4899'; // Pink
        case 'USER2': return '#6366f1'; // Indigo
        case 'SHARED': return '#f59e0b'; // Amber
        default: return '#ef4444';
      }
    };

    const drawPins = (currentK: number = 1) => {
      const pinScale = 1.0 / Math.pow(currentK, 0.7);
      const pinItems = pinGroup.selectAll<SVGGElement, TravelPin>(".pin-container")
        .data(pins, d => d.id);

      const pinEnter = pinItems.enter()
        .append("g")
        .attr("class", "pin-container cursor-pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          onPinClick(d);
        });

      pinEnter.append("path")
        .attr("d", "M0 0 C-3 -3 -6 -6 -6 -9 A 6 6 0 1 1 6 -9 C 6 -6 3 -3 0 0 Z")
        .attr("fill", d => getColor(d))
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("vector-effect", "non-scaling-stroke");

      pinEnter.append("circle")
        .attr("cx", 0)
        .attr("cy", -9)
        .attr("r", 2)
        .attr("fill", "white")
        .attr("vector-effect", "non-scaling-stroke");

      pinEnter.append("circle")
        .attr("r", 15)
        .attr("fill", "transparent");

      // Update all pins (both new and existing) with correct transform
      pinGroup.selectAll<SVGGElement, TravelPin>(".pin-container")
        .attr("transform", d => {
          const coords = projection([d.lng, d.lat]);
          return coords ? `translate(${coords[0]}, ${coords[1]}) scale(${pinScale})` : null;
        });

      pinItems.exit().remove();
    };

    const currentTransform = isInitialRender ? d3.zoomIdentity : d3.zoomTransform(svgRef.current);
    drawPins(currentTransform.k);

    if (isInitialRender) {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 15])
        .on("zoom", (event) => {
          const { transform } = event;
          g.attr("transform", transform.toString());

          const pinScale = 1.0 / Math.pow(transform.k, 0.7);
          pinGroup.selectAll(".pin-container")
            .attr("transform", (d: any) => {
              const coords = projection([d.lng, d.lat]);
              return coords ? `translate(${coords[0]}, ${coords[1]}) scale(${pinScale})` : null;
            });
        });

      zoomBehaviorRef.current = zoom;
      svg.call(zoom);
    }

  }, [worldData, pins, onPinClick, onMapClick, dimensions]);

  return (
    <div className={`w-full h-full relative overflow-hidden bg-[#fffafa] rounded-[2.5rem] border-4 border-white shadow-xl transition-all ${isPinMode ? 'cursor-crosshair ring-4 ring-rose-300 ring-offset-4' : 'cursor-default'}`}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ touchAction: 'manipulation', outline: 'none' }}
      />
    </div>
  );
});

WorldMap.displayName = 'WorldMap';

export default WorldMap;

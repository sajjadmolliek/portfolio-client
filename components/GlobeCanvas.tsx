'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ThreeGlobe from 'three-globe';
import * as THREE from 'three';
import { arcs, type Arc } from '@/lib/globe-arcs';

/**
 * The globe the reference draws into the "I'm very flexible with time zone
 * communications" card. Ported from its own chunk: a three-globe sphere inside an
 * @react-three/fiber scene with the reference's exact camera, lights, globe
 * material, hex polygons, arc animation and idle auto-rotation.
 *
 * It is only mounted once the card scrolls into view (see GlobeSection), and the
 * country polygons are fetched rather than inlined so three.js stays out of the
 * first load.
 */

interface Point {
  lat: number;
  lng: number;
}

interface GlobeConfig {
  pointSize: number;
  globeColor: string;
  showAtmosphere: boolean;
  atmosphereColor: string;
  atmosphereAltitude: number;
  emissive: string;
  emissiveIntensity: number;
  shininess: number;
  polygonColor: string;
  ambientLight: string;
  directionalLeftLight: string;
  directionalTopLight: string;
  pointLight: string;
  arcTime: number;
  arcLength: number;
  rings: number;
  maxRings: number;
  initialPosition: Point;
  autoRotate: boolean;
  autoRotateSpeed: number;
}

const CONFIG: GlobeConfig = {
  pointSize: 4,
  globeColor: '#062056',
  showAtmosphere: true,
  atmosphereColor: '#FFFFFF',
  atmosphereAltitude: 0.1,
  emissive: '#062056',
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: 'rgba(255,255,255,0.7)',
  ambientLight: '#38bdf8',
  directionalLeftLight: '#ffffff',
  directionalTopLight: '#ffffff',
  pointLight: '#ffffff',
  arcTime: 1000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3193, lng: 114.1694 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

/** The reference's own fallbacks, then the config the home page hands it. */
const BASE = {
  pointSize: 1,
  atmosphereColor: '#ffffff',
  showAtmosphere: true,
  atmosphereAltitude: 0.1,
  polygonColor: 'rgba(255,255,255,0.7)',
  globeColor: '#1d072e',
  emissive: '#000000',
  emissiveIntensity: 0.1,
  shininess: 0.9,
  arcTime: 2000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
};

const DEFAULTS: GlobeConfig = { ...BASE, ...CONFIG };

/** The reference's `genRandomNumbers`: `count` distinct integers in [from, to). */
function randomIndexes(from: number, to: number, count: number) {
  const picked: number[] = [];
  while (picked.length < count) {
    const n = Math.floor(Math.random() * (to - from)) + from;
    if (picked.indexOf(n) === -1) picked.push(n);
  }
  return picked;
}

function GlobeObject({
  config,
  data,
  countries,
}: {
  config: GlobeConfig;
  data: Arc[];
  countries: unknown;
}) {
  const globeRef = useRef<ThreeGlobe | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!globeRef.current && groupRef.current) {
      globeRef.current = new ThreeGlobe();
      groupRef.current.add(globeRef.current);
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const material = globeRef.current.globeMaterial() as THREE.MeshPhongMaterial;
    material.color = new THREE.Color(config.globeColor);
    material.emissive = new THREE.Color(config.emissive);
    material.emissiveIntensity = config.emissiveIntensity || 0.1;
    material.shininess = config.shininess || 0.9;
  }, [mounted, config.globeColor, config.emissive, config.emissiveIntensity, config.shininess]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !mounted || !data || !countries) return;

    const points = data.flatMap(arc => [
      { size: DEFAULTS.pointSize, order: arc.order, color: arc.color, lat: arc.startLat, lng: arc.startLng },
      { size: DEFAULTS.pointSize, order: arc.order, color: arc.color, lat: arc.endLat, lng: arc.endLng },
    ]);
    const unique = points.filter(
      (point, i) => points.findIndex(o => o.lat === point.lat && o.lng === point.lng) === i,
    );

    globe
      .hexPolygonsData(countries as never)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .showAtmosphere(DEFAULTS.showAtmosphere)
      .atmosphereColor(DEFAULTS.atmosphereColor)
      .atmosphereAltitude(DEFAULTS.atmosphereAltitude)
      .hexPolygonColor(() => DEFAULTS.polygonColor);

    globe
      .arcsData(data)
      .arcStartLat((d: object) => +(d as Arc).startLat)
      .arcStartLng((d: object) => +(d as Arc).startLng)
      .arcEndLat((d: object) => +(d as Arc).endLat)
      .arcEndLng((d: object) => +(d as Arc).endLng)
      .arcColor((d: object) => (d as Arc).color)
      .arcAltitude((d: object) => +(d as Arc).arcAlt)
      .arcStroke(() => [0.32, 0.28, 0.3][Math.round(2 * Math.random())])
      .arcDashLength(DEFAULTS.arcLength)
      .arcDashInitialGap((d: object) => +(d as Arc).order)
      .arcDashGap(15)
      .arcDashAnimateTime(() => DEFAULTS.arcTime);

    globe
      .pointsData(unique as never)
      .pointColor(d => String((d as { color: string }).color))
      .pointsMerge(true)
      .pointAltitude(0)
      .pointRadius(2);

    globe
      .ringsData([])
      .ringColor(() => DEFAULTS.polygonColor)
      .ringMaxRadius(DEFAULTS.maxRings)
      .ringPropagationSpeed(3)
      .ringRepeatPeriod((DEFAULTS.arcTime * DEFAULTS.arcLength) / DEFAULTS.rings);
  }, [mounted, data, countries]);

  useEffect(() => {
    if (!globeRef.current || !mounted || !data) return;
    const timer = setInterval(() => {
      const globe = globeRef.current;
      if (!globe) return;
      const picks = randomIndexes(0, data.length, Math.floor((4 * data.length) / 5));
      globe.ringsData(
        data
          .filter((_, i) => picks.includes(i))
          .map(arc => ({ lat: arc.startLat, lng: arc.startLng, color: arc.color })) as never,
      );
    }, 2000);
    return () => clearInterval(timer);
  }, [mounted, data]);

  return <group ref={groupRef} />;
}

export default function GlobeCanvas() {
  const scene = useMemo(() => {
    const s = new THREE.Scene();
    s.fog = new THREE.Fog(0xffffff, 400, 2000);
    return s;
  }, []);
  const camera = useMemo(() => {
    const c = new THREE.PerspectiveCamera(50, 1.2, 180, 1800);
    // the reference's orbit controls hold the camera 300 units out; starting it
    // there avoids a degenerate offset on the first update
    c.position.set(0, 0, 300);
    return c;
  }, []);
  const data = useMemo(() => arcs(), []);
  const [countries, setCountries] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    fetch('/globe-countries.json')
      .then(r => r.json())
      .then(json => {
        if (alive) setCountries(json);
      })
      .catch(() => {
        /* no polygons: the sphere and arcs still render */
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Canvas scene={scene} camera={camera} gl={{ alpha: true, antialias: true }}>
      <ambientLight color={DEFAULTS.ambientLight} intensity={0.6} />
      <directionalLight color={DEFAULTS.directionalLeftLight} position={[-400, 100, 400]} />
      <directionalLight color={DEFAULTS.directionalTopLight} position={[-200, 500, 200]} />
      <pointLight color={DEFAULTS.pointLight} position={[-200, 500, 200]} intensity={0.8} />
      <GlobeObject config={DEFAULTS} data={data} countries={countries} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minDistance={300}
        maxDistance={300}
        autoRotateSpeed={1}
        autoRotate
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />
    </Canvas>
  );
}

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Eye } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations.js';

export default function ThreeViewer({
  lang,
  containerData,
  currentStep,
  setCurrentStep,
  onHoverBox,
  hoveredBox
}) {
  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per step
  const timerRef = useRef(null);

  // Scene references for updates
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const boxMeshesRef = useRef([]); // Stores references to placed boxes
  const containerMeshGroupRef = useRef(null); // Stores container frame lines

  const maxSteps = containerData?.items?.length || 0;

  // Initialize Three.js Scene
  useEffect(() => {
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0b10');
    sceneRef.current = scene;

    // Camera (Persp)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);
    camera.position.set(-8000, 6000, 10000); // Angled view looking down
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    controls.minDistance = 1000;
    controls.maxDistance = 50000;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight1.position.set(-10000, 15000, 5000);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 150000;
    const d = 25000;
    dirLight1.shadow.camera.left = -d;
    dirLight1.shadow.camera.right = d;
    dirLight1.shadow.camera.top = d;
    dirLight1.shadow.camera.bottom = -d;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa5b4fc, 0.3); // Warm blue fill
    dirLight2.position.set(10000, -5000, -5000);
    scene.add(dirLight2);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(60000, 100, '#1f1f2e', '#13131f');
    gridHelper.position.y = -1; // Slightly below container floor
    scene.add(gridHelper);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    const currentMount = mountRef.current;
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, []);

  // Update container wireframe & boxes when containerData or currentStep changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !containerData) return;

    // Clear old container wireframe
    if (containerMeshGroupRef.current) {
      scene.remove(containerMeshGroupRef.current);
    }
    boxMeshesRef.current.forEach(mesh => scene.remove(mesh));
    boxMeshesRef.current = [];

    const group = new THREE.Group();
    containerMeshGroupRef.current = group;

    const { l, w, h } = containerData;

    // Shift coordinates so container center sits at (0, z_height/2, 0)
    // l is length (X), w is width (Y), h is height (Z)
    // In Three.js, let's map:
    // Three.js X = Container Length (l)
    // Three.js Y = Container Height (h) -> Up is Y in Three.js!
    // Three.js Z = Container Width (w)
    const offsetX = -l / 2;
    const offsetY = 0; // Container floor sits on floor
    const offsetZ = -w / 2;

    // Draw container outline
    const geometry = new THREE.BoxGeometry(l, h, w);
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: '#4f46e5',
      linewidth: 2,
      transparent: true,
      opacity: 0.7
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    // Position wireframe center
    wireframe.position.set(0, h / 2, 0);
    group.add(wireframe);

    // Semi-transparent glass walls & floor
    const containerMat = new THREE.MeshStandardMaterial({
      color: '#1e1b4b',
      transparent: true,
      opacity: 0.15,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.BackSide
    });
    const containerMesh = new THREE.Mesh(geometry, containerMat);
    containerMesh.position.set(0, h / 2, 0);
    group.add(containerMesh);

    // Front door visual markers
    // The "door" is at the Front (X = l/2)
    const doorFrameGeo = new THREE.BoxGeometry(100, h, w);
    const doorFrameMat = new THREE.MeshStandardMaterial({
      color: '#ec4899',
      transparent: true,
      opacity: 0.4
    });
    const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    doorFrame.position.set(l / 2, h / 2, 0);
    group.add(doorFrame);

    // Text indicators (Floating text / Directional indicators)
    // Draw simple arrows pointing to the door
    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-l / 2 - 1000, 100, 0),
      2000,
      '#06b6d4',
      600,
      300
    );
    group.add(arrowHelper);

    scene.add(group);

    // Render placed boxes (only if their stepIndex <= currentStep)
    const itemsToRender = containerData.items || [];
    itemsToRender.forEach((item) => {
      if (item.stepIndex > currentStep) return;

      const boxGeo = new THREE.BoxGeometry(item.dx, item.dz, item.dy); // dx is length (X), dz is height (Y), dy is width (Z)
      
      // Glassy premium box material
      const boxMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(item.color),
        roughness: 0.3,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
      });

      const mesh = new THREE.Mesh(boxGeo, boxMat);
      
      // Calculate individual centers relative to offsetX, offsetY, offsetZ
      // item.x is distance from container back (0 to l)
      // item.y is distance from container left side (0 to w)
      // item.z is distance from container floor (0 to h)
      const posX = offsetX + item.x + item.dx / 2;
      const posY = offsetY + item.z + item.dz / 2; // Z in container is Up (Y in Three.js)
      const posZ = offsetZ + item.y + item.dy / 2; // Y in container is Z in Three.js

      mesh.position.set(posX, posY, posZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Attach item metadata to mesh for Raycasting
      mesh.userData = item;

      // Thin black/white wireframe outline for box definition
      const boxEdges = new THREE.EdgesGeometry(boxGeo);
      const boxOutlineMat = new THREE.LineBasicMaterial({
        color: '#0b0b10',
        linewidth: 1,
        transparent: true,
        opacity: 0.5
      });
      const boxOutline = new THREE.LineSegments(boxEdges, boxOutlineMat);
      mesh.add(boxOutline);

      scene.add(mesh);
      boxMeshesRef.current.push(mesh);
    });

    // Fit camera to container size on initial load
    if (cameraRef.current && controlsRef.current) {
      const distance = l * 1.3;
      cameraRef.current.position.set(-distance * 0.8, h * 2.5, distance * 0.8);
      controlsRef.current.target.set(0, h / 2, 0);
      controlsRef.current.update();
    }

  }, [containerData, currentStep]);

  // Raycasting for Hover Tooltips
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (!cameraRef.current) return;
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(boxMeshesRef.current);

      if (intersects.length > 0) {
        // Find closest intersected mesh
        const hoveredMesh = intersects[0].object;
        const itemData = hoveredMesh.userData;
        
        // Highlight box slightly by lowering other boxes opacity or changing its emissive glow
        boxMeshesRef.current.forEach(m => {
          if (m === hoveredMesh) {
            m.material.opacity = 1.0;
            m.material.emissive = new THREE.Color('#ffffff');
            m.material.emissiveIntensity = 0.15;
          } else {
            m.material.opacity = 0.5;
            m.material.emissiveIntensity = 0;
          }
        });

        onHoverBox(itemData);
      } else {
        // Reset all opacities
        boxMeshesRef.current.forEach(m => {
          m.material.opacity = 0.85;
          m.material.emissiveIntensity = 0;
        });
        onHoverBox(null);
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [containerData, currentStep, onHoverBox]);

  // SOP Playback Loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, maxSteps, setCurrentStep]);

  const handlePlayPause = () => {
    if (currentStep >= maxSteps && !isPlaying) {
      setCurrentStep(0); // Reset to beginning if at the end
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.min(maxSteps, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleShowAll = () => {
    setIsPlaying(false);
    setCurrentStep(maxSteps);
  };

  const getStackingGradeName = (grade) => {
    if (grade === 3) return { label: t('heavyBottomLabel'), class: 'heavy' };
    if (grade === 2) return { label: t('mediumMiddleLabel'), class: 'medium' };
    return { label: t('lightTopLabel'), class: 'light' };
  };

  return (
    <div className="canvas-container">
      {/* Three.js viewport */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Directions Label */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', pointerEvents: 'none' }}>
        <span className="logo-badge" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'var(--color-secondary)' }}>
          {t('containerBack')}
        </span>
        <span className="logo-badge" style={{ background: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec4899' }}>
          {t('containerDoor')}
        </span>
      </div>

      {/* Hover Information Card */}
      {hoveredBox && (
        <div className="hover-card glass-panel">
          <h4 style={{ color: hoveredBox.color }}>
            {lang === 'en' ? (hoveredBox.skuEn || hoveredBox.sku) : hoveredBox.sku}
          </h4>
          <p><span>{t('sopSeq')}:</span> <strong>SOP #{hoveredBox.stepIndex}</strong></p>
          <p><span>{t('dimensions')}:</span> <strong>{hoveredBox.dx}×{hoveredBox.dy}×{hoveredBox.dz} mm</strong></p>
          <p><span>{t('position')}:</span> <strong>X:{hoveredBox.x} Y:{hoveredBox.y} Z:{hoveredBox.z}</strong></p>
          <p><span>{t('unitWeightLabel')}:</span> <strong>{hoveredBox.weight} kg</strong></p>
          <p style={{ marginTop: '6px' }}>
            <span>{t('stackingGradeLabel')}:</span> 
            <strong className={`badge-grade ${getStackingGradeName(hoveredBox.stackingGrade).class}`}>
              {getStackingGradeName(hoveredBox.stackingGrade).label}
            </strong>
          </p>
        </div>
      )}

      {/* Step-by-Step SOP Controls */}
      {maxSteps > 0 && (
        <div className="sop-controls">
          <button className="sop-btn" onClick={handleReset} title={t('resetBtn')}>
            <RotateCcw size={16} />
          </button>
          <button className="sop-btn" onClick={handleStepBack} disabled={currentStep === 0} title={t('prevBtn')}>
            <SkipBack size={16} />
          </button>
          
          <button className="sop-btn" onClick={handlePlayPause} style={{ background: isPlaying ? 'var(--color-danger)' : 'var(--color-success)', borderColor: 'transparent' }} title={isPlaying ? t('pauseBtn') : t('autoLoadBtn')}>
            {isPlaying ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" />}
          </button>

          <button className="sop-btn" onClick={handleStepForward} disabled={currentStep === maxSteps} title={t('nextBtn')}>
            <SkipForward size={16} />
          </button>
          <button className="sop-btn" onClick={handleShowAll} disabled={currentStep === maxSteps} title={t('showAllBtn')}>
            <Eye size={16} />
          </button>

          <span className="sop-progress-text">
            {t('loadStep')}: <strong>{currentStep}</strong> / {maxSteps}
          </span>

          {/* Speed slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-light)', paddingLeft: '14px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{t('loadSpeed')}:</span>
            <input 
              type="range" 
              min="200" 
              max="2500" 
              step="100"
              value={3000 - playbackSpeed} 
              onChange={(e) => setPlaybackSpeed(3000 - Number(e.target.value))}
              style={{ width: '80px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

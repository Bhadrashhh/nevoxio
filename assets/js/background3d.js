/**
 * NEVOXIO - 3D Background Engine
 * High-performance Three.js WebGL Cosmic Ring & Cursor-Tracking Particle System
 */

(function () {
  'use strict';

  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03050c, 0.025);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 14);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  // Mouse & Interaction State
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    vx: 0,
    vy: 0,
    prevX: 0,
    prevY: 0
  };

  // Scroll Progress State
  let scrollProgress = 0;
  let targetScroll = 0;

  window.addEventListener('scroll', () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    targetScroll = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }, { passive: true });

  // --------------------------------------------------------------------------
  // 1. THE CELESTIAL GLOWING COSMIC RING
  // --------------------------------------------------------------------------
  const ringGroup = new THREE.Group();
  scene.add(ringGroup);

  // Position ring matching the hero screenshots:
  // Elevated, tilted back slightly, forming the grand glowing arch
  const baseRingY = 2.4;
  const baseRingZ = -2.5;
  ringGroup.position.set(0, baseRingY, baseRingZ);
  const baseRotX = 1.25; // tilted forward so arc frames the upper center
  ringGroup.rotation.x = baseRotX;

  // Main Core Ring Geometry (Torus)
  const ringRadius = 9.8;
  const ringTube = 0.085;
  const ringGeo = new THREE.TorusGeometry(ringRadius, ringTube, 64, 320);

  // Custom Shader for the Neon Electric Ring
  const ringShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorCore: { value: new THREE.Color(0xffffff) },
      uColorCyan: { value: new THREE.Color(0x00f0ff) },
      uColorBlue: { value: new THREE.Color(0x3b82f6) },
      uColorViolet: { value: new THREE.Color(0x8b5cf6) },
      uMouse: { value: new THREE.Vector2(0, 0) }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      uniform float uTime;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position;
        
        // Subtle micro-energy displacement along the ring
        float angle = atan(pos.y, pos.x);
        float wave = sin(angle * 12.0 + uTime * 2.5) * 0.02;
        pos += normal * wave;

        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColorCore;
      uniform vec3 uColorCyan;
      uniform vec3 uColorBlue;
      uniform vec3 uColorViolet;
      uniform vec2 uMouse;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = 1.0 - abs(dot(vNormal, viewDir));
        fresnel = pow(fresnel, 1.8);

        // Radiant color blending along circumference
        float angle = atan(vWorldPosition.y, vWorldPosition.x);
        float pulse = sin(angle * 4.0 - uTime * 1.8) * 0.5 + 0.5;

        // Mouse light sweep interaction
        float mouseDist = length(uMouse - vWorldPosition.xy * 0.1);
        float mouseHighlight = smoothstep(1.5, 0.0, mouseDist) * 0.6;

        vec3 glowColor = mix(uColorBlue, uColorCyan, pulse);
        glowColor = mix(glowColor, uColorViolet, sin(uTime * 0.8 + angle) * 0.5 + 0.5);

        // Bright white-hot core
        vec3 finalColor = mix(glowColor, uColorCore, pow(fresnel, 3.0) * 0.85);
        finalColor += uColorCyan * mouseHighlight;

        float alpha = 0.85 + fresnel * 0.15;
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  const coreRingMesh = new THREE.Mesh(ringGeo, ringShaderMaterial);
  ringGroup.add(coreRingMesh);

  // Outer Volumetric Bloom Halo (Concentric softer ring)
  const haloGeo = new THREE.TorusGeometry(ringRadius, ringTube * 4.2, 32, 200);
  const haloMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0x3b82f6) },
      uColor2: { value: new THREE.Color(0x8b5cf6) }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float rim = 1.0 - abs(dot(vNormal, viewDir));
        rim = pow(rim, 2.5);

        vec3 color = mix(uColor1, uColor2, sin(uTime * 0.5) * 0.5 + 0.5);
        gl_FragColor = vec4(color, rim * 0.42);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  ringGroup.add(haloMesh);

  // Cosmic Ring Backdrop Aura (Large soft disc glow behind the ring)
  const auraTexture = createRadialAuraTexture();
  const auraGeo = new THREE.PlaneGeometry(36, 36);
  const auraMat = new THREE.MeshBasicMaterial({
    map: auraTexture,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  auraMesh.position.set(0, 0, -1.8);
  ringGroup.add(auraMesh);

  function createRadialAuraTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 256);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
    grad.addColorStop(0.3, 'rgba(99, 102, 241, 0.22)');
    grad.addColorStop(0.65, 'rgba(139, 92, 246, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // --------------------------------------------------------------------------
  // 2. FLOATING 3D STARFIELD & QUANTUM DUST
  // --------------------------------------------------------------------------
  const particleCount = 1400;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const speeds = new Float32Array(particleCount);

  const palette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0x00f0ff),
    new THREE.Color(0x93c5fd),
    new THREE.Color(0xc084fc),
    new THREE.Color(0x38bdf8)
  ];

  for (let i = 0; i < particleCount; i++) {
    // Spatial distribution in cylindrical volume around scene
    const radius = 4 + Math.random() * 26;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 22;
    const z = (Math.random() - 0.5) * 26;

    positions[i * 3] = Math.cos(theta) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const col = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    sizes[i] = Math.random() * 2.8 + 0.8;
    speeds[i] = Math.random() * 0.4 + 0.1;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Particle Material
  const particleTexture = createCircularParticleTexture();
  const particleMat = new THREE.PointsMaterial({
    size: 0.16,
    vertexColors: true,
    map: particleTexture,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  function createCircularParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(147, 197, 253, 0.8)');
    grad.addColorStop(0.7, 'rgba(59, 130, 246, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // --------------------------------------------------------------------------
  // 3. FLOATING 3D GEOMETRIC SHARDS (Subtle Cyber Elements)
  // --------------------------------------------------------------------------
  const shardsGroup = new THREE.Group();
  scene.add(shardsGroup);

  const shardGeos = [
    new THREE.OctahedronGeometry(0.38, 0),
    new THREE.TetrahedronGeometry(0.42, 0),
    new THREE.IcosahedronGeometry(0.32, 0)
  ];

  const shardMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    emissive: 0x1e3a8a,
    emissiveIntensity: 0.4,
    metalness: 0.85,
    roughness: 0.15,
    transmission: 0.65,
    thickness: 0.5,
    transparent: true,
    opacity: 0.75
  });

  const shardMeshes = [];
  const shardCount = 10;
  for (let i = 0; i < shardCount; i++) {
    const geo = shardGeos[i % shardGeos.length];
    const mesh = new THREE.Mesh(geo, shardMat);
    const angle = (i / shardCount) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 7.5 + Math.random() * 4.5;
    mesh.position.set(
      Math.cos(angle) * dist,
      (Math.random() - 0.5) * 7 + 1,
      (Math.random() - 0.5) * 6 - 1
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.userData = {
      basePos: mesh.position.clone(),
      rotSpeed: {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02
      },
      floatOffset: Math.random() * 10
    };
    shardsGroup.add(mesh);
    shardMeshes.push(mesh);
  }

  // --------------------------------------------------------------------------
  // 4. LIGHTING SYSTEM (Cursor-Tracking Specular Light)
  // --------------------------------------------------------------------------
  const ambientLight = new THREE.AmbientLight(0x060b24, 1.2);
  scene.add(ambientLight);

  // Dynamic Cursor Point Light
  const cursorLight = new THREE.PointLight(0x00f0ff, 3.2, 28);
  cursorLight.position.set(0, 0, 4);
  scene.add(cursorLight);

  // Backlight for celestial atmosphere
  const backLight = new THREE.PointLight(0x8b5cf6, 2.5, 30);
  backLight.position.set(0, 6, -6);
  scene.add(backLight);

  // --------------------------------------------------------------------------
  // 5. ANIMATION & CURSOR-FOLLOWING RENDER LOOP
  // --------------------------------------------------------------------------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Smooth Lerp for Cursor Movement (Inertia & Fluidity)
    mouse.x += (mouse.targetX - mouse.x) * 0.055;
    mouse.y += (mouse.targetY - mouse.y) * 0.055;

    // Smooth Lerp for Scroll Progress
    scrollProgress += (targetScroll - scrollProgress) * 0.06;

    // Calculate Mouse Velocity
    mouse.vx = mouse.x - mouse.prevX;
    mouse.vy = mouse.y - mouse.prevY;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;

    // Update Shaders
    ringShaderMaterial.uniforms.uTime.value = elapsedTime;
    ringShaderMaterial.uniforms.uMouse.value.set(mouse.x * 5, mouse.y * 5);
    haloMat.uniforms.uTime.value = elapsedTime;

    // 3D Parallax Tilt of the Celestial Cosmic Ring
    // Ring tilts naturally based on user cursor coordinates and scroll
    const scrollTilt = scrollProgress * 0.35;
    ringGroup.rotation.y = mouse.x * 0.32;
    ringGroup.rotation.x = (baseRotX - scrollTilt) - mouse.y * 0.22;
    ringGroup.rotation.z = Math.sin(elapsedTime * 0.3) * 0.04 + mouse.x * 0.12;

    // Subtle breathing float on Y and Z, lifting slightly when scrolling
    const scrollLiftY = scrollProgress * 2.8;
    ringGroup.position.y = baseRingY + scrollLiftY + Math.sin(elapsedTime * 0.8) * 0.18 + mouse.y * 0.6;
    ringGroup.position.x = mouse.x * 0.8;
    ringGroup.position.z = baseRingZ - scrollProgress * 3.5;

    // Camera 3D Parallax Response with scroll descent
    camera.position.x = mouse.x * 1.6;
    camera.position.y = (mouse.y * 1.2) - (scrollProgress * 2.2);
    camera.lookAt(0, 0.5 - (scrollProgress * 1.5), -2);

    // Cursor Point Light tracking in 3D world space
    cursorLight.position.x = mouse.x * 9;
    cursorLight.position.y = mouse.y * 6;
    cursorLight.position.z = 3 + Math.sin(elapsedTime * 2) * 0.5;

    // Particles Drift & Cursor Reactivity
    const posArr = particleGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Gentle orbital drift
      posArr[idx + 1] += speeds[i] * 0.012;
      if (posArr[idx + 1] > 14) posArr[idx + 1] = -14;

      // Mouse velocity deflection
      posArr[idx] += mouse.vx * speeds[i] * 0.8;
      posArr[idx + 2] += mouse.vy * speeds[i] * 0.6;
    }
    particleGeo.attributes.position.needsUpdate = true;
    particles.rotation.y = elapsedTime * 0.02 + mouse.x * 0.15;

    // Animate Shards
    shardMeshes.forEach((mesh) => {
      mesh.rotation.x += mesh.userData.rotSpeed.x;
      mesh.rotation.y += mesh.userData.rotSpeed.y;
      mesh.rotation.z += mesh.userData.rotSpeed.z;

      const offset = mesh.userData.floatOffset;
      mesh.position.y = mesh.userData.basePos.y + Math.sin(elapsedTime + offset) * 0.4 + mouse.y * 0.5;
      mesh.position.x = mesh.userData.basePos.x + mouse.x * 0.4;
    });

    renderer.render(scene, camera);
  }

  animate();

  // --------------------------------------------------------------------------
  // 6. RESIZE HANDLER
  // --------------------------------------------------------------------------
  window.addEventListener('resize', onWindowResize, false);

  function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Dynamic adjustment for mobile screen aspect ratios
    if (width < 768) {
      camera.position.z = 18;
      ringGroup.scale.set(0.72, 0.72, 0.72);
      ringGroup.position.y = 1.6;
    } else {
      camera.position.z = 14;
      ringGroup.scale.set(1, 1, 1);
      ringGroup.position.y = baseRingY;
    }
  }

  onWindowResize();

  // Expose ring controller for cinematic entrance
  window.Nevoxio3D = {
    triggerPulse: function () {
      ringShaderMaterial.uniforms.uColorCyan.value.set(0xffffff);
      setTimeout(() => {
        ringShaderMaterial.uniforms.uColorCyan.value.set(0x00f0ff);
      }, 300);
    }
  };
})();

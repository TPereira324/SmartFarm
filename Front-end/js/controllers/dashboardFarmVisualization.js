(function () {
    let scene, camera, renderer, controls, clock;
    let plots = [], initialized = false, cachedIds = '';

    const PLOT_SIZE = 2.8, SPACING = 3.5, GROW_SEC = 3;
    const LABELS = ['Terra vazia', 'Semente', 'A nascer', 'Planta média', 'Crescida 🌿'];

    // ── Materiais ──────────────────────────────────────────────────────────────
    const lmat = (c) => new THREE.MeshLambertMaterial({ color: c });

    // ── Planta ─────────────────────────────────────────────────────────────────
    const buildPlant = (fCol) => {
        const g = new THREE.Group();
        const seed  = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8),           lmat(0xd4a017));
        const stem  = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.0, 8), lmat(0x2d6e1e));
        const leafA = new THREE.Mesh(new THREE.SphereGeometry(0.30, 8, 8),            lmat(0x4ec93a));
        const leafB = new THREE.Mesh(new THREE.SphereGeometry(0.30, 8, 8),            lmat(0x38b22a));
        const leafC = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8),            lmat(0x62de4c));
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14),          lmat(fCol));
        const flwr  = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10),          lmat(0xfff060));
        seed.position.y = 0.12;
        stem.position.y = 0.50;
        leafA.position.set( 0.44, 0.54,  0.08);
        leafB.position.set(-0.44, 0.54,  0.08);
        leafC.position.set( 0.00, 0.54,  0.44);
        fruit.position.y = 1.15;
        flwr.position.y  = 1.60;
        [seed, stem, leafA, leafB, leafC, fruit, flwr].forEach(m => {
            m.scale.setScalar(0.01);
            m.castShadow = true;
        });
        g.add(seed, stem, leafA, leafB, leafC, fruit, flwr);
        return { g, seed, stem, leafA, leafB, leafC, fruit, flwr };
    };

    // ── Cor do fruto ───────────────────────────────────────────────────────────
    const fruitColor = (parcela) => {
        try {
            const cat = pickCultivoCategory(getCultivoLabel(parcela));
            if (cat === 'raizes')   return 0xee7711;
            if (cat === 'folhosas') return 0x33cc11;
            if (cat === 'ervas')    return 0x11cc99;
        } catch (_) {}
        return 0xee2222;
    };

    // ── Criar parcela 3D ────────────────────────────────────────────────────────
    const createPlot = (x, z, parcela) => {
        const root = new THREE.Group();
        root.position.set(x, 0, z);

        // Cama de terra elevada
        const bed = new THREE.Mesh(new THREE.BoxGeometry(PLOT_SIZE, 0.24, PLOT_SIZE), lmat(0x6aaa4c));
        bed.position.y = 0.12; bed.receiveShadow = true; bed.castShadow = true;
        root.add(bed);

        // Solo interior
        const soil = new THREE.Mesh(new THREE.BoxGeometry(PLOT_SIZE - 0.26, 0.14, PLOT_SIZE - 0.26), lmat(0x7a5230));
        soil.position.y = 0.20;
        root.add(soil);

        // Bordas de madeira
        const hs = PLOT_SIZE / 2;
        [[0, -hs, 0], [0, hs, 0], [-hs, 0, Math.PI / 2], [hs, 0, Math.PI / 2]].forEach(([dx, dz, ry]) => {
            const e = new THREE.Mesh(new THREE.BoxGeometry(PLOT_SIZE + 0.04, 0.72, 0.24), lmat(0x3a5a28));
            e.position.set(dx, 0.36, dz);
            e.rotation.y = ry;
            e.castShadow = true;
            root.add(e);
        });

        // Planta
        const plant = buildPlant(fruitColor(parcela));
        plant.g.position.y = 0.24;
        root.add(plant.g);

        // Anel de seleção
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.54, 1.82, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.26;
        root.add(ring);

        root.userData = { parcela, state: 0, elapsed: 0, progress: 0, active: false, targetState: 0, plant, bed, ring };
        scene.add(root);
        return root;
    };

    // ── Máquina de estados visual ──────────────────────────────────────────────
    const applyVisual = (plot) => {
        const { state, progress, plant: { seed, stem, leafA, leafB, leafC, fruit, flwr } } = plot.userData;
        seed.visible = state === 1;
        stem.visible = state >= 2;
        [leafA, leafB, leafC].forEach(m => { m.visible = state >= 3; });
        [fruit, flwr].forEach(m => { m.visible = state >= 4; });
        const s = (v) => Math.max(0.01, v);
        if (state === 1) {
            seed.scale.setScalar(s(0.22 + progress * 0.78));
        } else if (state === 2) {
            const h = s(0.14 + progress * 0.66);
            stem.scale.set(1, h, 1);
            stem.position.y = 0.08 + h * 0.5;
            [leafA, leafB, leafC, fruit, flwr].forEach(m => m.scale.setScalar(0.01));
        } else if (state === 3) {
            stem.scale.set(1, 0.80, 1); stem.position.y = 0.5;
            [leafA, leafB, leafC].forEach(m => m.scale.setScalar(s(progress * 0.95)));
            [fruit, flwr].forEach(m => m.scale.setScalar(0.01));
        } else if (state === 4) {
            stem.scale.set(1, 0.88, 1); stem.position.y = 0.5;
            [leafA, leafB, leafC].forEach(m => m.scale.setScalar(0.95));
            [fruit, flwr].forEach(m => m.scale.setScalar(s(progress)));
        } else {
            [seed, stem, leafA, leafB, leafC, fruit, flwr].forEach(m => m.scale.setScalar(0.01));
        }
    };

    // ── Grid de parcelas ────────────────────────────────────────────────────────
    const buildGrid = (parcelas) => {
        plots.forEach(p => scene.remove(p)); plots = [];
        const isDemo = parcelas.length === 0;
        const list = isDemo
            ? Array.from({ length: 6 }, (_, i) => ({ nome: `Parcela ${i + 1}` }))
            : parcelas;
        const cols = Math.min(4, list.length), half = ((cols - 1) * SPACING) / 2;
        list.forEach((p, i) => {
            const plot = createPlot((i % cols) * SPACING - half, Math.floor(i / cols) * SPACING, p);
            if (isDemo) {
                // Plots de demonstração: crescimento escalonado para mostrar os 4 estados
                plot.userData.elapsed = (i % 4) * GROW_SEC * 0.85;
                startGrow(plot, 4);
            } else {
                const ts = deriveState(p);
                if (ts > 0) startGrow(plot, ts);
            }
            plots.push(plot);
        });
    };

    const deriveState = (p) => {
        const e = String(p?.estado || p?.par_estado || '').toLowerCase();
        try { if (!getCultivoLabel(p)) return 0; } catch (_) { return 0; }
        if (e.includes('inat')) return 0;
        if (e.includes('critic')) return 1;
        if (e.includes('aten')) return 2;
        return 4;
    };

    const startGrow = (plot, target) => {
        Object.assign(plot.userData, { state: 1, progress: 0, active: true, targetState: Math.max(1, target) });
        applyVisual(plot);
    };

    // ── Texto de informação ────────────────────────────────────────────────────
    const infoText = (plot) => {
        const p = plot.userData.parcela;
        const label   = (window.getParcelaLabel ? getParcelaLabel(p) : null) || p?.nome || 'Parcela';
        const cultivo = window.getCultivoLabel ? getCultivoLabel(p) : '';
        const area    = Number(p?.area_m2);
        return `${label}${cultivo ? ' · 🌱 ' + cultivo : ''} · ${LABELS[plot.userData.state]}${Number.isFinite(area) ? ' · ' + area.toFixed(0) + 'm²' : ''}`;
    };

    // ── Selecionar parcela ─────────────────────────────────────────────────────
    const selectPlot = (plot) => {
        if (!plot) return;
        plots.forEach(p => { p.userData.ring.material.opacity = 0; });
        plot.userData.ring.material.opacity = 0.92;
        controls.target.set(plot.position.x, 0.5, plot.position.z);
        const infoEl = document.getElementById('farm-viz-info');
        if (infoEl) infoEl.textContent = infoText(plot);
        if (!plot.userData.active && plot.userData.state === 0) startGrow(plot, 4);
    };

    // ── Resize ─────────────────────────────────────────────────────────────────
    const resize = () => {
        const c = document.getElementById('farm-viz-container');
        if (!c || !renderer) return;
        const w = c.clientWidth, h = c.clientHeight;
        if (w < 2 || h < 2) return;
        renderer.setSize(w, h);
        if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
    };

    // ── Loop de animação ───────────────────────────────────────────────────────
    const tick = () => {
        requestAnimationFrame(tick);
        if (!renderer) return;
        const dt = Math.min(clock.getDelta(), 0.04);
        const t  = clock.elapsedTime;
        const infoEl = document.getElementById('farm-viz-info');
        plots.forEach(plot => {
            const ud = plot.userData;
            if (ud.active) {
                ud.elapsed  += dt;
                ud.state     = Math.max(ud.state, Math.min(ud.targetState, Math.floor(ud.elapsed / GROW_SEC) + 1));
                ud.progress  = Math.min(1, (ud.elapsed % GROW_SEC) / GROW_SEC);
                if (ud.state >= ud.targetState && ud.elapsed >= ud.targetState * GROW_SEC) {
                    ud.state = ud.targetState; ud.progress = 1; ud.active = false;
                }
                applyVisual(plot);
                if (ud.ring.material.opacity > 0 && infoEl) infoEl.textContent = infoText(plot);
            }
            // Balanço suave nas plantas crescidas
            if (!ud.active && ud.state >= 3) {
                [ud.plant.stem, ud.plant.leafA, ud.plant.leafB, ud.plant.leafC].forEach((m, i) => {
                    if (m.visible) m.rotation.z = Math.sin(t * 1.1 + i * 1.3) * 0.05;
                });
            }
        });
        controls.update();
        renderer.render(scene, camera);
    };

    // ── Inicialização (lazy) ───────────────────────────────────────────────────
    const init = () => {
        if (initialized) return;
        const container = document.getElementById('farm-viz-container');
        const canvas    = document.getElementById('farm-viz-canvas');
        if (!container || !canvas || typeof THREE === 'undefined') return;
        initialized = true;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);
        scene.fog = new THREE.FogExp2(0xb0d8f0, 0.014);

        const w = Math.max(container.clientWidth, 100);
        const h = Math.max(container.clientHeight, 100);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setSize(w, h);

        camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 120);
        camera.position.set(9, 13, 9);
        camera.lookAt(0, 0, 0);  // orientação explícita antes dos OrbitControls

        controls = new THREE.OrbitControls(camera, canvas);
        controls.enableDamping  = true;
        controls.dampingFactor  = 0.07;
        controls.minDistance    = 4;
        controls.maxDistance    = 26;
        controls.minPolarAngle  = Math.PI / 7;
        controls.maxPolarAngle  = Math.PI / 2.05;
        controls.target.set(0, 0.5, 0);
        controls.update();

        // Luzes
        scene.add(new THREE.HemisphereLight(0xd0f0ff, 0x6b8f5a, 0.85));
        const sun = new THREE.DirectionalLight(0xfff4d0, 1.6);
        sun.position.set(14, 22, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.left = sun.shadow.camera.bottom = -22;
        sun.shadow.camera.right = sun.shadow.camera.top  =  22;
        scene.add(sun);

        // Chão
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            lmat(0x5ca84a)
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Clique nas parcelas
        const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
        container.addEventListener('pointerdown', (e) => {
            const rect = container.getBoundingClientRect();
            pointer.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
            pointer.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            const hits = raycaster.intersectObjects(plots.map(p => p.userData.bed), false);
            if (hits.length) {
                const hit = plots.find(p => p.userData.bed === hits[0].object);
                if (hit) selectPlot(hit);
            }
        });

        clock = new THREE.Clock();
        buildGrid([]);
        tick();
        window.addEventListener('resize', () => requestAnimationFrame(resize));
    };

    // ── API pública ─────────────────────────────────────────────────────────────
    window.cocoRootFarmVisualizationShow = (parcelas, parcelaId) => {
        init();
        const ids = parcelas.map(p => window.getParcelaId ? getParcelaId(p) : String(p?.id || '')).join(',');
        if (ids !== cachedIds) { buildGrid(parcelas); cachedIds = ids; }
        const idx = parcelas.findIndex(p => (window.getParcelaId ? getParcelaId(p) : String(p?.id || '')) === parcelaId);
        selectPlot(plots[idx >= 0 ? idx : 0] || plots[0]);
        requestAnimationFrame(resize);
    };

    window.cocoRootFarmVisualizationResize = () => {
        if (!initialized) { init(); } else { requestAnimationFrame(resize); }
    };
})();

(function (root) {
  'use strict';

  var THREE = root.THREE;
  var OrbitControls = root.THREE_OrbitControls;
  var RoomEnvironment = root.THREE_RoomEnvironment;

  var MAT_W = 12.2;
  var MAT_D = 7.0;
  var MAT_H = 0.08;
  var MAT_TOP_Y = MAT_H / 2;

  var BB_W = 8.4;
  var BB_D = 4.65;
  var BB_H = 0.30;
  var BB_TOP_Y = MAT_TOP_Y + BB_H;

  var COL_STEP = 0.254;
  var COL_START_X = -((29 * COL_STEP) / 2);

  var ROW_Z = {
    TOP_POS: -1.86,
    TOP_NEG: -1.58,
    A: -1.14,
    B: -0.89,
    C: -0.64,
    D: -0.39,
    E: -0.14,
    F: 0.14,
    G: 0.39,
    H: 0.64,
    I: 0.89,
    J: 1.14,
    BOT_POS: 1.58,
    BOT_NEG: 1.86
  };

  // Pre-allocated scratch math helpers (zero GC inside render loop)
  var _projVec = new THREE.Vector3();
  var _targetCamPos = new THREE.Vector3(0, 9.6, 9.7);
  var _targetLookAt = new THREE.Vector3(0, 0.15, 0);

  function detectSoftwareGl() {
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return true;
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      var param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      var gpu = String(gl.getParameter(param) || '');
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch (e) {
      return true;
    }
  }

  function holePos(col, row) {
    var x = COL_START_X + (col - 1) * COL_STEP;
    var z = ROW_Z[row] !== undefined ? ROW_Z[row] : 0;
    return { x: x, z: z };
  }

  function makeCuttingMatTexture(maxAniso) {
    var c = document.createElement('canvas');
    c.width = 1536;
    c.height = 880;
    var ctx = c.getContext('2d');

    ctx.fillStyle = '#1E524E';
    ctx.fillRect(0, 0, c.width, c.height);

    // Subtle mat grain
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (var i = 0; i < 1800; i++) {
      ctx.fillRect((i * 73) % c.width, (i * 137) % c.height, 2, 2);
    }

    var pad = 44;
    var gx0 = pad;
    var gy0 = pad;
    var gw = c.width - pad * 2;
    var gh = c.height - pad * 2;
    var minor = gw / 40;

    // Minor grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.11)';
    ctx.lineWidth = 1.2;
    for (var x = gx0; x <= gx0 + gw + 0.5; x += minor) {
      ctx.beginPath();
      ctx.moveTo(x, gy0);
      ctx.lineTo(x, gy0 + gh);
      ctx.stroke();
    }
    for (var y = gy0; y <= gy0 + gh + 0.5; y += minor) {
      ctx.beginPath();
      ctx.moveTo(gx0, y);
      ctx.lineTo(gx0 + gw, y);
      ctx.stroke();
    }

    // Major grid lines every 5 units
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    for (var mx = 0; mx <= 40; mx += 5) {
      var px = gx0 + mx * minor;
      ctx.beginPath();
      ctx.moveTo(px, gy0);
      ctx.lineTo(px, gy0 + gh);
      ctx.stroke();
    }
    for (var my = 0; my <= 24; my += 5) {
      var py = gy0 + my * minor;
      if (py <= gy0 + gh + 1) {
        ctx.beginPath();
        ctx.moveTo(gx0, py);
        ctx.lineTo(gx0 + gw, py);
        ctx.stroke();
      }
    }

    // Outer white frame + ruler numbers
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(gx0, gy0, gw, gh);

    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.font = '700 18px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    for (var r = 0; r <= 40; r += 5) {
      ctx.fillText(String(r), gx0 + r * minor, gy0 - 12);
    }

    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso || 4;
    return tex;
  }

  function makeBreadboardTexture(maxAniso) {
    var c = document.createElement('canvas');
    c.width = 1400;
    c.height = 775;
    var ctx = c.getContext('2d');

    ctx.fillStyle = '#F7F4EC';
    ctx.fillRect(0, 0, c.width, c.height);

    function toPx(wx, wz) {
      return {
        x: ((wx + BB_W / 2) / BB_W) * c.width,
        y: ((wz + BB_D / 2) / BB_D) * c.height
      };
    }

    // Power rail stripes
    var topPosY = toPx(0, ROW_Z.TOP_POS).y;
    var topNegY = toPx(0, ROW_Z.TOP_NEG).y;
    var botPosY = toPx(0, ROW_Z.BOT_POS).y;
    var botNegY = toPx(0, ROW_Z.BOT_NEG).y;

    ctx.lineWidth = 5;
    ctx.strokeStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(58, topPosY - 22);
    ctx.lineTo(c.width - 58, topPosY - 22);
    ctx.moveTo(58, botPosY - 22);
    ctx.lineTo(c.width - 58, botPosY - 22);
    ctx.stroke();

    ctx.strokeStyle = '#2563EB';
    ctx.beginPath();
    ctx.moveTo(58, topNegY + 22);
    ctx.lineTo(c.width - 58, topNegY + 22);
    ctx.moveTo(58, botNegY + 22);
    ctx.lineTo(c.width - 58, botNegY + 22);
    ctx.stroke();

    // + and - rail signs
    ctx.font = '800 26px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#DC2626';
    ctx.fillText('+', 36, topPosY);
    ctx.fillText('+', 36, botPosY);
    ctx.fillStyle = '#2563EB';
    ctx.fillText('−', 36, topNegY);
    ctx.fillText('−', 36, botNegY);

    // Center ravine shading
    var ravTop = toPx(0, -0.095).y;
    var ravBot = toPx(0, 0.095).y;
    ctx.fillStyle = '#E5DFCE';
    ctx.fillRect(52, ravTop, c.width - 104, ravBot - ravTop);

    // Row letters
    var rowNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    ctx.font = '700 17px ui-monospace, monospace';
    ctx.fillStyle = '#64748B';
    for (var ri = 0; ri < rowNames.length; ri++) {
      var rPy = toPx(0, ROW_Z[rowNames[ri]]).y;
      ctx.fillText(rowNames[ri], 42, rPy);
      ctx.fillText(rowNames[ri], c.width - 42, rPy);
    }

    // Column numbers & dark socket squares
    var allRows = ['TOP_POS', 'TOP_NEG', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'BOT_POS', 'BOT_NEG'];
    for (var col = 1; col <= 30; col++) {
      var wx = holePos(col, 'A').x;
      var px = toPx(wx, 0).x;

      if (col === 1 || col % 5 === 0) {
        ctx.fillStyle = '#64748B';
        ctx.font = '700 16px ui-monospace, monospace';
        ctx.fillText(String(col), px, toPx(0, -1.36).y);
        ctx.fillText(String(col), px, toPx(0, 1.36).y);
      }

      for (var rIdx = 0; rIdx < allRows.length; rIdx++) {
        var rKey = allRows[rIdx];
        var py = toPx(0, ROW_Z[rKey]).y;
        ctx.fillStyle = '#222B35';
        ctx.fillRect(px - 7, py - 7, 14, 14);
        ctx.fillStyle = '#0F141A';
        ctx.fillRect(px - 4, py - 4, 8, 8);
      }
    }

    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso || 4;
    return tex;
  }

  function makeDraftingGridTexture(maxAniso, theme) {
    var isDark = theme === 'dark';
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext('2d');
    ctx.fillStyle = isDark ? '#111827' : '#F8F5EC';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = isDark ? 'rgba(241, 245, 249, 0.06)' : 'rgba(21, 34, 50, 0.055)';
    ctx.lineWidth = 1.5;
    for (var i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    tex.anisotropy = maxAniso || 4;
    return tex;
  }

  function makeChipTopTexture(label) {
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 360;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#1D242D';
    ctx.fillRect(0, 0, c.width, c.height);

    // Notch on left
    ctx.fillStyle = '#11161C';
    ctx.beginPath();
    ctx.arc(0, c.height / 2, 46, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Pin 1 dimple bottom-left
    ctx.fillStyle = '#F4B936';
    ctx.beginPath();
    ctx.arc(72, c.height - 58, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '800 84px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label || 'NE555P', c.width / 2 + 18, c.height / 2 - 22);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 32px ui-monospace, Menlo, monospace';
    ctx.fillText('TIMER IC', c.width / 2 + 18, c.height / 2 + 54);

    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeLdrTexture() {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#B91C1C';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var y = 44; y <= 212; y += 34) {
      ctx.moveTo(46, y);
      ctx.lineTo(210, y);
      if (y + 34 <= 212) {
        var dir = ((y - 44) / 34) % 2 === 0 ? 210 : 46;
        ctx.lineTo(dir, y + 34);
      }
    }
    ctx.stroke();
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createContactShadow(w, d) {
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 62);
    grad.addColorStop(0, 'rgba(10, 25, 18, 0.42)');
    grad.addColorStop(1, 'rgba(10, 25, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  function Studio3DWorkbench(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.isSoftwareGl = detectSoftwareGl();
    this.theme = 'light';
    this.currentLang = 'en';
    this.exploded = false;
    this.explodedAmount = 0;
    this.highlightedWireId = null;
    this.interactables = [];
    this.wireGroups = [];
    this.explodedTargets = [];
    this.liveLedMeshes = [];
    this.liveLedLights = [];
    this.livePotGroups = [];
    this.liveBuzzerRings = [];
    this.liveBlockMeshes = {};
    this.chipTextures = {};
    this.cutawayLid = null;
    this.labelOverlay = null;
    this.hoverTooltip = null;
    this.hoveredObject = null;
    this.hoveredAnchor = new THREE.Vector3();
    this._hoverBox = new THREE.Box3();
    this.lastAnimTime = performance.now();
    this.frameId = 0;
    this.renderBusy = false;
    this.renderDirty = false;
    this.disposed = false;
    this.lastStepMode = null;
    this.assemblyItems = [];
    this.assemblyGen = 0;

    this._init();
  }

  Studio3DWorkbench.prototype._init = function () {
    var self = this;
    var w = Math.max(320, this.container.clientWidth || 720);
    var h = Math.max(260, this.container.clientHeight || 460);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#F8F5EC');
    this.scene.fog = new THREE.Fog('#F8F5EC', 22, 48);

    this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
    this.camera.position.copy(_targetCamPos);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(root.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(w, h);

    this.renderer.domElement.className = 'workbench-webgl-canvas';
    this.renderer.domElement.setAttribute('data-testid', 'workbench-3d-canvas');
    this.container.appendChild(this.renderer.domElement);

    // Hover-only 3D tooltip overlay (no permanent floating labels)
    this.labelOverlay = document.createElement('div');
    this.labelOverlay.className = 'labels-3d-overlay';
    this.hoverTooltip = document.createElement('div');
    this.hoverTooltip.className = 'hover-component-tooltip hidden';
    this.hoverTooltip.setAttribute('data-testid', 'wb3d-hover-tooltip');
    this.labelOverlay.appendChild(this.hoverTooltip);
    this.container.appendChild(this.labelOverlay);

    // Studio Environment Reflection
    var pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmrem.dispose();

    // 3-Point Warm/Cool Studio Lighting Rig
    var hemi = new THREE.HemisphereLight('#EAF4FF', '#8F9B8E', 0.85);
    this.scene.add(hemi);

    var keyLight = new THREE.DirectionalLight('#FFF6E5', 1.45);
    keyLight.position.set(5.5, 9.5, 5.0);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -8;
      keyLight.shadow.camera.right = 8;
      keyLight.shadow.camera.top = 6;
      keyLight.shadow.camera.bottom = -6;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 24;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    var rimLight = new THREE.DirectionalLight('#DCEEFF', 0.55);
    rimLight.position.set(-6, 5, -6);
    this.scene.add(rimLight);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 18;
    this.controls.target.copy(_targetLookAt);
    this.controls.update();

    this.controls.addEventListener('change', function () {
      self._updateHoverTooltipPos();
      self.requestRender();
    });

    // Shared geometries & materials
    var maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.matTexture = makeCuttingMatTexture(maxAniso);
    this.bbTexture = makeBreadboardTexture(maxAniso);
    this.gridTextureLight = makeDraftingGridTexture(maxAniso, 'light');
    this.gridTextureDark = makeDraftingGridTexture(maxAniso, 'dark');
    this.ldrTexture = makeLdrTexture();

    this.metalMat = new THREE.MeshStandardMaterial({ color: '#3E4A59', metalness: 0.65, roughness: 0.34 });
    this.ceramicResMat = new THREE.MeshStandardMaterial({ color: '#E5CFA7', roughness: 0.65, metalness: 0.05 });

    // Drafting table + Precision ESD Mat base
    this.tableMat = new THREE.MeshStandardMaterial({ map: this.gridTextureLight, color: '#FFFFFF', roughness: 0.92, metalness: 0.0 });
    var tableMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(52, 52),
      this.tableMat
    );
    tableMesh.rotation.x = -Math.PI / 2;
    tableMesh.position.y = -0.02;
    tableMesh.receiveShadow = true;
    this.scene.add(tableMesh);

    var matGroup = new THREE.Group();
    var matSide = new THREE.MeshStandardMaterial({ color: '#143634', roughness: 0.9, metalness: 0.0 });
    var matTop = new THREE.MeshStandardMaterial({ map: this.matTexture, color: '#FFFFFF', roughness: 0.96, metalness: 0.0 });
    var matMesh = new THREE.Mesh(
      new THREE.BoxGeometry(MAT_W, MAT_H, MAT_D),
      [matSide, matSide, matTop, matSide, matSide, matSide]
    );
    matMesh.position.y = 0;
    matMesh.receiveShadow = true;
    matGroup.add(matMesh);
    var matShadow = createContactShadow(MAT_W + 0.45, MAT_D + 0.45);
    matShadow.position.y = -0.015;
    matGroup.add(matShadow);
    this.scene.add(matGroup);

    // Dynamic circuit scene root
    this.circuitRoot = new THREE.Group();
    this.scene.add(this.circuitRoot);

    // Raycasting for hover & click
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.lastRayTime = 0;
    this.downPos = { x: 0, y: 0 };

    this._onPointerDown = function (ev) {
      self.downPos.x = ev.clientX;
      self.downPos.y = ev.clientY;
    };

    this._onPointerUp = function (ev) {
      var dist = Math.hypot(ev.clientX - self.downPos.x, ev.clientY - self.downPos.y);
      if (dist > 6) return;
      self._raycastAt(ev, true);
    };

    this._onPointerMove = function (ev) {
      var now = performance.now();
      if (now - self.lastRayTime < 45) return;
      self.lastRayTime = now;
      self._raycastAt(ev, false);
    };

    this._onPointerLeave = function () {
      self._hideHoverTooltip();
      self.renderer.domElement.style.cursor = 'grab';
      if (self.callbacks.onHoverTarget) {
        self.callbacks.onHoverTarget(null);
      }
    };

    this.renderer.domElement.addEventListener('pointerdown', this._onPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this._onPointerUp);
    this.renderer.domElement.addEventListener('pointermove', this._onPointerMove);
    this.renderer.domElement.addEventListener('pointerleave', this._onPointerLeave);

    this.renderer.domElement.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
    });

    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(function () {
        self.resize();
      });
      this._ro.observe(this.container);
    }
  };

  Studio3DWorkbench.prototype.setTheme = function (theme) {
    this.theme = theme === 'dark' ? 'dark' : 'light';
    var bgHex = this.theme === 'dark' ? '#111827' : '#F8F5EC';
    if (this.scene) {
      this.scene.background.set(bgHex);
      if (this.scene.fog) this.scene.fog.color.set(bgHex);
    }
    if (this.tableMat) {
      this.tableMat.map = this.theme === 'dark' ? this.gridTextureDark : this.gridTextureLight;
      this.tableMat.needsUpdate = true;
    }
    this.requestRender();
  };

  Studio3DWorkbench.prototype._showHoverTooltip = function (meta, obj) {
    if (!this.hoverTooltip || !obj) return;
    var rawText = meta.label || meta.wireId || '';
    var text = this._trLabel(rawText, this.currentLang);
    if (!text) {
      this._hideHoverTooltip();
      return;
    }
    this.hoveredObject = obj;
    this._hoverBox.setFromObject(obj);
    if (this._hoverBox.isEmpty()) {
      obj.getWorldPosition(this.hoveredAnchor);
      this.hoveredAnchor.y += 0.25;
    } else {
      this.hoveredAnchor.set(
        (this._hoverBox.min.x + this._hoverBox.max.x) / 2,
        this._hoverBox.max.y + 0.14,
        (this._hoverBox.min.z + this._hoverBox.max.z) / 2
      );
    }
    this.hoverTooltip.textContent = text;
    this.hoverTooltip.classList.remove('hidden');
    this._updateHoverTooltipPos();
  };

  Studio3DWorkbench.prototype._hideHoverTooltip = function () {
    this.hoveredObject = null;
    if (this.hoverTooltip) {
      this.hoverTooltip.classList.add('hidden');
    }
  };

  Studio3DWorkbench.prototype._updateHoverTooltipPos = function () {
    if (!this.hoverTooltip || !this.hoveredObject || this.hoverTooltip.classList.contains('hidden')) return;
    var w = this.container.clientWidth || 720;
    var h = this.container.clientHeight || 460;
    _projVec.copy(this.hoveredAnchor).project(this.camera);
    if (_projVec.z > 1) {
      this.hoverTooltip.classList.add('hidden');
      return;
    }
    var sx = Math.max(48, Math.min(w - 48, ((_projVec.x + 1) / 2) * w));
    var sy = Math.max(28, Math.min(h - 24, ((-_projVec.y + 1) / 2) * h));
    this.hoverTooltip.style.transform = 'translate(' + Math.round(sx) + 'px, ' + Math.round(sy) + 'px) translate(-50%, -100%)';
  };

  Studio3DWorkbench.prototype._raycastAt = function (ev, isClick) {
    if (!this.interactables.length) return;
    var rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    var hits = this.raycaster.intersectObjects(this.interactables, true);
    if (hits.length > 0) {
      var obj = hits[0].object;
      while (obj && !obj.userData.interactiveMeta && obj.parent) {
        obj = obj.parent;
      }
      var meta = obj && obj.userData ? obj.userData.interactiveMeta : null;
      if (meta) {
        this.renderer.domElement.style.cursor = 'pointer';
        if (isClick && this.callbacks.onClickTarget) {
          this.callbacks.onClickTarget(meta);
        } else if (!isClick) {
          this._showHoverTooltip(meta, obj);
          if (this.callbacks.onHoverTarget) {
            this.callbacks.onHoverTarget(meta);
          }
        }
        return;
      }
    }
    this.renderer.domElement.style.cursor = 'grab';
    if (!isClick) {
      this._hideHoverTooltip();
      if (this.callbacks.onHoverTarget) {
        this.callbacks.onHoverTarget(null);
      }
    }
  };

  Studio3DWorkbench.prototype.resize = function () {
    if (this.disposed || !this.container) return;
    var w = Math.max(300, this.container.clientWidth);
    var h = Math.max(240, this.container.clientHeight);
    var aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1.25 ? Math.min(56, 36 * (1.25 / Math.max(0.68, aspect))) : 36;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this._updateHoverTooltipPos();
    this.requestRender();
  };

  Studio3DWorkbench.prototype.zoomBy = function (factor) {
    var offset = this.camera.position.clone().sub(this.controls.target);
    offset.multiplyScalar(factor);
    var len = offset.length();
    if (len < this.controls.minDistance) offset.setLength(this.controls.minDistance);
    if (len > this.controls.maxDistance) offset.setLength(this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
    this._updateHoverTooltipPos();
    this.requestRender();
  };

  Studio3DWorkbench.prototype._getPresetForMode = function (mode) {
    if (mode === 'pinout') {
      return {
        pos: new THREE.Vector3(0, 9.6, 9.7),
        look: new THREE.Vector3(0, 0.15, 0)
      };
    }
    if (mode === 'block') {
      return {
        pos: new THREE.Vector3(0.15, 6.2, 5.8),
        look: new THREE.Vector3(0.15, 0.25, 0)
      };
    }
    return {
      pos: new THREE.Vector3(-0.35, 7.6, 7.4),
      look: new THREE.Vector3(0.15, 0.22, 0)
    };
  };

  Studio3DWorkbench.prototype.resetCamera = function () {
    var preset = this._getPresetForMode(this.lastStepMode);
    this.camera.position.copy(preset.pos);
    this.controls.target.copy(preset.look);
    this.controls.update();
    this._updateHoverTooltipPos();
    this.requestRender();
  };

  Studio3DWorkbench.prototype.setExploded = function (flag) {
    this.exploded = Boolean(flag);
    this.assemblyGen++;
    for (var i = 0; i < this.assemblyItems.length; i++) {
      this.assemblyItems[i].obj.visible = true;
    }
    this.lastAnimTime = performance.now();
    this.startTransitionLoop();
  };

  Studio3DWorkbench.prototype.startTransitionLoop = function () {
    var self = this;
    function step() {
      if (self.disposed) return;
      var now = performance.now();
      var dt = Math.min(0.05, Math.max(0.008, (now - self.lastAnimTime) / 1000));
      self.lastAnimTime = now;
      var target = self.exploded ? 1 : 0;
      self.explodedAmount = THREE.MathUtils.damp(self.explodedAmount, target, 8, dt);

      for (var i = 0; i < self.explodedTargets.length; i++) {
        var t = self.explodedTargets[i];
        t.obj.position.y = t.baseY + t.lift * self.explodedAmount;
      }
      if (self.cutawayLid) {
        self.cutawayLid.position.y = self.cutawayLid.userData.baseY + (0.65 + 0.75 * self.explodedAmount);
      }

      self._updateHoverTooltipPos();
      self.requestRender();

      if (Math.abs(self.explodedAmount - target) > 0.005) {
        if (self.isSoftwareGl) {
          self._afterDraw(step);
        } else {
          requestAnimationFrame(step);
        }
      } else {
        self.explodedAmount = target;
      }
    }
    step();
  };

  Studio3DWorkbench.prototype._afterDraw = function (cb) {
    var gl = this.renderer.getContext();
    var self = this;
    if (gl && typeof gl.fenceSync === 'function') {
      var sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      var poll = function () {
        if (self.disposed) return;
        var status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          setTimeout(cb, 65);
        }
      };
      setTimeout(poll, 5);
    } else {
      setTimeout(cb, 80);
    }
  };

  Studio3DWorkbench.prototype.requestRender = function () {
    var self = this;
    if (this.disposed) return;
    if (this.renderBusy) {
      this.renderDirty = true;
      return;
    }
    this.renderBusy = true;
    this.frameId = requestAnimationFrame(function () {
      if (self.disposed) return;
      self.renderDirty = false;
      if (self.controls && self.controls.enableDamping) {
        self.controls.update();
      }
      self.renderer.render(self.scene, self.camera);
      var done = function () {
        self.renderBusy = false;
        if (self.renderDirty) self.requestRender();
      };
      if (self.isSoftwareGl) {
        self._afterDraw(done);
      } else {
        done();
      }
    });
  };

  Studio3DWorkbench.prototype._clearCircuit = function () {
    this.assemblyGen++;
    while (this.circuitRoot.children.length > 0) {
      var child = this.circuitRoot.children[0];
      this.circuitRoot.remove(child);
    }
    this.interactables = [];
    this.wireGroups = [];
    this.explodedTargets = [];
    this.assemblyItems = [];
    this.liveLedMeshes = [];
    this.liveLedLights = [];
    this.livePotGroups = [];
    this.liveBuzzerRings = [];
    this.liveBlockMeshes = {};
    this.cutawayLid = null;
    this._hideHoverTooltip();
  };

  Studio3DWorkbench.prototype._registerLabel = function () {
    // Labels appear strictly on mouse hover via _showHoverTooltip
  };

  Studio3DWorkbench.prototype.updateProjectedLabels = function () {
    this._updateHoverTooltipPos();
  };

  Studio3DWorkbench.prototype.setShowLabels = function () {
    // Tooltips appear only when hovering a component
  };

  Studio3DWorkbench.prototype._buildBreadboardMesh = function () {
    var g = new THREE.Group();
    var sideMat = new THREE.MeshStandardMaterial({ color: '#E8E3D3', roughness: 0.55, metalness: 0.02 });
    var topMat = new THREE.MeshStandardMaterial({ map: this.bbTexture, color: '#FFFFFF', roughness: 0.42, metalness: 0.02 });
    var board = new THREE.Mesh(
      new THREE.BoxGeometry(BB_W, BB_H, BB_D),
      [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]
    );
    board.position.y = MAT_TOP_Y + BB_H / 2;
    board.castShadow = true;
    board.receiveShadow = true;
    g.add(board);

    // Subtle recessed central channel
    var ch = new THREE.Mesh(
      new THREE.BoxGeometry(BB_W - 0.56, 0.03, 0.16),
      new THREE.MeshStandardMaterial({ color: '#DCD5C2', roughness: 0.7 })
    );
    ch.position.y = BB_TOP_Y - 0.005;
    g.add(ch);

    // Power rail jumper bridge on col 2 and col 3
    var topPos2 = holePos(2, 'TOP_POS');
    var botPos2 = holePos(2, 'BOT_POS');
    this._addWireCurve(g, topPos2.x, BB_TOP_Y, topPos2.z, botPos2.x, BB_TOP_Y, botPos2.z, '#DC2626', 0.34, 'rail-pos');
    var topNeg3 = holePos(3, 'TOP_NEG');
    var botNeg3 = holePos(3, 'BOT_NEG');
    this._addWireCurve(g, topNeg3.x, BB_TOP_Y, topNeg3.z, botNeg3.x, BB_TOP_Y, botNeg3.z, '#1F2937', 0.34, 'rail-neg');

    return g;
  };

  Studio3DWorkbench.prototype._buildDip555Group = function (icType, scale) {
    var s = scale || 1;
    var g = new THREE.Group();

    var bodyW = 0.96 * s;
    var bodyH = 0.24 * s;
    var bodyD = 0.54 * s;
    var chipKey = icType === 'TLC555' ? 'TLC555' : 'NE555P';
    if (!this.chipTextures[chipKey]) {
      this.chipTextures[chipKey] = makeChipTopTexture(chipKey);
    }
    var sideMat = new THREE.MeshStandardMaterial({ color: '#181E26', roughness: 0.55, metalness: 0.08 });
    var topMat = new THREE.MeshStandardMaterial({
      map: this.chipTextures[chipKey],
      color: '#FFFFFF',
      roughness: 0.42,
      metalness: 0.08
    });

    var body = new THREE.Mesh(
      new THREE.BoxGeometry(bodyW, bodyH, bodyD),
      [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]
    );
    body.position.y = 0.22 * s;
    body.castShadow = true;
    body.userData.interactiveMeta = { partId: 'ic-555', wireId: 'part-ic-555', label: (icType || 'NE555P') + ' timer IC' };
    g.add(body);
    this.interactables.push(body);

    // 8 gull-wing metal legs
    for (var i = 0; i < 4; i++) {
      var lx = (-1.5 + i) * COL_STEP * s;
      // Top side pins (8,7,6,5)
      var pinTopNum = 8 - i;
      var legT = this._makeGullLeg(s, -1);
      legT.position.set(lx, 0.19 * s, -bodyD / 2);
      legT.userData.interactiveMeta = { pin: pinTopNum, wireId: 'pin-' + pinTopNum, label: 'Pin ' + pinTopNum };
      g.add(legT);
      this.interactables.push(legT);

      // Bottom side pins (1,2,3,4)
      var pinBotNum = 1 + i;
      var legB = this._makeGullLeg(s, 1);
      legB.position.set(lx, 0.19 * s, bodyD / 2);
      legB.userData.interactiveMeta = { pin: pinBotNum, wireId: 'pin-' + pinBotNum, label: 'Pin ' + pinBotNum };
      g.add(legB);
      this.interactables.push(legB);
    }

    return g;
  };

  Studio3DWorkbench.prototype._makeGullLeg = function (s, zDir) {
    var pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, zDir * 0.05 * s),
      new THREE.Vector3(0, -0.22 * s, zDir * 0.05 * s)
    ];
    var curve = new THREE.CatmullRomCurve3(pts);
    var geo = new THREE.TubeGeometry(curve, 8, 0.022 * s, 6, false);
    var mesh = new THREE.Mesh(geo, this.metalMat);
    mesh.castShadow = true;
    return mesh;
  };

  Studio3DWorkbench.prototype._addWireCurve = function (parent, x1, y1, z1, x2, y2, z2, colorHex, liftHeight, wireId) {
    var dist = Math.hypot(x2 - x1, z2 - z1);
    var arch = Math.min(0.62, Math.max(0.20, dist * 0.24));

    // Check if breadboard jumper would cross over or under the DIP-8 555 body (Cols 13..16, Z across ravine)
    var icMinX = holePos(13, 'E').x - 0.24;
    var icMaxX = holePos(16, 'E').x + 0.24;
    var icCenterX = (holePos(14, 'E').x + holePos(15, 'E').x) / 2;
    var crossesRavine = Math.min(z1, z2) < 0.28 && Math.max(z1, z2) > -0.28;
    var overlapsIcX = Math.max(x1, x2) > icMinX && Math.min(x1, x2) < icMaxX;
    var onBreadboard = Math.abs(y1 - BB_TOP_Y) < 0.05;

    var pts;
    if (onBreadboard && crossesRavine && overlapsIcX) {
      var avgX = (x1 + x2) / 2;
      var detourX = avgX <= icCenterX ? holePos(12, 'E').x - 0.02 : holePos(17, 'E').x + 0.02;
      var detourArch = Math.min(0.44, Math.max(0.22, dist * 0.18));
      pts = [
        new THREE.Vector3(x1, y1 - 0.04, z1),
        new THREE.Vector3(x1, y1 + 0.08, z1),
        new THREE.Vector3(x1 + (detourX - x1) * 0.72, y1 + detourArch * 0.72, z1 * 0.72),
        new THREE.Vector3(detourX, y1 + detourArch, (z1 + z2) * 0.5),
        new THREE.Vector3(x2 + (detourX - x2) * 0.72, y2 + detourArch * 0.72, z2 * 0.72),
        new THREE.Vector3(x2, y2 + 0.08, z2),
        new THREE.Vector3(x2, y2 - 0.04, z2)
      ];
    } else {
      pts = [
        new THREE.Vector3(x1, y1 - 0.04, z1),
        new THREE.Vector3(x1, y1 + 0.08, z1),
        new THREE.Vector3(x1 + (x2 - x1) * 0.14, y1 + arch * 0.85, z1 + (z2 - z1) * 0.14),
        new THREE.Vector3((x1 + x2) / 2, y1 + arch, (z1 + z2) / 2),
        new THREE.Vector3(x2 - (x2 - x1) * 0.14, y2 + arch * 0.85, z2 - (z2 - z1) * 0.14),
        new THREE.Vector3(x2, y2 + 0.08, z2),
        new THREE.Vector3(x2, y2 - 0.04, z2)
      ];
    }

    var curve = new THREE.CatmullRomCurve3(pts);
    var geo = new THREE.TubeGeometry(curve, 26, 0.028, 8, false);
    var mat = new THREE.MeshStandardMaterial({ color: colorHex || '#E87722', roughness: 0.42, metalness: 0.05 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    var grp = new THREE.Group();
    grp.add(mesh);

    // Stripped dark-steel tips entering sockets vertically
    var tipGeo = new THREE.CylinderGeometry(0.020, 0.020, 0.10, 6);
    var t1 = new THREE.Mesh(tipGeo, this.metalMat);
    t1.position.set(x1, y1 - 0.01, z1);
    var t2 = new THREE.Mesh(tipGeo, this.metalMat);
    t2.position.set(x2, y2 - 0.01, z2);
    grp.add(t1, t2);

    if (wireId) {
      grp.userData.wireId = wireId;
      grp.userData.interactiveMeta = { wireId: wireId, label: wireId };
      this.wireGroups.push(grp);
      this.interactables.push(grp);
    }

    if (liftHeight) {
      this.explodedTargets.push({ obj: grp, baseY: grp.position.y, lift: liftHeight });
    }

    parent.add(grp);
    return grp;
  };

  Studio3DWorkbench.prototype._buildStraightAxialLeads = function (g, x1, y1, z1, x2, y2, z2, bodyY, radius) {
    var r = radius || 0.021;
    var h1 = (bodyY - (y1 - 0.04));
    var h2 = (bodyY - (y2 - 0.04));
    var l1 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h1, 8), this.metalMat);
    l1.position.set(x1, (y1 - 0.04) + h1 / 2, z1);
    l1.castShadow = true;
    var l2 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h2, 8), this.metalMat);
    l2.position.set(x2, (y2 - 0.04) + h2 / 2, z2);
    l2.castShadow = true;

    var elbowGeo = new THREE.SphereGeometry(r * 1.15, 8, 8);
    var e1 = new THREE.Mesh(elbowGeo, this.metalMat);
    e1.position.set(x1, bodyY, z1);
    var e2 = new THREE.Mesh(elbowGeo, this.metalMat);
    e2.position.set(x2, bodyY, z2);

    var dx = x2 - x1;
    var dz = z2 - z1;
    var len = Math.hypot(dx, dz);
    var yaw = Math.atan2(dx, dz);
    var span = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), this.metalMat);
    span.position.set((x1 + x2) / 2, bodyY, (z1 + z2) / 2);
    span.rotation.order = 'YXZ';
    span.rotation.y = yaw;
    span.rotation.x = Math.PI / 2;
    span.castShadow = true;

    g.add(l1, l2, e1, e2, span);
  };

  Studio3DWorkbench.prototype._buildResistorMesh = function (x1, y1, z1, x2, y2, z2, ohms, wireId) {
    var g = new THREE.Group();
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;
    var dx = x2 - x1;
    var dz = z2 - z1;
    var len = Math.hypot(dx, dz);
    var yaw = Math.atan2(dx, dz);
    var bodyY = y1 + 0.19;

    // Exact straight orthogonal leads (never bulge or protrude outside holes)
    this._buildStraightAxialLeads(g, x1, y1, z1, x2, y2, z2, bodyY, 0.021);

    // Ceramic body + 4 EIA color bands clamped strictly inside lead span
    var bodyGroup = new THREE.Group();
    bodyGroup.position.set(mx, bodyY, mz);
    bodyGroup.rotation.y = yaw;

    var bodyLen = Math.min(0.42, Math.max(0.20, len * 0.54));
    if (bodyLen > len - 0.12) {
      bodyLen = Math.max(0.16, len - 0.12);
    }
    var bodyCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.068, bodyLen, 14),
      this.ceramicResMat
    );
    bodyCyl.rotation.x = Math.PI / 2;
    bodyCyl.castShadow = true;
    bodyGroup.add(bodyCyl);

    // Rounded ceramic end bells
    var capGeo = new THREE.SphereGeometry(0.075, 12, 10);
    var c1 = new THREE.Mesh(capGeo, this.ceramicResMat);
    c1.position.z = -bodyLen / 2;
    var c2 = new THREE.Mesh(capGeo, this.ceramicResMat);
    c2.position.z = bodyLen / 2;
    bodyGroup.add(c1, c2);

    var bands = root.Math555.getResistorBands(ohms);
    var offsets = [-0.28, -0.1, 0.08, 0.28];
    for (var b = 0; b < 4; b++) {
      var ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.072, 0.072, 0.032, 14),
        new THREE.MeshStandardMaterial({ color: bands[b].hex, roughness: 0.45 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.z = offsets[b] * bodyLen;
      bodyGroup.add(ring);
    }

    g.add(bodyGroup);
    g.userData.wireId = wireId || '';
    g.userData.interactiveMeta = { wireId: wireId || '', partId: 'resistors', label: root.Math555.formatResistance(ohms) };
    if (wireId) this.wireGroups.push(g);
    this.interactables.push(g);
    this.explodedTargets.push({ obj: g, baseY: 0, lift: 0.55 });
    return g;
  };

  Studio3DWorkbench.prototype._addLeadSegment = function (g, ax, ay, az, bx, by, bz, r) {
    var vA = new THREE.Vector3(ax, ay, az);
    var vB = new THREE.Vector3(bx, by, bz);
    var diff = vB.clone().sub(vA);
    var len = diff.length();
    if (len < 0.0005) return;
    var cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), this.metalMat);
    cyl.position.copy(vA).add(vB).multiplyScalar(0.5);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.normalize());
    cyl.castShadow = true;
    g.add(cyl);
  };

  Studio3DWorkbench.prototype._buildRadialCapLeads = function (g, x1, y1, z1, x2, y2, z2, entryOffset, bendY, topY, radius) {
    var r = radius || 0.019;
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;
    var dx = x2 - x1;
    var dz = z2 - z1;
    var dist = Math.hypot(dx, dz) || 0.001;
    var ux = dx / dist;
    var uz = dz / dist;
    var off = Math.min(entryOffset, dist * 0.42);
    var shoulderY = bendY + 0.055;

    var endpoints = [
      { sx: x1, sy: y1, sz: z1, ex: mx - ux * off, ez: mz - uz * off },
      { sx: x2, sy: y2, sz: z2, ex: mx + ux * off, ez: mz + uz * off }
    ];
    var jointGeo = new THREE.SphereGeometry(r * 1.15, 8, 8);

    for (var i = 0; i < 2; i++) {
      var ep = endpoints[i];
      // 1. Vertical stem out of breadboard socket
      this._addLeadSegment(g, ep.sx, ep.sy - 0.04, ep.sz, ep.sx, bendY, ep.sz, r);
      var j1 = new THREE.Mesh(jointGeo, this.metalMat);
      j1.position.set(ep.sx, bendY, ep.sz);
      g.add(j1);
      // 2. Angled radial shoulder inward directly under the component base
      this._addLeadSegment(g, ep.sx, bendY, ep.sz, ep.ex, shoulderY, ep.ez, r);
      var j2 = new THREE.Mesh(jointGeo, this.metalMat);
      j2.position.set(ep.ex, shoulderY, ep.ez);
      g.add(j2);
      // 3. Vertical stem entering straight into the underside of the component body
      this._addLeadSegment(g, ep.ex, shoulderY, ep.ez, ep.ex, topY, ep.ez, r);
    }
  };

  Studio3DWorkbench.prototype._buildElecCapMesh = function (x1, y1, z1, x2, y2, z2, wireId) {
    var g = new THREE.Group();
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;
    var yaw = Math.atan2(x2 - x1, z2 - z1);

    // Continuous radial leads bent cleanly into the bottom rubber seal
    this._buildRadialCapLeads(g, x1, y1, z1, x2, y2, z2, 0.068, y1 + 0.055, y1 + 0.19, 0.019);

    var bodyGrp = new THREE.Group();
    bodyGrp.position.set(mx, y1 + 0.37, mz);
    bodyGrp.rotation.y = yaw;

    // Dark rubber bottom bung seal
    var bung = new THREE.Mesh(
      new THREE.CylinderGeometry(0.152, 0.152, 0.025, 20),
      new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.75 })
    );
    bung.position.y = -0.205;
    bodyGrp.add(bung);

    // Cylinder jacket
    var sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.42, 20),
      new THREE.MeshStandardMaterial({ color: '#1E3A8A', roughness: 0.35, metalness: 0.2 })
    );
    sleeve.castShadow = true;
    bodyGrp.add(sleeve);

    // Brushed aluminum top disk
    var topDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.145, 0.02, 20),
      new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.25, metalness: 0.85 })
    );
    topDisk.position.y = 0.215;
    bodyGrp.add(topDisk);

    // Negative polarity stripe oriented directly toward negative lead (x2, z2)
    var stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.38, 0.04),
      new THREE.MeshStandardMaterial({ color: '#93C5FD', roughness: 0.5 })
    );
    stripe.position.set(0, 0, 0.145);
    bodyGrp.add(stripe);

    g.add(bodyGrp);

    g.userData.wireId = wireId || '';
    g.userData.interactiveMeta = { wireId: wireId || '', partId: 'cap-elec', label: 'Electrolytic Cap' };
    if (wireId) this.wireGroups.push(g);
    this.interactables.push(g);
    this.explodedTargets.push({ obj: g, baseY: 0, lift: 0.72 });
    return g;
  };

  Studio3DWorkbench.prototype._buildCeramicCapMesh = function (x1, y1, z1, x2, y2, z2, wireId) {
    var g = new THREE.Group();
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;
    var yaw = Math.atan2(x2 - x1, z2 - z1);

    // Continuous radial leads entering straight into the bottom edge of the ceramic disc
    this._buildRadialCapLeads(g, x1, y1, z1, x2, y2, z2, 0.055, y1 + 0.045, y1 + 0.17, 0.017);

    var discGrp = new THREE.Group();
    discGrp.position.set(mx, y1 + 0.23, mz);
    discGrp.rotation.y = yaw + Math.PI / 2;

    var disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.115, 0.07, 18),
      new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.28, metalness: 0.05 })
    );
    disc.rotation.x = Math.PI / 2;
    disc.castShadow = true;
    discGrp.add(disc);
    g.add(discGrp);

    g.userData.wireId = wireId || '';
    g.userData.interactiveMeta = { wireId: wireId || '', partId: 'cap-ceramic', label: 'Ceramic Cap 10 nF' };
    if (wireId) this.wireGroups.push(g);
    this.interactables.push(g);
    this.explodedTargets.push({ obj: g, baseY: 0, lift: 0.6 });
    return g;
  };

  Studio3DWorkbench.prototype._buildDiodeMesh = function (x1, y1, z1, x2, y2, z2, wireId) {
    var g = new THREE.Group();
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;
    var yaw = Math.atan2(x2 - x1, z2 - z1);
    var bodyY = y1 + 0.16;

    this._buildStraightAxialLeads(g, x1, y1, z1, x2, y2, z2, bodyY, 0.019);

    var dg = new THREE.Group();
    dg.position.set(mx, bodyY, mz);
    dg.rotation.y = yaw;
    dg.add(new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: '#EA580C', roughness: 0.2, metalness: 0.1 })
    ));
    dg.children[0].rotation.x = Math.PI / 2;
    var cathode = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.045, 12),
      new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.4 })
    );
    cathode.rotation.x = Math.PI / 2;
    cathode.position.z = 0.075;
    dg.add(cathode);
    g.add(dg);

    g.userData.wireId = wireId || '';
    g.userData.interactiveMeta = { wireId: wireId || '', partId: 'diode', label: '1N4148 Diode' };
    if (wireId) this.wireGroups.push(g);
    this.interactables.push(g);
    this.explodedTargets.push({ obj: g, baseY: 0, lift: 0.52 });
    return g;
  };

  Studio3DWorkbench.prototype._buildLedMesh = function (x1, y1, z1, x2, y2, z2, colorHex, wireId, sinkLed, id) {
    var g = new THREE.Group();
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;

    var l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 6), this.metalMat);
    l1.position.set(x1, y1 + 0.08, z1);
    var l2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 6), this.metalMat);
    l2.position.set(x2, y1 + 0.08, z2);
    g.add(l1, l2);

    var ledMat = new THREE.MeshStandardMaterial({
      color: colorHex || '#EF4444',
      emissive: colorHex || '#EF4444',
      emissiveIntensity: 0.2,
      roughness: 0.18,
      metalness: 0.05
    });

    var baseRim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 20), ledMat);
    baseRim.position.set(mx, y1 + 0.21, mz);
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.18, 20), ledMat);
    shaft.position.set(mx, y1 + 0.32, mz);
    var dome = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), ledMat);
    dome.position.set(mx, y1 + 0.41, mz);
    shaft.castShadow = true;
    g.add(baseRim, shaft, dome);

    ledMat.userData = { sinkLed: Boolean(sinkLed), id: id || 'led1' };
    this.liveLedMeshes.push(ledMat);

    // Local point light (subtle, unshadowed, per budget)
    if (!this.isSoftwareGl) {
      var pt = new THREE.PointLight(colorHex || '#EF4444', 0, 1.8, 2);
      pt.position.set(mx, y1 + 0.5, mz);
      pt.userData = { sinkLed: Boolean(sinkLed) };
      g.add(pt);
      this.liveLedLights.push(pt);
    }

    g.userData.wireId = wireId || '';
    g.userData.interactiveMeta = { wireId: wireId || '', partId: 'leds', label: '5mm LED' };
    if (wireId) this.wireGroups.push(g);
    this.interactables.push(g);
    this.explodedTargets.push({ obj: g, baseY: 0, lift: 0.8 });
    return g;
  };

  Studio3DWorkbench.prototype._buildButtonMesh = function (x1, y1, z1, x2, y2, z2, role, wireId) {
    var g = new THREE.Group();
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;

    var base = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.14, 0.46),
      new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.55 })
    );
    base.position.set(mx, y1 + 0.10, mz);
    base.castShadow = true;

    var plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.03, 0.48),
      this.metalMat
    );
    plate.position.set(mx, y1 + 0.175, mz);

    var capColor = role === 'reset' ? '#2563EB' : '#F4B936';
    var cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.14, 0.12, 18),
      new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.35 })
    );
    cap.position.set(mx, y1 + 0.24, mz);
    cap.castShadow = true;

    g.add(base, plate, cap);
    g.userData.wireId = wireId || '';
    g.userData.interactiveMeta = { wireId: wireId || '', partId: 'button', btnRole: role || 'trigger', label: 'Tactile Button (' + (role || 'trigger') + ')' };
    if (wireId) this.wireGroups.push(g);
    this.interactables.push(g);
    this.explodedTargets.push({ obj: g, baseY: 0, lift: 0.68 });
    return g;
  };

  Studio3DWorkbench.prototype._buildPotMesh = function (x1, y1, z1, x2, y2, z2, potRatio, wireId) {
    var g = new THREE.Group();
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;

    var housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.28, 0.58),
      new THREE.MeshStandardMaterial({ color: '#1D4ED8', roughness: 0.45 })
    );
    housing.position.set(mx, y1 + 0.17, mz);
    housing.castShadow = true;

    var dialGroup = new THREE.Group();
    dialGroup.position.set(mx, y1 + 0.34, mz);
    var dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.12, 22),
      new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.32, metalness: 0.15 })
    );
    var ptr = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.14, 0.18),
      new THREE.MeshStandardMaterial({ color: '#152232', roughness: 0.4 })
    );
    ptr.position.z = -0.07;
    dialGroup.add(dial, ptr);
    dialGroup.rotation.y = -((Number(potRatio || 0.5) - 0.5) * 4.2);

    g.add(housing, dialGroup);
    this.livePotGroups.push(dialGroup);
    g.userData.wireId = wireId || '';
    g.userData.interactiveMeta = { wireId: wireId || '', partId: 'pot', label: '50 kΩ Potentiometer' };
    if (wireId) this.wireGroups.push(g);
    this.interactables.push(g);
    this.explodedTargets.push({ obj: g, baseY: 0, lift: 0.72 });
    return g;
  };

  Studio3DWorkbench.prototype._buildBuzzerMesh = function (x1, y1, z1, x2, y2, z2, wireId) {
    var g = new THREE.Group();
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;

    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.32, 24),
      new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.48 })
    );
    body.position.set(mx, y1 + 0.19, mz);
    body.castShadow = true;

    var aperture = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10, 0.10, 0.03, 18),
      new THREE.MeshStandardMaterial({ color: '#CBD5E1', metalness: 0.85, roughness: 0.25 })
    );
    aperture.position.set(mx, y1 + 0.355, mz);

    var waveRingMat = new THREE.MeshBasicMaterial({ color: '#F4B936', transparent: true, opacity: 0.1, side: THREE.DoubleSide });
    var waveRing = new THREE.Mesh(new THREE.RingGeometry(0.40, 0.45, 28), waveRingMat);
    waveRing.rotation.x = -Math.PI / 2;
    waveRing.position.set(mx, y1 + 0.36, mz);
    this.liveBuzzerRings.push(waveRingMat);

    g.add(body, aperture, waveRing);
    g.userData.wireId = wireId || '';
    g.userData.interactiveMeta = { wireId: wireId || '', partId: 'buzzer', label: '5V Piezo Buzzer' };
    if (wireId) this.wireGroups.push(g);
    this.interactables.push(g);
    this.explodedTargets.push({ obj: g, baseY: 0, lift: 0.75 });
    return g;
  };

  Studio3DWorkbench.prototype._buildLdrMesh = function (x1, y1, z1, x2, y2, z2, wireId) {
    var g = new THREE.Group();
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;

    var l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6), this.metalMat);
    l1.position.set(x1, y1 + 0.07, z1);
    var l2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6), this.metalMat);
    l2.position.set(x2, y1 + 0.07, z2);
    g.add(l1, l2);

    var discSide = new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.45 });
    var discTop = new THREE.MeshStandardMaterial({ map: this.ldrTexture, roughness: 0.3 });
    var disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.20, 0.08, 20),
      [discSide, discTop, discSide]
    );
    disc.position.set(mx, y1 + 0.22, mz);
    disc.castShadow = true;
    g.add(disc);

    g.userData.wireId = wireId || '';
    g.userData.interactiveMeta = { wireId: wireId || '', partId: 'ldr', label: 'CdS Photoresistor (LDR)' };
    if (wireId) this.wireGroups.push(g);
    this.interactables.push(g);
    this.explodedTargets.push({ obj: g, baseY: 0, lift: 0.62 });
    return g;
  };

  Studio3DWorkbench.prototype._trLabel = function (text, lang) {
    return root.I18n555 ? root.I18n555.translateLabel3d(text, lang) : text;
  };

  Studio3DWorkbench.prototype._buildStep1PartsMat = function (state) {
    var lang = state.lang || 'en';
    var self = this;
    function markPartGroup(obj, partId, labelText, wireOverride) {
      var wid = wireOverride || ('part-' + partId);
      obj.userData.wireId = wid;
      obj.userData.interactiveMeta = { wireId: wid, partId: partId, label: labelText };
      self.wireGroups.push(obj);
      self.interactables.push(obj);
    }

    // Precision symmetric Lab Pinout Bench layout (center hero IC + bottom breadboard, left/right component wings)
    // Center-Top Hero NE555/TLC555 DIP-8 IC
    var heroIc = this._buildDip555Group(state.icType, 1.95);
    heroIc.position.set(0, MAT_TOP_Y + 0.04, -1.55);
    var icShadow = createContactShadow(2.6, 1.6);
    icShadow.position.set(0, MAT_TOP_Y + 0.005, -1.55);
    this.circuitRoot.add(icShadow);
    this.circuitRoot.add(heroIc);
    this.explodedTargets.push({ obj: heroIc, baseY: MAT_TOP_Y + 0.04, lift: 1.05 });
    var icLbl = this._trLabel((state.icType || 'NE555') + ' timer IC', lang);
    markPartGroup(heroIc, 'ic-555', icLbl);
    heroIc.traverse(function (child) {
      if (child.userData && child.userData.interactiveMeta) {
        child.userData.interactiveMeta.partId = 'ic-555';
        if (!child.userData.interactiveMeta.pin) {
          child.userData.interactiveMeta.label = icLbl;
        }
      }
    });

    // Center-Bottom 400-pt Breadboard
    var bb = new THREE.Group();
    var sideMat = new THREE.MeshStandardMaterial({ color: '#E8E3D3', roughness: 0.55 });
    var topMat = new THREE.MeshStandardMaterial({ map: this.bbTexture, color: '#FFFFFF', roughness: 0.42 });
    var bbMesh = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.24, 2.35), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
    bbMesh.position.set(0, MAT_TOP_Y + 0.12, 1.25);
    bbMesh.castShadow = true;
    bb.add(bbMesh);
    var bbShadow = createContactShadow(4.9, 2.55);
    bbShadow.position.set(0, MAT_TOP_Y + 0.005, 1.25);
    this.circuitRoot.add(bbShadow);
    this.circuitRoot.add(bb);
    this.explodedTargets.push({ obj: bb, baseY: 0, lift: 0.45 });
    var bbLbl = this._trLabel('400-pt breadboard', lang);
    markPartGroup(bb, 'bb-400', bbLbl);

    // Left Wing: Resistors (top-left) & Timing Capacitors (bottom-left)
    var resVals = [220, 10000, 47000];
    var rGrp = new THREE.Group();
    for (var i = 0; i < resVals.length; i++) {
      var rx = -3.95;
      var rz = -2.2 + i * 0.62;
      var rMesh = this._buildResistorMesh(rx - 0.36, MAT_TOP_Y, rz, rx + 0.36, MAT_TOP_Y, rz, resVals[i], 'part-resistors');
      rGrp.add(rMesh);
    }
    this.circuitRoot.add(rGrp);
    var rLbl = this._trLabel('1/4W resistors (220Ω · 10k · 47k)', lang);
    markPartGroup(rGrp, 'resistors', rLbl);

    var c1 = this._buildElecCapMesh(-4.35, MAT_TOP_Y, 0.65, -4.13, MAT_TOP_Y, 0.65, 'part-caps');
    c1.userData.interactiveMeta = { wireId: 'part-caps', partId: 'cap-elec', label: '10 µF Electrolytic Cap' };
    var c2 = this._buildCeramicCapMesh(-3.45, MAT_TOP_Y, 0.65, -3.25, MAT_TOP_Y, 0.65, 'part-caps');
    c2.scale.set(1.32, 1.32, 1.32);
    c2.userData.interactiveMeta = { wireId: 'part-caps', partId: 'cap-ceramic', label: '10 nF Ceramic Cap' };
    this.circuitRoot.add(c1, c2);

    // Right Wing: LEDs + Diode (top-right) & Interactive I/O 2x2 Grid (bottom-right)
    var l1 = this._buildLedMesh(3.45, MAT_TOP_Y, -1.95, 3.68, MAT_TOP_Y, -1.95, '#EF4444', 'part-leds', false, 'p1');
    l1.userData.interactiveMeta = { wireId: 'part-leds', partId: 'leds', label: '5mm Red LED' };
    var l2 = this._buildLedMesh(4.25, MAT_TOP_Y, -1.95, 4.48, MAT_TOP_Y, -1.95, '#3B82F6', 'part-leds', false, 'p2');
    l2.userData.interactiveMeta = { wireId: 'part-leds', partId: 'leds', label: '5mm Blue LED' };
    var d1 = this._buildDiodeMesh(3.62, MAT_TOP_Y, -1.05, 4.30, MAT_TOP_Y, -1.05, 'part-leds');
    d1.userData.interactiveMeta = { wireId: 'part-leds', partId: 'diode', label: '1N4148 Diode' };
    this.circuitRoot.add(l1, l2, d1);

    var btn = this._buildButtonMesh(3.35, MAT_TOP_Y, 0.35, 3.75, MAT_TOP_Y, 0.35, 'trigger', 'part-inputs');
    btn.userData.interactiveMeta = { wireId: 'part-inputs', partId: 'button', btnRole: null, label: 'Tactile Switch' };
    var pot = this._buildPotMesh(4.35, MAT_TOP_Y, 0.35, 4.85, MAT_TOP_Y, 0.35, 0.65, 'part-inputs');
    pot.userData.interactiveMeta = { wireId: 'part-inputs', partId: 'pot', label: '50 kΩ Potentiometer' };
    var ldr = this._buildLdrMesh(3.40, MAT_TOP_Y, 1.55, 3.70, MAT_TOP_Y, 1.55, 'part-inputs');
    ldr.userData.interactiveMeta = { wireId: 'part-inputs', partId: 'ldr', label: 'CdS Photoresistor (LDR)' };
    var buz = this._buildBuzzerMesh(4.40, MAT_TOP_Y, 1.55, 4.80, MAT_TOP_Y, 1.55, 'part-inputs');
    buz.userData.interactiveMeta = { wireId: 'part-inputs', partId: 'buzzer', label: '5V Piezo Buzzer' };
    this.circuitRoot.add(btn, pot, ldr, buz);

    var matOrder = [heroIc, bb, rGrp, c1, c2, l1, l2, d1, btn, pot, ldr, buz];
    for (var mi = 0; mi < matOrder.length; mi++) {
      this.assemblyItems.push({ obj: matOrder[mi] });
    }
  };

  Studio3DWorkbench.prototype._buildStep2Cutaway3D = function (state, simState) {
    var baseX = 0;
    var baseZ = 0;
    var icW = 6.2;
    var icD = 3.5;

    var basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(icW, 0.24, icD),
      new THREE.MeshStandardMaterial({ color: '#1E252E', roughness: 0.52 })
    );
    basePlate.position.set(baseX, MAT_TOP_Y + 0.12, baseZ);
    basePlate.receiveShadow = true;
    basePlate.castShadow = true;
    this.circuitRoot.add(basePlate);

    for (var i = 0; i < 4; i++) {
      var px = -2.1 + i * 1.4;
      var topPin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.10, 0.6), this.metalMat);
      topPin.position.set(px, MAT_TOP_Y + 0.16, -icD / 2 - 0.25);
      var botPin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.10, 0.6), this.metalMat);
      botPin.position.set(px, MAT_TOP_Y + 0.16, icD / 2 + 0.25);
      this.circuitRoot.add(topPin, botPin);
    }

    var traceMat = new THREE.MeshStandardMaterial({ color: '#D97706', metalness: 0.75, roughness: 0.3 });
    var t1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.08), traceMat);
    t1.position.set(-1.3, MAT_TOP_Y + 0.26, -0.68);
    var t2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.08), traceMat);
    t2.position.set(-1.3, MAT_TOP_Y + 0.26, 0.68);
    var t3 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.08), traceMat);
    t3.position.set(0.1, MAT_TOP_Y + 0.26, -0.35);
    var t4 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.08), traceMat);
    t4.position.set(0.1, MAT_TOP_Y + 0.26, 0.35);
    var t5 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.08), traceMat);
    t5.position.set(1.55, MAT_TOP_Y + 0.26, -0.52);
    var t6 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.08), traceMat);
    t6.position.set(1.55, MAT_TOP_Y + 0.26, 0.58);
    this.circuitRoot.add(t1, t2, t3, t4, t5, t6);

    var divGrp = new THREE.Group();
    for (var r = 0; r < 3; r++) {
      var rBlk = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.22, 0.68),
        new THREE.MeshStandardMaterial({ color: '#E5CFA7', roughness: 0.45 })
      );
      rBlk.position.set(-2.0, MAT_TOP_Y + 0.35, -0.95 + r * 0.95);
      divGrp.add(rBlk);
    }
    this.circuitRoot.add(divGrp);
    this.explodedTargets.push({ obj: divGrp, baseY: 0, lift: 0.4 });

    var compUMat = new THREE.MeshStandardMaterial({ color: '#2667C9', emissive: '#2667C9', emissiveIntensity: state.params.manualThresHigh ? 0.65 : 0.1, roughness: 0.35 });
    var compUMesh = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.72, 3), compUMat);
    compUMesh.rotation.z = -Math.PI / 2;
    compUMesh.position.set(-0.6, MAT_TOP_Y + 0.42, -0.68);
    this.circuitRoot.add(compUMesh);
    this.explodedTargets.push({ obj: compUMesh, baseY: MAT_TOP_Y + 0.42, lift: 0.5 });
    this.liveBlockMeshes.compU = compUMat;

    var compLMat = new THREE.MeshStandardMaterial({ color: '#E87722', emissive: '#E87722', emissiveIntensity: state.params.manualTrigLow ? 0.65 : 0.1, roughness: 0.35 });
    var compLMesh = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.72, 3), compLMat);
    compLMesh.rotation.z = -Math.PI / 2;
    compLMesh.position.set(-0.6, MAT_TOP_Y + 0.42, 0.68);
    this.circuitRoot.add(compLMesh);
    this.explodedTargets.push({ obj: compLMesh, baseY: MAT_TOP_Y + 0.42, lift: 0.5 });
    this.liveBlockMeshes.compL = compLMat;

    var ffMat = new THREE.MeshStandardMaterial({
      color: simState.outputHigh ? '#10B981' : '#475569',
      emissive: simState.outputHigh ? '#10B981' : '#000000',
      emissiveIntensity: simState.outputHigh ? 0.45 : 0,
      roughness: 0.32
    });
    var ffMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 1.4), ffMat);
    ffMesh.position.set(0.85, MAT_TOP_Y + 0.43, 0);
    ffMesh.castShadow = true;
    this.circuitRoot.add(ffMesh);
    this.explodedTargets.push({ obj: ffMesh, baseY: MAT_TOP_Y + 0.43, lift: 0.6 });
    this.liveBlockMeshes.ff = ffMat;

    var outMat = new THREE.MeshStandardMaterial({
      color: '#2B8A57',
      emissive: '#10B981',
      emissiveIntensity: simState.outputHigh ? 0.8 : 0.05,
      roughness: 0.3
    });
    var outMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.34, 0.68), outMat);
    outMesh.position.set(2.2, MAT_TOP_Y + 0.41, -0.58);
    this.circuitRoot.add(outMesh);
    this.explodedTargets.push({ obj: outMesh, baseY: MAT_TOP_Y + 0.41, lift: 0.55 });
    this.liveBlockMeshes.out = outMat;

    var npnMat = new THREE.MeshStandardMaterial({
      color: '#D4A838',
      emissive: '#F59E0B',
      emissiveIntensity: simState.dischargeOn ? 0.7 : 0.08,
      roughness: 0.35
    });
    var npnMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.34, 20), npnMat);
    npnMesh.position.set(2.2, MAT_TOP_Y + 0.41, 0.65);
    this.circuitRoot.add(npnMesh);
    this.explodedTargets.push({ obj: npnMesh, baseY: MAT_TOP_Y + 0.41, lift: 0.55 });
    this.liveBlockMeshes.npn = npnMat;

    var lid = new THREE.Mesh(
      new THREE.BoxGeometry(icW, 0.16, icD),
      new THREE.MeshStandardMaterial({
        color: '#232B35',
        transparent: true,
        opacity: 0.28,
        roughness: 0.2,
        depthWrite: false
      })
    );
    lid.position.set(baseX, MAT_TOP_Y + 0.48, baseZ);
    lid.userData.baseY = MAT_TOP_Y + 0.48;
    lid.position.y += 0.65;
    this.cutawayLid = lid;
    this.circuitRoot.add(lid);

    this.assemblyItems.push({ obj: divGrp }, { obj: compUMesh }, { obj: compLMesh }, { obj: ffMesh }, { obj: outMesh }, { obj: npnMesh }, { obj: lid });
  };

  Studio3DWorkbench.prototype.buildCircuit = function (state, step, simState, options) {
    this.currentLang = state.lang || 'en';
    var modeChanged = this.lastStepMode !== step.mode;
    this._clearCircuit();
    this.lastStepMode = step.mode;
    if (modeChanged) {
      var preset = this._getPresetForMode(step.mode);
      this.camera.position.copy(preset.pos);
      this.controls.target.copy(preset.look);
      this.controls.update();
    }

    if (step.mode === 'pinout') {
      this._buildStep1PartsMat(state);
    } else if (step.mode === 'block') {
      this._buildStep2Cutaway3D(state, simState);
    } else {
      // Full 3D Breadboard + DIP-8 555 + Wires + Live Components!
      var bb = this._buildBreadboardMesh();
      this.circuitRoot.add(bb);

      // DIP-8 555 centered across Cols 13..16
      var icCenter = (holePos(14, 'E').x + holePos(15, 'E').x) / 2;
      var icGroup = this._buildDip555Group(state.icType, 1.0);
      icGroup.position.set(icCenter, BB_TOP_Y, 0);
      this.circuitRoot.add(icGroup);
      this.explodedTargets.push({ obj: icGroup, baseY: BB_TOP_Y, lift: 0.45 });
      this.assemblyItems.push({ obj: icGroup });

      var wires = step.wires || [];
      var createdWires = [];
      // Components mounted onto breadboard
      var comps = step.components || [];
      for (var c = 0; c < comps.length; c++) {
        var comp = comps[c];
        var matchedWireId = '';
        for (var k = 0; k < wires.length; k++) {
          if (wires[k].component === comp.id) {
            matchedWireId = wires[k].id;
            break;
          }
        }
        var cA = holePos(comp.col1, comp.row1);
        var cB = holePos(comp.col2, comp.row2);
        var mesh = null;
        if (comp.kind === 'resistor') {
          var ohms = comp.fixedOhms || (comp.valueKey ? state.params[comp.valueKey] : 10000);
          mesh = this._buildResistorMesh(cA.x, BB_TOP_Y, cA.z, cB.x, BB_TOP_Y, cB.z, ohms, matchedWireId);
        } else if (comp.kind === 'cap-elec') {
          mesh = this._buildElecCapMesh(cA.x, BB_TOP_Y, cA.z, cB.x, BB_TOP_Y, cB.z, matchedWireId);
        } else if (comp.kind === 'cap-ceramic') {
          mesh = this._buildCeramicCapMesh(cA.x, BB_TOP_Y, cA.z, cB.x, BB_TOP_Y, cB.z, matchedWireId);
        } else if (comp.kind === 'diode') {
          mesh = this._buildDiodeMesh(cA.x, BB_TOP_Y, cA.z, cB.x, BB_TOP_Y, cB.z, matchedWireId);
        } else if (comp.kind === 'led') {
          mesh = this._buildLedMesh(cA.x, BB_TOP_Y, cA.z, cB.x, BB_TOP_Y, cB.z, comp.color, matchedWireId, comp.sinkLed, comp.id);
        } else if (comp.kind === 'button') {
          mesh = this._buildButtonMesh(cA.x, BB_TOP_Y, cA.z, cB.x, BB_TOP_Y, cB.z, comp.role, matchedWireId);
        } else if (comp.kind === 'pot') {
          mesh = this._buildPotMesh(cA.x, BB_TOP_Y, cA.z, cB.x, BB_TOP_Y, cB.z, state.params.potRatio, matchedWireId);
        } else if (comp.kind === 'buzzer') {
          mesh = this._buildBuzzerMesh(cA.x, BB_TOP_Y, cA.z, cB.x, BB_TOP_Y, cB.z, matchedWireId);
        } else if (comp.kind === 'ldr') {
          mesh = this._buildLdrMesh(cA.x, BB_TOP_Y, cA.z, cB.x, BB_TOP_Y, cB.z, matchedWireId);
        }
        if (mesh) {
          if (comp.label && mesh.userData && mesh.userData.interactiveMeta) {
            mesh.userData.interactiveMeta.label = comp.label;
          }
          this.circuitRoot.add(mesh);
          this.assemblyItems.push({ obj: mesh });
        }
      }

      // Main jumper wires
      for (var w = 0; w < wires.length; w++) {
        var wire = wires[w];
        if (wire.from && wire.to) {
          var pA = holePos(wire.from[0], wire.from[1]);
          var pB = holePos(wire.to[0], wire.to[1]);
          var wGrp = this._addWireCurve(this.circuitRoot, pA.x, BB_TOP_Y, pA.z, pB.x, BB_TOP_Y, pB.z, wire.color, 0.62, wire.id);
          if (wGrp && wire.badge) {
            wGrp.userData.interactiveMeta.label = wire.badge + ' · ' + wire.label;
          }
          if (wGrp) createdWires.push(wGrp);
        }
      }

      // Extra jumper wires
      var extras = step.extraWires || [];
      for (var e = 0; e < extras.length; e++) {
        var ex = extras[e];
        var eA = holePos(ex.from[0], ex.from[1]);
        var eB = holePos(ex.to[0], ex.to[1]);
        var exGrp = this._addWireCurve(this.circuitRoot, eA.x, BB_TOP_Y, eA.z, eB.x, BB_TOP_Y, eB.z, ex.color, 0.56, ex.parentWire || '');
        if (exGrp) createdWires.push(exGrp);
      }

      for (var wi = 0; wi < createdWires.length; wi++) {
        this.assemblyItems.push({ obj: createdWires[wi] });
      }
    }

    if (this.exploded) {
      this.explodedAmount = 1;
      for (var ei = 0; ei < this.explodedTargets.length; ei++) {
        var et = this.explodedTargets[ei];
        et.obj.position.y = et.baseY + et.lift;
      }
      if (this.cutawayLid) {
        this.cutawayLid.position.y = this.cutawayLid.userData.baseY + 1.2;
      }
    } else {
      this.explodedAmount = 0;
    }

    this.applyHighlight(this.highlightedWireId);
    this.updateLiveVisuals(simState, state.params);

    var shouldAnimate = Boolean(options && options.animate) &&
      this.assemblyItems.length > 0 &&
      !(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (shouldAnimate) {
      this._startAssemblyAnimation();
    } else {
      this.requestRender();
    }
  };

  Studio3DWorkbench.prototype._startAssemblyAnimation = function () {
    var self = this;
    var gen = ++this.assemblyGen;
    var items = this.assemblyItems;
    var staggerMs = 52;
    var dropMs = 175;
    var dropHeight = 0.95;

    for (var i = 0; i < items.length; i++) {
      items[i].targetY = items[i].obj.position.y;
      items[i].delay = i * staggerMs;
      items[i].duration = dropMs;
      items[i].done = false;
      items[i].obj.position.y = items[i].targetY + dropHeight;
      items[i].obj.visible = false;
    }

    var startTime = performance.now();
    this.requestRender();

    function stepAsm() {
      if (self.disposed || self.assemblyGen !== gen) return;
      var elapsed = performance.now() - startTime;
      var allDone = true;

      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (elapsed < it.delay) {
          it.obj.visible = false;
          allDone = false;
        } else {
          it.obj.visible = true;
          var p = Math.min(1, (elapsed - it.delay) / it.duration);
          var ease = 1 - Math.pow(1 - p, 3);
          it.obj.position.y = it.targetY + (1 - ease) * dropHeight;
          if (p < 1) {
            allDone = false;
          } else {
            it.obj.position.y = it.targetY;
            it.done = true;
          }
        }
      }

      self._updateHoverTooltipPos();
      self.requestRender();

      if (!allDone) {
        if (self.isSoftwareGl) {
          setTimeout(stepAsm, 42);
        } else {
          requestAnimationFrame(stepAsm);
        }
      }
    }

    if (this.isSoftwareGl) {
      setTimeout(stepAsm, 30);
    } else {
      requestAnimationFrame(stepAsm);
    }
  };

  Studio3DWorkbench.prototype.applyHighlight = function (wireId) {
    this.highlightedWireId = wireId;
    for (var i = 0; i < this.wireGroups.length; i++) {
      var grp = this.wireGroups[i];
      var match = Boolean(wireId && grp.userData.wireId === wireId);
      grp.traverse(function (child) {
        if (child.isMesh && child.material && child.material.emissive && !child.material.userData.id) {
          if (match) {
            child.material.emissive.setHex(0xF4B936);
            child.material.emissiveIntensity = 0.75;
          } else {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
      });
    }
    this.requestRender();
  };

  Studio3DWorkbench.prototype.updateLiveVisuals = function (simState, params) {
    if (!simState) return;
    var dirty = false;

    for (var i = 0; i < this.liveLedMeshes.length; i++) {
      var mat = this.liveLedMeshes[i];
      var lit = mat.userData.sinkLed ? !simState.outputHigh : simState.outputHigh;
      var targetEmissive = lit ? 1.45 : 0.12;
      if (Math.abs(mat.emissiveIntensity - targetEmissive) > 0.05) {
        mat.emissiveIntensity = targetEmissive;
        dirty = true;
      }
    }
    for (var li = 0; li < this.liveLedLights.length; li++) {
      var pt = this.liveLedLights[li];
      var ptLit = pt.userData.sinkLed ? !simState.outputHigh : simState.outputHigh;
      var targetInt = ptLit ? 0.9 : 0;
      if (pt.intensity !== targetInt) {
        pt.intensity = targetInt;
        dirty = true;
      }
    }
    for (var pi = 0; pi < this.livePotGroups.length; pi++) {
      var rotY = -((Number(params.potRatio || 0.5) - 0.5) * 4.2);
      if (Math.abs(this.livePotGroups[pi].rotation.y - rotY) > 0.01) {
        this.livePotGroups[pi].rotation.y = rotY;
        dirty = true;
      }
    }
    for (var bi = 0; bi < this.liveBuzzerRings.length; bi++) {
      var op = simState.outputHigh ? 0.85 : 0.08;
      if (this.liveBuzzerRings[bi].opacity !== op) {
        this.liveBuzzerRings[bi].opacity = op;
        dirty = true;
      }
    }
    if (this.liveBlockMeshes.ff) {
      this.liveBlockMeshes.compU.emissiveIntensity = params.manualThresHigh ? 0.7 : 0.1;
      this.liveBlockMeshes.compL.emissiveIntensity = params.manualTrigLow ? 0.7 : 0.1;
      this.liveBlockMeshes.ff.color.setHex(simState.outputHigh ? 0x10B981 : 0x475569);
      this.liveBlockMeshes.ff.emissive.setHex(simState.outputHigh ? 0x10B981 : 0x000000);
      this.liveBlockMeshes.ff.emissiveIntensity = simState.outputHigh ? 0.45 : 0;
      this.liveBlockMeshes.out.emissiveIntensity = simState.outputHigh ? 0.85 : 0.08;
      this.liveBlockMeshes.npn.emissiveIntensity = simState.dischargeOn ? 0.75 : 0.08;
      dirty = true;
    }

    if (dirty) this.requestRender();
  };

  Studio3DWorkbench.prototype.dispose = function () {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    if (this._ro) this._ro.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this._onPointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this._onPointerUp);
    this.renderer.domElement.removeEventListener('pointermove', this._onPointerMove);
    this.renderer.domElement.removeEventListener('pointerleave', this._onPointerLeave);
    this.controls.dispose();
    if (this.envRT) this.envRT.dispose();
    this.renderer.dispose();
  };

  root.Workbench3D555 = {
    Studio3DWorkbench: Studio3DWorkbench
  };
}(typeof self !== 'undefined' ? self : this));

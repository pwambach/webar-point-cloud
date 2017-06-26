/* MOSTLY COPIED FROM https://github.com/googlevr/chromium-webar/tree/master/examples/threejs/picking */

function GUI() {
  this.showPointCloud = true;
  this.pointsToSkip = 0;
  return this;
}

if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
}

const POINTS_PER_FRAME = 40000;
const FRAMES_TO_SAVE = 20;
const ELEMENTS_PER_POINT = 3;
const ELEMENTS_PER_FRAME = ELEMENTS_PER_POINT * POINTS_PER_FRAME;

let container;
let stats;
let camera;
let scene;
let renderer;
let axisHelper;
let pointCloud;
let points;
let vrDisplay;
let gui;
let bufferGeometry;
let points2;
let vertices;
let copyIndex = 0;
let frameData = null;
let cube = null;
let ws = null;

// WebAR is currently based on the WebVR API so try to find the right
// VRDisplay instance.
if (navigator.getVRDisplays) {
  navigator.getVRDisplays().then(vrDisplays => {
    if (vrDisplays && vrDisplays.length > 0) {
      for (let i = 0; !vrDisplay && i < vrDisplays.length; i++) {
        vrDisplay = vrDisplays[i];
        // if (vrDisplay.displayName !== 'Tango VR Device') {
        //   vrDisplay = null;
        // }
      }
    }
    if (!vrDisplay) {
      console.warn('No Tango WebAR VRDisplay found. Falling back to a video.');
    }
    init(true);
    updateAndRender();
  });
} else {
  console.warn('No navigator.getVRDisplays');
  init();
  updateAndRender();
}

function init(isVRDevice) {
  frameData = new VRFrameData();

  // Initialize the dat.GUI.
  const datGUI = new dat.GUI();
  gui = new GUI();
  datGUI
    .add(gui, 'showPointCloud')
    .onFinishChange(function(value) {
      if (value) {
        scene.add(points);
      } else {
        scene.remove(points);
      }
    })
    .name('Show Point Cloud');
  datGUI.add(gui, 'pointsToSkip', 0, 10).name('Points to kip');

  // Initialize everything related to ThreeJS.
  container = document.createElement('div');
  document.body.appendChild(container);

  // Create the 3D scene
  scene = new THREE.Scene();

  // Axis Helper
  axisHelper = new THREE.AxisHelper(5);
  scene.add(axisHelper);

  // Perspective Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, -10);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene.add(camera);

  // Orbit Controls
  const controls = new THREE.OrbitControls(camera); // eslint-disable-line no-unused-vars

  // Enable to load on non VR Device
  if (isVRDevice) {
    // initPointCloud();
  }

  initSecondPointCloud();

  initPoseBox();

  initWebSocket();

  // Create the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(1 /*window.devicePixelRatio*/);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create a way to measure performance
  stats = new Stats();
  container.appendChild(stats.dom);

  // Control the resizing of the window to correctly display the scene.
  window.addEventListener('resize', onWindowResize, false);

  // Copy points of current frame to second point cloud
  const copyButton = document.getElementById('copyButton');
  copyButton.addEventListener('click', copyVertices);

  // Send points of current frame to server
  const sendButton = document.getElementById('sendButton');
  sendButton.addEventListener('click', () => {
    copyVertices();
    sendVertices();
  });
}

function initWebSocket() {
  const socket = new WebSocket('ws://192.168.2.105:8000');

  socket.addEventListener('open', function open() {
    console.log('WebSocket open');
    ws = socket;
  });

  socket.addEventListener('message', function incoming(data) {
    console.log(data);
  });
}

function initPoseBox() {
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 1);
  const material = new THREE.MeshNormalMaterial({color: 0x00ff00});
  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
}

// The live point cloud
function initPointCloud() {
  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.01,
    vertexColors: THREE.VertexColors
  });
  pointsMaterial.depthWrite = false;
  pointCloud = new THREE.WebAR.VRPointCloud(vrDisplay, true);
  points = new THREE.Points(pointCloud.getBufferGeometry(), pointsMaterial);
  // Points are changing all the time so calculating the frustum culling
  // volume is not very convenient.
  points.frustumCulled = false;
  points.renderDepth = 0;

  if (gui.showPointCloud) {
    scene.add(points);
  }
}

// The aggregated point cloud
function initSecondPointCloud() {
  vertices = new Float32Array(ELEMENTS_PER_FRAME * FRAMES_TO_SAVE);

  const bufferAttribute = new THREE.BufferAttribute(
    vertices,
    ELEMENTS_PER_POINT
  );
  bufferGeometry = new THREE.BufferGeometry();
  bufferGeometry.addAttribute('position', bufferAttribute);

  const pointsMaterial = new THREE.PointsMaterial({
    color: 0x777777,
    size: 0.005
  });
  pointsMaterial.depthWrite = false;
  points2 = new THREE.Points(bufferGeometry, pointsMaterial);
  points2.frustumCulled = false;
  points2.renderDepth = 0;

  scene.add(points2);
}

// copy points of current frame to second point cloud
function copyVertices() {
  const time = Date.now();
  const source = points.geometry.attributes.position.array;
  const target = points2.geometry.attributes.position.array;
  const offset = copyIndex * ELEMENTS_PER_FRAME;

  for (let i = 0; i < ELEMENTS_PER_FRAME; i++) {
    target[offset + i] = source[i];
  }

  copyIndex = (copyIndex + 1) % FRAMES_TO_SAVE;

  const ms = Date.now() - time;
  console.log(`copied in ${ms} ms (index: ${copyIndex})`);
  bufferGeometry.attributes.position.needsUpdate = true;
}

// send points of current frame to server
function sendVertices() {
  const source = points.geometry.attributes.position.array;
  const data = source.slice(0, ELEMENTS_PER_FRAME);

  fetch('points', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(Array.from(data))
  }).then(() => console.log(`send ${data.buffer.byteLength} bytes`));
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let frame = 0;
const onEveryNthFrame = 2;

function updateAndRender() {
  stats.update();

  if (vrDisplay) {
    vrDisplay.getFrameData(frameData);
    const pos = frameData.pose.position;
    cube.position.set(pos[0], pos[1], pos[2]);

    const orient = frameData.pose.orientation;
    cube.quaternion.set(
      orient[0],
      orient[1],
      orient[2],
      orient[3]
    );

    if (frame % onEveryNthFrame === 0 && ws) {
      console.log('send position');
      const message = {
        position: pos,
        orientation: orient
      };
      ws.send(JSON.stringify(message));
    }
  }

  // Update the point cloud. Only if the point cloud will be shown the
  // geometry is also updated.
  if (pointCloud) {
    pointCloud.update(gui.showPointCloud, gui.pointsToSkip, true);
  }

  // Render the perspective scene
  renderer.render(scene, camera);

  requestAnimationFrame(updateAndRender);

  frame++;
}

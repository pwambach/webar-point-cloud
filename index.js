function GUI() {
  this.showPointCloud = true;
  this.pointsToSkip = 0;
  return this;
}

if (!Detector.webgl) Detector.addGetWebGLMessage();

var container, stats;
var cameraOrtho, cameraPersp, cameraScene, scene, renderer;
var pointCloud, points;
var vrDisplay;
var model;
var gui;
var pos = new THREE.Vector3(); // Avoid GC.

var MODEL_SIZE_IN_METERS = 0.1;

// WebAR is currently based on the WebVR API so try to find the right
// VRDisplay instance.
if (navigator.getVRDisplays) {
  navigator.getVRDisplays().then(function(vrDisplays) {
    if (vrDisplays && vrDisplays.length > 0) {
      for (var i = 0; !vrDisplay && i < vrDisplays.length; i++) {
        vrDisplay = vrDisplays[i];
        if (vrDisplay.displayName !== 'Tango VR Device') {
          vrDisplay = null;
        }
      }
    }
    if (!vrDisplay) {
      alert('No Tango WebAR VRDisplay found. Falling back to a video.');
    }
    init(vrDisplay);
    updateAndRender();
  });
} else {
  alert('No navigator.getVRDisplays');
}

function init(vrDisplay) {
  // Initialize the dat.GUI.
  var datGUI = new dat.GUI();
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

  // Create the 3D scene and camera
  scene = new THREE.Scene();
  // Use the THREE.WebAR utility to create a perspective camera
  // suited to the actual see through camera parameters.
  cameraPersp = THREE.WebAR.createVRSeeThroughCamera(vrDisplay, 0.01, 100);

  var pointsMaterial = new THREE.PointsMaterial({
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

  if (gui.showPointCloud) scene.add(points);

  // Control the perspective camera using the VR pose.
  vrControls = new THREE.VRControls(cameraPersp);

  // Create the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // It is important to specify that the color buffer should not be
  // automatically cleared. The see through camera will render the whole
  // background.
  document.body.appendChild(renderer.domElement);

  // Create a way to measure performance
  stats = new Stats();
  container.appendChild(stats.dom);

  // Control the resizing of the window to correctly display the scene.
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  THREE.WebAR.resizeVRSeeThroughCamera(vrDisplay, cameraPersp);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateAndRender() {
  // UPDATE

  stats.update();

  // Update the perspective scene
  vrControls.update();

  // Update the point cloud. Only if the point cloud will be shown the
  // geometry is also updated.
  pointCloud.update(gui.showPointCloud, gui.pointsToSkip, true);

  // Render the perspective scene
  renderer.clearDepth();

  renderer.render(scene, cameraPersp);

  requestAnimationFrame(updateAndRender);
}

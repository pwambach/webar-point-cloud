if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
}

let container;
let camera;
let scene;
let renderer;
let axisHelper;
let pointCloud;

fetchPoints().then(points => {
  init(points);
  updateAndRender();
});

function init(points) {
  container = document.createElement('div');
  document.body.appendChild(container);

  // Create the 3D scene and camera
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Axis Helper
  axisHelper = new THREE.AxisHelper(1);
  scene.add(axisHelper);

  // Camera
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

  initPointCloud(points);

  // Create the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.clearColor(0x00ff00);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Control the resizing of the window to correctly display the scene.
  window.addEventListener('resize', onWindowResize, false);
}

function initPointCloud(points) {
  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.01,
    color: 0x000000
  });

  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(points, 3));

  pointCloud = new THREE.Points(geometry, pointsMaterial);
  pointCloud.frustumCulled = false;
  scene.add(pointCloud);
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let frames = 0;

function updateAndRender() {
  renderer.render(scene, camera);

  if (pointCloud) {
    pointCloud.rotation.y = frames / 100;
  }

  frames++;

  requestAnimationFrame(updateAndRender);
}

function fetchPoints() {
  return fetch('points.csv')
    .then(res => res.text())
    .then(csv => csv.split('\n'))
    .then(lines => lines.map(line => line.split(';')))
    .then(pts => pts.map(point => point.map(num => parseFloat(num))))
    .then(pts => {
      console.log(`${pts.length} points`);
      const typedArray = new Float32Array(pts.length * 3);

      for (let i = 0; i < pts.length; i++) {
        const point = pts[i];
        typedArray[i * 3 + 0] = point[0];
        typedArray[i * 3 + 1] = point[1];
        typedArray[i * 3 + 2] = point[2];
      }

      return typedArray;
    });
}

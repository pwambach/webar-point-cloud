let threebox = null;

mapboxgl.accessToken = '';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v9',
  center: [9.96174, 53.56110],
  zoom: 15,
  pitch: 0,
  heading: 0
});

map.on('load', function() {
  // Initialize threebox
  threebox = new Threebox(map);
  threebox.setupDefaultLights();

  fetchPoints().then(initPointCloud);
});

function initPointCloud(points) {
  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.01,
    color: 0xeeeeee,
    alpha: 0.5
  });

  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(points, 3));

  const pointCloud = new THREE.Points(geometry, pointsMaterial);
  pointCloud.frustumCulled = false;

  window.pointCloud = pointCloud;
  // move a bit to fit map
  pointCloud.rotation.set(1.6, -0.6, 0.1);
  pointCloud.scale.set(0.28, 0.28, 0.28);
  pointCloud.position.set(-30.5, -11, 0);

  const position = [9.9608178, 53.56093, 1];
  threebox.addAtCoordinate(pointCloud, position, {scaleToLatitude: true, preScale: 2});
}

function fetchPoints() {
  return fetch('full_office.min.floor.csv')
    .then(res => res.text())
    .then(csv => csv.split('\n'))
    .then(lines => lines.map(line => line.split(';')))
    .then(pts => pts.map(point => point.map(num => parseFloat(num))))
    .then(pts => {
      console.log(`loaded ${pts.length} points`);
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


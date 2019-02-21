var data = {
  labels: [],
  datasets: [{
    data: [],
    label: "Mag-x",
    borderColor: "#3e95cd",
    fill: false
  }, {
    data: [],
    label: "Mag-y",
    borderColor: "#8e5ea2",
    fill: false
  }, {
    data: [],
    label: "Mag-z",
    borderColor: "#3cba9f",
    fill: false
  }]
}

var ctx = document.getElementById("chart");
var lineChart = new Chart(ctx, {
  type: 'line',
  data: data,
  options: {
    title: {
      display: true,
      text: 'SensorTag Data'
    },
    animation: false,
    scales: {
      yAxes: [{
        display: true,
        ticks: {
          suggestedMin: -500,
          suggestedMax: 500    
        }
      }],
      xAxes: [{
        display: false
      }]
    }
  }
});

let dispLength = 200;

function updateChart(data) {
  lineChart.data.datasets.forEach((dataset, i) => {
    var dataArr = dataset.data
    dataArr.push(data[i]);
    dataset.data = dataArr.slice(dataArr.length - dispLength, dataArr.length);
  });
  lineChart.data.labels = [...lineChart.data.datasets[0].data.keys()]
  lineChart.update()
}

function toVec3(arr) {
  return new THREE.Vector3( arr[0], arr[1], arr[2] );
}

var canvas = document.getElementById('graph');
var renderer = new THREE.WebGLRenderer( { canvas: canvas } );

var camera = new THREE.OrthographicCamera( -2, 2, 2, -2, 0.001, 1000 );
camera.position.set(-2, 0, 0);
camera.lookAt( 0, 0, 0 );

var scene = new THREE.Scene();

function createLines() {
  var colors = [0xff0000, 0x00ff00, 0x0000ff]
  var vertices = [new THREE.Vector3( 1, 0, 0), new THREE.Vector3( 0, 1, 0), new THREE.Vector3( 0, 0, 1)]
  var group = new THREE.Group();

  for (var i = 0; i< 3; i++) {
    var material = new THREE.LineBasicMaterial( { color: colors[i] } );
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometry.vertices.push(vertices[i]);
    var line = new THREE.Line( geometry, material );
    group.add(line)
  }
  return group
}

var lines = createLines()
scene.add(lines);

w = new THREE.Quaternion();
w.setFromUnitVectors(toVec3([0,0,1]), toVec3([0,-1,0]))
lines.setRotationFromQuaternion(w);
renderer.render( scene, camera );

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render()

function setQuarternion(q) {
  lines.setRotationFromQuaternion(w.clone().multiply(q));
}
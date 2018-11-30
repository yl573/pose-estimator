var data = {
  labels: [],
  datasets: [{
    data: [],
    label: "Gyro-x",
    borderColor: "#3e95cd",
    fill: false
  }, {
    data: [],
    label: "Gyro-y",
    borderColor: "#8e5ea2",
    fill: false
  }, {
    data: [],
    label: "Gyro-z",
    borderColor: "#3cba9f",
    fill: false
  }]
}

var ctx = document.getElementById("myChart");
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
          suggestedMin: -250,
          suggestedMax: 250    
        }
      }],
      xAxes: [{
        display: false
      }]
    }
  }
});

let dispLength = 100;

function updateChart(data) {
  lineChart.data.datasets.forEach((dataset, i) => {
    var dataArr = dataset.data
    dataArr.push(data[i]);
    dataset.data = dataArr.slice(dataArr.length - dispLength, dataArr.length);
  });
  lineChart.data.labels = [...lineChart.data.datasets[0].data.keys()]
  lineChart.update()
}


var movementUUIDs = {}
movementUUIDs.service = 'f000aa80-0451-4000-b000-000000000000';
movementUUIDs.data = 'f000aa81-0451-4000-b000-000000000000';
movementUUIDs.config = 'f000aa82-0451-4000-b000-000000000000';
movementUUIDs.period = 'f000aa83-0451-4000-b000-000000000000';
movementUUIDs.descriptor = '00002902-0000-1000-8000-00805f9b34fb';

function findUUID(chars, uuid) {
  for (var i = 0; i < chars.length; i++) {
    if (chars[i].uuid == uuid) return chars[i]
  }
}

function hexStringToByte(str) {
  if (!str) {
    return new Uint8Array();
  }
  var a = [];
  for (var i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16));
  }
  return new Uint8Array(a);
}

function gyroConvert(data) {
  var floatData = new Float32Array(data.length);
  for (var i = 0; i < data.length; i++) {
    floatData[i] = data[i] / (65536 / 500)
  }
  return floatData;
}

function accelConvert(data) {
  var floatData = new Float32Array(data.length);
  for (var i = 0; i < data.length; i++) {
    floatData[i] = data[i] / (32768 / 16);
  }
  return floatData;
}

function magConvert(data) {
  var floatData = new Float32Array(data.length);
  for (var i = 0; i < data.length; i++) {
    floatData[i] = data[i];
  }
  return floatData;
}

function handleDataEvent(event) {
  let data = new Int16Array(event.target.value.buffer)
  let gyro = gyroConvert(data.slice(0, 3)) // deg per sec, range -250, 250
  let accel = accelConvert(data.slice(3, 6)) // unit G, range -16, +16
  let mag = magConvert(data.slice(6, 9)) // unit uT, range -4900, +4900
  // console.log(gyro, accel, mag)

  updateChart(gyro)
}

async function onButtonClick() {

  try {
    console.log('Connecting...')
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: ['CC2650 SensorTag'] }],
      optionalServices: [movementUUIDs.service]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(movementUUIDs.service);
    const characteristics = await service.getCharacteristics();

    const configChar = findUUID(characteristics, movementUUIDs.config)
    const periodChar = findUUID(characteristics, movementUUIDs.period)
    const dataChar = findUUID(characteristics, movementUUIDs.data)


    await configChar.writeValue(hexStringToByte('ffff'))
    await periodChar.writeValue(hexStringToByte('0a'))

    await dataChar.startNotifications()
    dataChar.addEventListener('characteristicvaluechanged', handleDataEvent);

    console.log('Connected!')

  } catch (error) {
    console.log('Argh! ' + error);
  }
}
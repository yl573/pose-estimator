
// utility functions

function Tracker() {
  this.initial_state_var
  this.process_var
  this.measurement_var
}

function addMatrix(a, b) {
  a_arr = a.toArray()
  b_arr = b.toArray()
  for(var i =0; i<a_arr.length; i++) {
    a_arr[i] += b_arr[i]
  }
  return new THREE.Matrix3().fromArray(a_arr)
}

function subtractMatrix(a, b) {
  a_arr = a.toArray()
  b_arr = b.toArray()
  for(var i =0; i<a_arr.length; i++) {
    a_arr[i] -= b_arr[i]
  }
  return new THREE.Matrix3().fromArray(a_arr)
}

function printData(data) {
  document.getElementById("text").innerHTML+=data;
  document.getElementById("text").innerHTML+="<br>"
}

function quat_from_euler_vec(vec) {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler().setFromVector3(vec))
}

function quat_axis(quat) {
  return new THREE.Vector3().set(quat.x, quat.y, quat.z).normalize()
}

function remove_target_component(source, target) {
  return source.clone().sub(target.clone().multiplyScalar(source.dot(target))).normalize()
}

// initial state variance, same as acceleration variance
var p = new THREE.Matrix3().set( 
  0.0086, 0, 0,
  0, 0.024, 0,
  0, 0, 0.006
);

// gyro variance
var q = new THREE.Matrix3().set( 
  0.0028, 0, 0,
  0, 0.0022, 0,
  0, 0, 0.004
);

// acceleration variance
var r = new THREE.Matrix3().set( 
  0.0086, 0, 0,
  0, 0.024, 0,
  0, 0, 0.006
);

// identity
var i = new THREE.Matrix3().set( 
  1, 0, 0,
  0, 1, 0,
  0, 0, 1 
);

// state vector representing three euler angles
var x = toVec3([0,0,0])
// current timestamp
var ts = null 

Tracker.prototype.track = function(gyro, accel, mag) {

  // compute time difference since last sample
  if (!ts) {
    ts = (new Date()).getTime() / 1000; // secs
    return
  }
  new_ts = (new Date()).getTime() / 1000;
  dt = new_ts - ts
  ts = new_ts

  // normalize data vectors
  var accel = toVec3(accel).normalize()
  var mag = toVec3(mag).normalize()
  var gyro = toVec3([gyro[0], gyro[1], -gyro[2]]).multiplyScalar( - Math.PI / 180 * dt)

  // set unrotated coordinate frame
  accel_quat = new THREE.Quaternion().setFromUnitVectors(toVec3([0,0,-1]), accel)

  // Kalman Filter: Predict
  x1 = x.clone().add(gyro)
  p1 = addMatrix(p, q)

  // Kalman Filter: Update
  // measurement vector z
  z = new THREE.Euler().setFromQuaternion(accel_quat).toVector3()
  // measurement variance s (observation matrix is identity)
  s = addMatrix(p1, r)
  s_inv = new THREE.Matrix3().getInverse(s.clone())
  // Kalman gain k = P * S^-1
  k = p1.clone().multiply(s_inv)

  // new state: x = x1(I-k) + zk
  x = x1.clone().applyMatrix3(subtractMatrix(i, k)) 
  x.add(z.clone().applyMatrix3(k)) 
  // new uncertainty: p = (i-k)p1(i-k)^T + krk^T
  i_sub_k = subtractMatrix(i, k)
  p = i_sub_k.clone().multiply(p1).multiply(i_sub_k.transpose())
  p = addMatrix(p, k.clone().multiply(r).multiply(k.transpose()))

  e = new THREE.Euler().setFromVector3(x);
  xq = new THREE.Quaternion().setFromEuler(e)

  // update UI
  setQuarternion(xq)

  console.log(e)
  printData(`${Math.sqrt(mag.x * mag.x + mag.y * mag.y + mag.z * mag.z)}`)
}


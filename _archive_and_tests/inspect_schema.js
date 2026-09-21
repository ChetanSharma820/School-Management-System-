async function inspect() {
  const lRes = await fetch('http://127.0.0.1:8080/api/leaves');
  const lData = await lRes.json();
  console.log('Leaves Keys:', Object.keys(lData[0] || {}));
  console.log('Sample Leave:', lData[0]);

  const rRes = await fetch('http://127.0.0.1:8080/api/attendance-regularizations');
  const rData = await rRes.json();
  console.log('Regularizations Keys:', Object.keys(rData[0] || {}));
  console.log('Sample Reg:', rData[0]);
}
inspect();

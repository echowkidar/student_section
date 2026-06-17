fetch('http://localhost:3000/api/reports/hall-wise')
  .then(res => res.json())
  .then(data => {
    console.log(JSON.stringify(data).substring(0, 500));
  })
  .catch(err => {
    console.error(err);
  });

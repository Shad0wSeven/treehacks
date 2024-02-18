// https://matcha-v0.onrender.com/full-database



async function updateDatabase() {
	fetch('https://matcha-v0.onrender.com/full-database')
	.then(response => response.json())
	.then(data => console.log(data)
	
	
	);
  }

export default updateDatabase;
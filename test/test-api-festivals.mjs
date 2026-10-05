async function testRoute() {
  try {
    const res = await fetch("http://localhost:3000/api/festivals?countryCode=IN");
    const json = await res.json();
    console.log("API Response Status:", res.status);
    console.log("Festivals Count:", json.festivals?.length);
    console.log("Top upcoming festival:", json.festivals?.[0]);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testRoute();

async function test() {
  try {
    const res = await fetch('http://localhost:8000/api/briefs/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_uid: "zXj4Gq827RNDJ84R23m9" }) // wait, we don't know a real UID
    });
    const text = await res.text();
    console.log(res.status, text);
  } catch (e) {
    console.error(e);
  }
}
test();

let layers = [];
let input = {h: 32, w: 32, c: 3, rf: 1, jump: 1};

function reset() {
  input.h = parseInt(document.getElementById("height").value);
  input.w = parseInt(document.getElementById("width").value);
  input.c = parseInt(document.getElementById("channels").value);
  input.rf = 1;
  input.jump = 1;
  layers = [];
  render();
}

function updateForm() {
  const type = document.getElementById("layer-type").value;
  document.getElementById("conv-params").style.display =
    (type === "conv" || type.includes("pool")) ? "block" : "none";
  document.getElementById("fc-params").style.display =
    (type === "fc") ? "block" : "none";
}

function addLayer() {
  const type = document.getElementById("layer-type").value;
  let out_h, out_w, out_c;
  let rf = input.rf, jump = input.jump;

  if (type === "conv" || type.includes("pool")) {
    const k = parseInt(document.getElementById("kernel").value);
    const s = parseInt(document.getElementById("stride").value);
    const p = parseInt(document.getElementById("padding").value);

    out_h = Math.floor((input.h + 2*p - k) / s + 1);
    out_w = Math.floor((input.w + 2*p - k) / s + 1);
    out_c = input.c;
    rf = input.rf + (k - 1) * input.jump;
    jump = input.jump * s;

  } else if (type === "fc") {
    const units = parseInt(document.getElementById("units").value);
    out_h = 1;
    out_w = 1;
    out_c = units;
  }

  layers.push({
    name: type,
    out_shape: `${out_h}×${out_w}×${out_c}`,
    rf: `${rf}×${rf}`,
    jump: jump
  });

  input.h = out_h;
  input.w = out_w;
  input.c = out_c;
  input.rf = rf;
  input.jump = jump;

  render();
}

function removeLayer(index) {
  layers.splice(index, 1);
  recalcFromScratch();
  render();
}

function recalcFromScratch() {
  input.h = parseInt(document.getElementById("height").value);
  input.w = parseInt(document.getElementById("width").value);
  input.c = parseInt(document.getElementById("channels").value);
  input.rf = 1;
  input.jump = 1;

  const savedLayers = [...layers];
  layers = [];
  savedLayers.forEach(layer => {
    document.getElementById("layer-type").value = layer.name;
    if (layer.name === "fc") {
      document.getElementById("units").value = parseInt(layer.out_shape.split("×")[2]);
    }
    addLayer();
  });
}

function render() {
  const tbody = document.querySelector("#layers tbody");
  tbody.innerHTML = "";
  layers.forEach((layer, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${layer.name}</td>
      <td>${layer.out_shape}</td>
      <td>${layer.rf}</td>
      <td>${layer.jump}</td>
      <td><button onclick="removeLayer(${idx})">X</button></td>
    `;
    tbody.appendChild(row);
  });
}

reset();

document.addEventListener("DOMContentLoaded", () => {
    const beforeImg = document.getElementById("beforeImage");
    const afterImg = document.getElementById("afterImage");
    const imageUpload = document.getElementById("imageUpload");
    const filterSelect = document.getElementById("filterSelect");
    const applyBtn = document.getElementById("applyFilter");
    const filterMatrix = document.getElementById("filterMatrix");
    const customKernelDiv = document.getElementById("customKernelInputs");
    const heatmapDiv = document.getElementById("filterHeatmap");
  
    const filters = {
      blur: [
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9]
      ],
      sharpen: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
      ],
      edge: [
        [-1, -1, -1],
        [-1, 8, -1],
        [-1, -1, -1]
      ]
    };
  
    function showMatrix(matrix) {
      filterMatrix.innerHTML = "";
      matrix.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach(val => {
          const td = document.createElement("td");
          td.textContent = val.toFixed(2);
          tr.appendChild(td);
        });
        filterMatrix.appendChild(tr);
      });
    }
  
    function showHeatmap(matrix) {
      heatmapDiv.innerHTML = "";
  
      let min = Infinity, max = -Infinity;
      matrix.flat().forEach(v => {
        if (v < min) min = v;
        if (v > max) max = v;
      });
      if (min === max) { min -= 1; max += 1; }
  
      matrix.forEach(row => {
        row.forEach(val => {
          const cell = document.createElement("div");
          const norm = (val - min) / (max - min);
          const r = Math.floor(255 * norm);
          const b = Math.floor(255 * (1 - norm));
          cell.style.backgroundColor = `rgb(${r},0,${b})`;
          cell.style.width = "50px";
          cell.style.height = "50px";
          cell.style.display = "flex";
          cell.style.alignItems = "center";
          cell.style.justifyContent = "center";
          cell.style.color = "#fff";
          cell.textContent = val.toFixed(2);
          heatmapDiv.appendChild(cell);
        });
      });
    }
  
    function updateDisplay(matrix) {
      showMatrix(matrix);
      showHeatmap(matrix);
    }
  
    // Initialize
    updateDisplay(filters.blur);
  
    filterSelect.addEventListener("change", () => {
      let matrix;
      if (filterSelect.value === "custom") {
        customKernelDiv.style.display = "block";
        matrix = Array.from(document.querySelectorAll("#kernelTable tr")).map(tr =>
          Array.from(tr.querySelectorAll("input")).map(inp => parseFloat(inp.value) || 0)
        );
      } else {
        customKernelDiv.style.display = "none";
        matrix = filters[filterSelect.value];
      }
      updateDisplay(matrix);
    });
  
    imageUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) beforeImg.src = URL.createObjectURL(file);
    });
  
    applyBtn.addEventListener("click", async () => {
      let matrix;
      if (filterSelect.value === "custom") {
        matrix = Array.from(document.querySelectorAll("#kernelTable tr")).map(tr =>
          Array.from(tr.querySelectorAll("input")).map(inp => parseFloat(inp.value) || 0)
        );
      } else {
        matrix = filters[filterSelect.value];
      }
  
      const formData = new FormData();
      if (imageUpload.files[0]) formData.append("image", imageUpload.files[0]);
      formData.append("matrix", JSON.stringify(matrix));
  
      const response = await fetch("/apply_filter", {
        method: "POST",
        body: formData
      });
  
      const blob = await response.blob();
      afterImg.src = URL.createObjectURL(blob);
  
      updateDisplay(matrix);
    });
  });
  
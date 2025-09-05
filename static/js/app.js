document.addEventListener("DOMContentLoaded", () => {
    const beforeImg = document.getElementById("beforeImage");
    const afterImg = document.getElementById("afterImage");
    const imageUpload = document.getElementById("imageUpload");
    const filterSelect = document.getElementById("filterSelect");
    const applyBtn = document.getElementById("applyFilter");
    const filterMatrix = document.getElementById("filterMatrix");
  
    // Predefined filters
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
  
    // Display matrix in table
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
  
    // Show default matrix at startup
    showMatrix(filters.blur);
  
    // Update matrix when filter changes
    filterSelect.addEventListener("change", () => {
      const val = filterSelect.value;
      if (filters[val]) showMatrix(filters[val]);
    });
  
    // Preview uploaded image
    imageUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) beforeImg.src = URL.createObjectURL(file);
    });
  
    // Apply filter
    applyBtn.addEventListener("click", async () => {
      const val = filterSelect.value;
      const matrix = filters[val];
  
      const formData = new FormData();
      if (imageUpload.files[0]) formData.append("image", imageUpload.files[0]);
      formData.append("matrix", JSON.stringify(matrix));
  
      const response = await fetch("/apply_filter", {
        method: "POST",
        body: formData
      });
  
      const blob = await response.blob();
      afterImg.src = URL.createObjectURL(blob);
    });
  });
  
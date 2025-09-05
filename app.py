import io
import json
import numpy as np
from flask import Flask, render_template, request, send_file, url_for
from PIL import Image, ImageFilter
import os

app = Flask(__name__)

# Path to default image
DEFAULT_IMAGE_PATH = "static/default.jpg"

@app.route("/")
def index():
    default_image_url = url_for("static", filename="default.jpg")
    return render_template("index.html", image_url=default_image_url)

@app.route("/apply_filter", methods=["POST"])
def apply_filter():
    # Load uploaded image or fallback to default
    if "image" in request.files and request.files["image"].filename != "":
        image_file = request.files["image"]
        image = Image.open(image_file.stream).convert("RGB")
    else:
        image = Image.open(DEFAULT_IMAGE_PATH).convert("RGB")

    # Get filter matrix from POST
    matrix = json.loads(request.form["matrix"])
    kernel = np.array(matrix, dtype=float)
    size = kernel.shape[0]

    # Flatten and scale for Pillow
    kernel_flat = kernel.flatten()
    scale = kernel.sum()
    if scale == 0:
        scale = 1

    pil_kernel = ImageFilter.Kernel((size, size), kernel_flat, scale=scale)

    # Apply filter
    filtered = image.filter(pil_kernel)

    # Return filtered image as PNG
    buf = io.BytesIO()
    filtered.save(buf, format="PNG")
    buf.seek(0)
    return send_file(buf, mimetype="image/png")

def run_dev():
    app.run(debug=True)

if __name__ == "__main__":
    run_dev()

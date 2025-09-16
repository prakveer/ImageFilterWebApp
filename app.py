import io
import json
import numpy as np
import re
from flask import Flask, render_template, request, send_file, url_for, jsonify
from PIL import Image, ImageFilter
import google.generativeai as genai

app = Flask(__name__)

DEFAULT_IMAGE_PATH = "static/default.jpg"

# Configure GenAI (you'll need to set your API key)
genai.configure(api_key='our-api-key-here')  # Replace with your actual API key

@app.route("/")
def index():
    default_image_url = url_for("static", filename="default.jpg")
    return render_template("index.html", image_url=default_image_url)

@app.route("/apply_filter", methods=["POST"])
def apply_filter():
    # Load uploaded image or fallback
    if "image" in request.files and request.files["image"].filename != "":
        image_file = request.files["image"]
        image = Image.open(image_file.stream).convert("RGB")
    else:
        image = Image.open(DEFAULT_IMAGE_PATH).convert("RGB")

    # Get filter matrix
    matrix = json.loads(request.form["matrix"])
    kernel = np.array(matrix, dtype=float)
    size = kernel.shape[0]

    kernel_flat = kernel.flatten()
    scale = kernel.sum()
    if scale == 0:
        scale = 1

    pil_kernel = ImageFilter.Kernel((size, size), kernel_flat, scale=scale)
    filtered = image.filter(pil_kernel)

    buf = io.BytesIO()
    filtered.save(buf, format="PNG")
    buf.seek(0)
    return send_file(buf, mimetype="image/png")

@app.route("/generate_kernel", methods=["POST"])
def generate_kernel():
    try:
        user_request = request.json.get("request", "")
        if not user_request.strip():
            return jsonify({"error": "Please provide a description of the filter you want."}), 400

        # Create a detailed prompt for the AI
        prompt = f"""
        Generate a single 3x3 convolution kernel for image filtering based on this request: "{user_request}"

        Requirements:
        - Provide ONLY the 3x3 matrix values as 9 numbers
        - Use decimal numbers (can be negative, positive, or fractions)
        - Format: row1_col1, row1_col2, row1_col3, row2_col1, row2_col2, row2_col3, row3_col1, row3_col2, row3_col3
        - Example format: 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111

        After the matrix, provide a brief explanation starting with "EXPLANATION:" on how this kernel achieves the requested effect.

        Common kernel types for reference:
        - Blur: positive values that sum to 1
        - Sharpen: negative edges with positive center > sum of negatives
        - Edge detection: negative values around positive center, sum close to 0
        - Emboss: asymmetric with positive and negative values
        - Denoising: similar to blur but may have different weightings

        Request: {user_request}
        """

        # Generate content using Gemini
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        
        # Parse the response to extract the kernel values
        lines = response_text.split('\n')
        kernel_line = lines[0].strip()
        
        # Extract explanation
        explanation = ""
        for line in lines:
            if line.strip().startswith("EXPLANATION:"):
                explanation = line.replace("EXPLANATION:", "").strip()
                break
            elif "explanation" in line.lower() or "how" in line.lower():
                explanation = line.strip()
                break
        
        if not explanation:
            # Look for any explanatory text after the numbers
            for i, line in enumerate(lines[1:], 1):
                if line.strip() and not line.strip().replace(".", "").replace("-", "").replace(",", "").replace(" ", "").isdigit():
                    explanation = line.strip()
                    break
        
        # Parse kernel values
        kernel_values = []
        
        # Try to extract numbers from the first line
        numbers = re.findall(r'-?\d*\.?\d+', kernel_line)
        if len(numbers) >= 9:
            kernel_values = [float(num) for num in numbers[:9]]
        else:
            # Fallback: try to find numbers in the entire response
            all_numbers = re.findall(r'-?\d*\.?\d+', response_text)
            if len(all_numbers) >= 9:
                kernel_values = [float(num) for num in all_numbers[:9]]
            else:
                return jsonify({"error": "Could not parse kernel values from AI response"}), 500

        # Convert to 3x3 matrix
        kernel_matrix = [
            kernel_values[0:3],
            kernel_values[3:6], 
            kernel_values[6:9]
        ]
        
        return jsonify({
            "kernel": kernel_matrix,
            "explanation": explanation if explanation else "Custom kernel generated based on your request.",
            "raw_response": response_text
        })

    except Exception as e:
        return jsonify({"error": f"Error generating kernel: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
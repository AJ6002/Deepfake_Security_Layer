# app.py (Final Corrected Version)

import tensorflow as tf
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS # <-- 1. IMPORT CORS

import os
import traceback


# --- 1. Helper Function to Rebuild EfficientNet ---
def build_efficientnet_model():
    """
    Re-creates the architecture of the trained EfficientNet model to avoid loading issues.
    """
    from tensorflow.keras.applications import EfficientNetB0
    from tensorflow.keras import layers, models

    base_model = EfficientNetB0(weights=None, include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False

    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.5),
        layers.Dense(2, activation="sigmoid") # Based on your notebook's CONFIGURATION["NUM_CLASSES"]
    ])
    return model

# --- 2. Initialize Flask App ---
app = Flask(__name__)
CORS(app) # <-- 2. INITIALIZE CORS WITH YOUR APP


# --- 3. Load Models (Done only once on startup) ---
print("Loading models, this may take a moment...")
try:
    # Build the EfficientNet architecture first, then load only the weights
    efficientnet_model = build_efficientnet_model()
    efficientnet_model.load_weights('./deepfake (1).h5')

    models = {
        'xception': tf.keras.models.load_model('./140K_xception_model.keras'),
        'resnet50': tf.keras.models.load_model('./140K_resnet50_model.keras'),
        'efficientnet': efficientnet_model
    }
    print("All models loaded successfully!")
except Exception as e:
    print(f"FATAL ERROR loading models: {e}")
    print(traceback.format_exc())

# --- 4. Preprocessing Function (Corrected for all models) ---
def preprocess_image_for_model(img_pil, model_name):
    """Applies the correct preprocessing for a given model."""

    if model_name in ['xception', 'resnet50']:
        # Target size: (256, 256), Scaling: 1.0/255
        img_resized = img_pil.resize((256, 256))
        img_array = tf.keras.preprocessing.image.img_to_array(img_resized)
        img_array /= 255.0
        return np.expand_dims(img_array, axis=0)

    elif model_name == 'efficientnet':
        # CORRECTED: Target size: (224, 224), Scaling: 1./255
        img_resized = img_pil.resize((224, 224))
        img_array = tf.keras.preprocessing.image.img_to_array(img_resized)
        img_array /= 255.0
        return np.expand_dims(img_array, axis=0)
    else:
        raise ValueError(f"Unknown model name: {model_name}")

# --- 5. Create the API Endpoint ---
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        img_pil = Image.open(file.stream).convert('RGB')
        
        all_probs = {}
        for name, model in models.items():
            processed_img = preprocess_image_for_model(img_pil, name)
            pred = model.predict(processed_img)[0]
            prob_real = pred[1] if len(pred) > 1 else pred[0]
            all_probs[name] = float(prob_real)

        avg_prob_real = np.mean(list(all_probs.values()))
        final_prediction = "Real" if avg_prob_real >= 0.5 else "Fake"

        return jsonify({
            'final_prediction': final_prediction,
            'confidence_for_real': avg_prob_real,
            'individual_scores': all_probs
        })

    except Exception as e:
        # Log the detailed error to the server console
        print("--- AN ERROR OCCURRED DURING PREDICTION ---")
        print(f"Error: {str(e)}")
        print("Traceback:")
        print(traceback.format_exc())
        print("-----------------------------------------")
        return jsonify({'error': f'Could not process image: {str(e)}'}), 500

# --- 6. Run the App ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
import requests

# The local URL of your Flask API
API_URL = "http://127.0.0.1:5000/predict"

# --- UPDATE THIS PATH to an image on your computer ---
IMAGE_PATH = "abhi.jpg"
# ----------------------------------------------------

# Open the image file in binary mode
with open(IMAGE_PATH, 'rb') as image_file:
    # Prepare the file for the POST request
    files = {'file': image_file}

    # Send the request
    try:
        response = requests.post(API_URL, files=files)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Print the JSON response from the server
        print("API Response:")
        print(response.json())

    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
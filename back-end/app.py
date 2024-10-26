from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io


app = Flask(__name__)
CORS(app)

@app.post('/upload') # Will have to save the image in the server, assign an id to it and return the id
def upload():
    """
    Handles the upload of an image file from a request.
    This function performs the following steps:
    1. Retrieves the image file from the request.
    2. Converts the image file into a PIL (Python Imaging Library) image.
    3. Prints the format, size, and mode of the image.
    Returns:
        str: A success message indicating the image was processed.
    """
    # Get the image from the request
    file = request.files['image']   
    # Transform it into a PIL image
    image = Image.open(io.BytesIO(file.read()))
    print(image.format, image.size, image.mode) 
    

    return "Success"

@app.get('/image/<id>') # Will have to return the image with the id
def get_image(id):
    """
    Retrieves an image file from the server.
    Args:
        id (str): The ID of the image file.
    Returns:
        str: A success message indicating the image was retrieved.
    """
    return "Success"

@app.get('/images') # Will have to return all the images in the server
def get_images():
    """
    Retrieves all image files from the server.
    Returns:
        str: A success message indicating the images were retrieved.
    """
    return "Success"

if __name__ == "__main__":
    app.run(debug=True)
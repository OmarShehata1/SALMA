# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy requirements file into the container
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "from transformers import TrOCRProcessor; \
               TrOCRProcessor.from_pretrained('microsoft/trocr-large-handwritten',cache_dir='/models')" 

RUN python -c "from transformers import VisionEncoderDecoderModel; \
               VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-large-handwritten',cache_dir='/models')"

# Copy the entire application into the container
COPY . .

# Expose port 8121
EXPOSE 8080

# Command to run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--timeout", "965", "app:app"]

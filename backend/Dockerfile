FROM python:3.11

# Set the working directory in the container
WORKDIR /backend

# Copy the backend directory contents into the container at /backend
COPY . /backend

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 8000 and 443 available to the world outside this container
EXPOSE 8000 443

# Run the FastAPI application
CMD ["python", "-m", "app.main"]
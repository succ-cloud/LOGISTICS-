# README.md

# Global Track Backend

This project is the backend for the Global Track application, which provides tracking services for shipments. It is built using Node.js, Express, and MongoDB.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [License](#license)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/global-track-backend.git
   cd global-track-backend
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   ```

## Usage

To start the server, run the following command:
```bash
node server.js
```

The server will start on the specified port (default is 5000) and connect to the MongoDB database.

## API Endpoints

- **POST /track**: Create a new tracking entry.
  - Request Body:
    ```json
    {
      "trackingId": "GT-1234567",
      "sender": {
        "name": "Sender Name",
        "address": "Sender Address",
        "contact": "Sender Contact"
      },
      "receiver": {
        "name": "Receiver Name",
        "address": "Receiver Address",
        "contact": "Receiver Contact"
      },
      "location": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      }
    }
    ```

- **GET /track/:id**: Retrieve tracking information by tracking ID.

## Environment Variables

- `MONGODB_URI`: The connection string for your MongoDB database.
- `PORT`: The port on which the server will run (default is 5000).

## License

This project is licensed under the MIT License.
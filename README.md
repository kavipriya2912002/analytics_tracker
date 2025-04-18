# 📊 Analytics API

An Express-based REST API for uploading sales CSV data, refreshing analytics, and retrieving insights such as revenue, customer statistics, and profit margins.

## 🚀 Getting Started

### 1. Clone the Repository
Clone the repository to your local machine:
```git clone <your-repo-url>```
```cd <your-project-folder>```


### 2. Install Dependencies
Install the required dependencies:
```npm install```

### 3. Configure Environment Variables
Create a .env file in the root folder and add your MongoDB URI:
```MONGO_URI=mongodb+srv://<your-mongodb-uri>```

### 4. Start the Server
Run the server locally:
```npm start```

### 📂 API Endpoints
All endpoints are prefixed with /api/analytics.

### 🔄 POST /upload
Description: Upload a CSV file containing sales data.

### Headers:

Content-Type: multipart/form-data

### Body:
{
  "file": "<Your CSV file>"
}
### Response:
{
  "message": "CSV uploaded successfully"
}
### 🔁 POST /refresh
Description: Deletes all existing records and reloads the data from a CSV file stored in the server.

### Body or Query:

{
  "csvPath": "path/to/your/file.csv"
}
### Response:

{
  "message": "Analytics data refreshed successfully"
}
### 💰 GET /revenue
Description: Returns total revenue generated from sales.

Response:
{
  "totalRevenue": 123456.78
}
### 👤 GET /customer-order-stats
Description: Returns analytics about customers and orders like total customers, total orders, and average order value.

### Response:

{
  "totalCustomers": 500,
  "totalOrders": 1200,
  "averageOrderValue": 104.50
}
### 📦 GET /profit-margin
Description: Returns the profit margin for each product.

### Response:

[
  {
    "productName": "Product A",
    "revenue": 5000,
    "cost": 3000,
    "profitMargin": 40
  },
  {
    "productName": "Product B",
    "revenue": 7500,
    "cost": 4200,
    "profitMargin": 44
  }
]
### 🛠 Folder Structure

├── controller/
│   └── analysisController.js
├── routes/
│   └── analysisRoutes.js
├── utils/
│   └── loader.js
├── app.js
└── README.md



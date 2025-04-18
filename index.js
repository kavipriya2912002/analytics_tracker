import express from "express";
import dotenv from "dotenv";
import ConnectDB from "./Configs/db.js";
import analysisRoutes from "./Routes/analysisRoutes.js"
dotenv.config();
ConnectDB();
const app = express();
app.use(express.json());
const PORT= 3000  || process.env.PORT;
app.get('/',(req,res)=>{
    res.send("API is running");
});
app.use('/api/analytics', analysisRoutes);
app.listen(PORT,console.log(`Server listening to port ${PORT}`));

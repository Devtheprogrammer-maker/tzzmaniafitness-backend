import pkg from "pg";
import "dotenv/config";

const { Pool } = pkg;

//Creating a pool connection for the database
export const pool = new Pool(
    {
        connectionString: process.env.DATABASEURL
    }
)

//Checks DB connection
pool.query("SELECT NOW()").then(() => console.log("Connected to postgress")).catch((err) => console.error("Postgress Connection Failed: ", err.message));

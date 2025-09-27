import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'bdincidencias',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

export type QueryResult = mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader;
export type InsertResult = mysql.ResultSetHeader;

export async function query(sql: string, params?: any[]): Promise<any[]> {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows as any[];
    } catch (error) {
        console.error('Error en la consulta:', error);
        throw error;
    }
}

export async function execute(sql: string, params?: any[]): Promise<InsertResult> {
    try {
        const [result] = await pool.execute(sql, params);
        return result as InsertResult;
    } catch (error) {
        console.error('Error en la ejecución:', error);
        throw error;
    }
}

export default pool;
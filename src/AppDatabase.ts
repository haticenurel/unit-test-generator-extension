import * as sqlite3Lib from 'sqlite3';
import { open, Database } from 'sqlite';
import * as path from 'path';

const sqlite3 = sqlite3Lib.verbose();

export default class AppDatabase {
  private db: sqlite3Lib.Database | null = null;

  constructor() {
    this.db = null;
    this.connect(); // Connect to database on object creation
  }

  connect() {
    const dbPath = path.join(__dirname, '../db/mydb.sqlite3');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        throw new Error('Database connection not established.');
      }
      console.log('Connected to the SQLite database.');
    });
  }

  async addEmailColumn() {
    if (!this.db) {
      throw new Error('Database connection not established');
    }
  
    try {
      await this.db.run(`
        ALTER TABLE developers ADD COLUMN email TEXT
      `);
      console.log('Email column added to developers table.');
    } catch (error) {
      console.error('Could not add email column: ', error);
    }
  }


async createTable() {
  if (!this.db) {
    throw new Error('Database connection not established');
  }

  try {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS developers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT
      )
    `);
    console.log('Developers table created.');
  } catch (error) {
    console.error('Could not create developers table: ', error);
  }
}

  async insertDeveloper(nameInput: string, emailInput: string) {
    if (!this.db) {
      throw new Error('Database connection not established');
    }

    // Generate a random ID
  const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

  try {
    await this.db.run(`
      INSERT INTO developers (id, name, email) VALUES (?, ?, ?)
    `, id, nameInput, emailInput);
    } catch (error) {
      console.error('Could not insert developer: ', error);
    }
  }


  async createConfigurationsTable() {
    if (!this.db) {
      throw new Error('Database connection not established');
    }
  
    try {
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS configurations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          oa_api_key TEXT,
          test_path BOOLEAN,
          unit_test BOOLEAN,
          integration_test BOOLEAN,
          developer_id INTEGER,
          generated_unit_test_id INTEGER,
          FOREIGN KEY(developer_id) REFERENCES developers(id),
          FOREIGN KEY(generated_unit_test_id) REFERENCES generated_unit_tests(id)
        )
      `);
      console.log('Configurations table created.');
    } catch (error) {
      console.error('Could not create configurations table: ', error);
    }
  }

  async insertConfigurationsTable(oaApiKeyInput: string) {
    if (!this.db) {
      throw new Error('Database connection not established');
    }

    // Generate a random ID
    const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    try {
      await this.db.run(`
        INSERT INTO configurations (id, oa_api_key) VALUES (?, ?)
      `, id, oaApiKeyInput);
    } catch (error) {
      console.error('Could not insert configurations: ', error);
    }
  }
}




const db = new AppDatabase();
db.connect();
//db.addEmailColumn();
db.createTable();
db.createConfigurationsTable();
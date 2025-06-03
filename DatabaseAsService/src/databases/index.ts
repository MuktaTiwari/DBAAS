
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER, NODE_ENV } from '@/config';
import consumerUnitDataModel, { ConsumerUnitDataModel } from '@/models/consumerUnit.model';
import databaseCollectionModel from '@/models/databaseCollection.model';
import organizationModel from '@/models/organization.model';
import tableModel from '@/models/table.model';
import usersModel from '@/models/users.model';
import walletModel, { Walletmodel } from '@/models/wallet.model';
import { Sequelize } from 'sequelize';

export async function createSequelizeInstance(dbname: string) {
  return new Sequelize(dbname, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: 'postgres',
    logging: false,
  });
}

async function createDatabaseIfNotExists() {
  const tempSequelize = new Sequelize('postgres', DB_USER!, DB_PASSWORD!, {
    dialect: 'postgres',
    host: DB_HOST!,
    port: Number(DB_PORT),
    logging: false,
  });

  try {
    await tempSequelize.query(`CREATE DATABASE ${DB_DATABASE!}`, { raw: true });
    console.log(`Database ${DB_DATABASE!} created successfully.`);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log(`Database ${DB_DATABASE!} already exists.`);
    } else {
      console.error('Error creating database:', error);
      throw error;
    }
  } finally {
    await tempSequelize.close();
  }
}

export const sequelize = new Sequelize(DB_DATABASE!, DB_USER!, DB_PASSWORD!, {
  dialect: 'postgres',
  host: DB_HOST!,
  port: Number(DB_PORT),
  timezone: '+05:30',
  define: {
    underscored: true,
    freezeTableName: true,
  },
  pool: {
    min: 0,
    max: 5,
  },
  logQueryParameters: NODE_ENV === 'development',
  logging: (query, time) => {
    console.log(`${time}ms ${query}`);
  },
  benchmark: true,
});

export const DB = {
  OrganizationModel: organizationModel(sequelize),
  UserModel: usersModel(sequelize),
  DatabaseCollectionModel: databaseCollectionModel(sequelize),
  TableModel: tableModel(sequelize),
  Walletmodel: walletModel(sequelize),
  ConsumerUnitDataModel: consumerUnitDataModel(sequelize),
  sequelize,
  Sequelize,
};

async function initializeDatabase() {
  try {
    // Optionally create database if not exists
    // await createDatabaseIfNotExists();
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    // Uncomment to sync models if needed
    // await sequelize.sync({ alter: true });
    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to or sync the database:', error);
    throw error;
  }
}

initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

export { initializeDatabase };
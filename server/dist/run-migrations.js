"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const data_source_1 = require("./data-source");
async function run() {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
        }
        const migrations = await data_source_1.AppDataSource.runMigrations();
        console.log(`Executed migrations:`, migrations.map((m) => m.name));
        await data_source_1.AppDataSource.destroy();
        process.exit(0);
    }
    catch (err) {
        console.error('Migration run failed:', err);
        process.exit(1);
    }
}
run();
//# sourceMappingURL=run-migrations.js.map
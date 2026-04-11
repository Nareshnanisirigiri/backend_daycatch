import { listCollectionModels } from "../models/collectionRegistry.js";
console.log(JSON.stringify(listCollectionModels(), null, 2));
process.exit(0);

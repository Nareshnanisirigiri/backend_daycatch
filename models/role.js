import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, mixed } = types;

export default createCollectionModel("Role", "roles", {
    name: string,
    permissions: mixed
});

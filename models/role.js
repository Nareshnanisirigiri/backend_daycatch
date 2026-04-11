import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("Role", "roles", {
    role_id: {
        type: types.number, // Sequelize DataTypes.INTEGER
        primaryKey: true,
        autoIncrement: true,
    },
    role_name: string
}, { timestamps: false });

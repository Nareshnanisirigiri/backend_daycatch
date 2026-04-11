import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("DriverIncentive", "driver incentive", {
    status: string,
    details: mixed
});

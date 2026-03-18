import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("TermsAndConditions", "termsAnd Conditions", {
    "Terms & Condition": string
});

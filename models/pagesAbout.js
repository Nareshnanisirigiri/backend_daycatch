import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("PagesAbout", "pages About", {
    "About Us": string
});

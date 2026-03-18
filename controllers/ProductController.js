import Product from "../models/product.js";

export async function createProduct(req, res) {
    try {
        const product = new Product(req.body);
        await product.save();

        return res.status(201).json(product);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export async function getProducts(req, res) {
    try {
        const products = await Product.find();
        return res.json(products);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

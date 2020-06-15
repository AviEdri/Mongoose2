const mongoose = require("mongoose");


// THE NAMES MUST (!) BE IDENTICAL TO THE ONES IN THE DB (MONGO) 
// DOESN'T HAVE TO COVER THE FULL DOCUMENT, BUT VARIABLE MUST HAVE IDENTICAL NAMES
const categorySchema = mongoose.Schema({
    categoryName: String,
}, { versionKey: false });

// Create category model: 
const Category = mongoose.model("Category", categorySchema, "categories");


// Connect to the database: 
mongoose.connect("mongodb://localhost:27017/Northwind",
    { useNewUrlParser: true, useUnifiedTopology: true }, (err, mongoClient) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log("We're connected to " + mongoClient.name + " database on MongoDB...");
    });



// Create a schema for a product: 
// THE NAMES MUST (!) BE IDENTICAL TO THE ONES IN THE DB (MONGO) 
const productSchema = mongoose.Schema({
    name: String,
    price: Number,
    stock: Number,
    productCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" } // Relation = Foreight Key
}, { versionKey: false });

const Product = mongoose.model("Product", productSchema, "products"); // Model, Schema, Collection

// -----------------------------------------------------------------------

// Extract all the products 
// Add the category to each product 
// Only add the category name and omit the _id (which returns by default)
async function getAllProducts() {   
       return await Product.find()

                           // Like an automatic join with the categories document
                            // fetch just category name and omit _id
                            .populate('productCategory', '+categoryName -_id')              
                            
                            // Another version, works here but not in other cases:
                            // Bring everything "but" _id
                            //.populate('productCategory', '-_id')
                            
                            .select('name id productCategory');
}


// Extract all the products, yet only extract "name" and "price"
async function getAllProductsSelectedData() {   
    return await Product.find().select('name price');    
}

// Find Category Name by category id
function getCategoryName(_id) {
    return new Promise((resolve, reject) => {
        Category.findById({ _id }, (err, category) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(category.name);
        });
    });
}

// Extract a product using the id
function getOneProduct(_id) {
    return new Promise((resolve, reject) => {
        Product.findById(_id, (err, product) => {
            if (err) return reject(err);
            resolve(product);
        });
    });
}


// Adding a product object which includes a new category
// in this case we'd like to save them both
function addProductWithCascadeSaveOnCategory(product) {
    return new Promise((resolve, reject) => {
        
        // First we generate a category model, based on the json inside product
        const categoryModel = new Category(product.category);

        // We save the category
        let savedCategory = categoryModel.save((err, res) => 
            {
                // If the category save failed, we abort
                if (err) return handleError(err);
             
                // Category save had succeeded, and so we extract the auto 
                // generated id from the result (res)
                product.productCategory = res._id;

                // We create a new product model using the parameter "product"
                const productModel = new Product(product);                
        
                // We save 
                productModel.save((err, prod) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(prod);
                });
            });
            }


        );

       
}

function updateProduct(product) {
    return new Promise((resolve, reject) => {
        const productModel = new Product(product);

        // Update the product model using its id
        Product.updateOne({ _id: product._id }, productModel, (err, info) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(productModel);
        });
    });
}

function deleteProduct(_id) {
    return new Promise((resolve, reject) => {
        // Delete the product model using its id 
        Product.deleteOne({ _id }, (err, info) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

module.exports = {
    getAllProducts,
    getOneProduct,
    addProduct: addProductWithCascadeSaveOnCategory,
    updateProduct,
    deleteProduct
};
const express= require("express");
const app= express();
const cors= require("cors");
const mongoose= require("mongoose");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//middlewares
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'))

//Multer storage configuration
const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/'); // Destination folder for storing uploaded files
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname)); // Use a unique filename to avoid conflicts
        }
});

// Multer upload initialization
const upload = multer({ storage: storage });
//const upload = multer({});

//schema design
const productSchema = mongoose.Schema({
name: {
    type: String,
    required: [true,"Please provide a name for this product"],
    trim: true,
    unique: [true, "Name must be unique"],
    minLength:[3, "Name must be at least 3 characters."],
    maxLength:[100,"Name is too large"]

},
description:{
    type: String,
    required : true
},
price:{
    type: Number,
    required : true,
    min: [0, "Price can't be negative"],

},
    unit:{
    type: String,
    required: true,
    enum:{
    values:["kg", "litre", "pcs"],
    message: "unit value can't be {VALUE}, must be kg/litre/pcs "
}
},
quantity:{
        type: Number,
        required: true,
        min: [0, "Quantity can't be negative"],
        validate:{
        validator: (value)=>{
        const isInteger = Number.isInteger(value);
        if(isInteger){
                true
        } else{
                return false
        }
    }

},
    message: "Quantity must be an integer"
},
status:{
type: String,
    enum:{
    values: ["in-stock", "out-of-stock", "discontinued"],
    message:"status can't be {VALUE}"
}
},
// supplier:{
// type: mongoose.Schema.Types.ObjectId,
// ref: "Supplier"
// },
// categories: [{
// name:{
// type: String,
// required: true,
// },
// _id: mongoose.Schema.Types.ObjectId
// }]

image: {
    type: String // Store the path to the uploaded image
},

multipleImages: [{
    type: String // Store the path to the uploaded image
}]


},{
    timestamps: true
})

// SCHEMA->MODEL->QUERY

const Product=mongoose.model('Product',productSchema);


app.get("/",(req,res)=>{
    res.send("Route is working! YaY!");
});

app.post("/api/v1/product", upload.array('photos[]'), async (req, res, next) => {
    try {
        // Array to store Cloudinary image URLs
        const cloudinaryImageUrls = [];

        // Loop through each file and upload to Cloudinary
        for (const file of req.files) {
            const result = await cloudinary.uploader.upload(file.path);
            cloudinaryImageUrls.push(result.secure_url);
        }

        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            unit: req.body.unit,
            quantity: req.body.quantity,
            status: req.body.status,
            multipleImages: cloudinaryImageUrls // Save the multiple image URLs to the 'multipleImages' field
        });

        // Save the product to the database
        await product.save();

        res.json({
            message: "Product uploaded successfully!",
            product: product // Send the uploaded product details
        });
    } catch (error) {
        console.error("Error uploading product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// app.post("/api/v1/product", upload.single('avatar') ,upload.array('photos[]'), async (req, res, next) => {
//     try {
//         const result = await cloudinary.uploader.upload(req.file.path);
//         const product = new Product({
//         name: req.body.name,
//         description: req.body.description,
//         price: req.body.price,
//         unit: req.body.unit,
//         quantity: req.body.quantity,
//         status: req.body.status,
//         image: result.secure_url // Store the Cloudinary image URL
//     });

//     // Array to store Cloudinary image URLs
//     const cloudinaryImageUrls = [];

//     // Loop through each file and upload to Cloudinary
//     for (const file of req.files) {
//         const result = await cloudinary.uploader.upload(file.path);
//         cloudinaryImageUrls.push(result.secure_url);
//     }

//     // Save the Cloudinary image URLs array directly to the product
//     product.multipleImages = cloudinaryImageUrls;

//     // Save the product to the database
//     await product.save();

//     res.json({
//         message: "Product uploaded successfully!",
//         product: product // Send the uploaded product details
//     });
//     } catch (error) {
//         console.error("Error uploading product:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
//     });


app.post("/api/v1/product/singleImage", upload.single('avatar') , async(req,res,next)=>{

    try {

                const result = await cloudinary.uploader.upload(req.file.path);

                const product = new Product({
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                unit: req.body.unit,
                quantity: req.body.quantity,
                status: req.body.status,
                image: result.secure_url // Store the Cloudinary image URL

    });

    // Save the product to the database
    await product.save();


        res.json({
                message: "Product uploaded successfully!",
                product: product // Send the uploaded product details
        });
    } catch (error) {
        console.error("Error uploading product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
    })

module.exports = app;

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilePath) => {
  try {
    if (!localfilePath) return null;
    //upload file on Cloudinary
    const responce = await cloudinary.uploader.upload(localfilePath, {
      resource_type: "auto",
    });
    //file uploaded successfuly, now we will remove local copy of file
    console.log("file uploaded on cloudinary", responce.url);
    return responce;
  } catch (error) {
    fs.unlinkSync(localfilePath); //remove the locally saved temporary file if any error happen(upload operation failed)
    console.log("upload operation failed");
    return null;
  }
};

// cloudinary.uploader.upload(
//   "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function (error, result) {
//     console.log(result);
//   }
// );


export {uploadOnCloudinary}
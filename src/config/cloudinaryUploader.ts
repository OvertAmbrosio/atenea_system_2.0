import { v2, UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET
});

export default function uploads (file: string, folder: string){
    return new Promise( async (resolve, reject) => {
      await v2.uploader.upload(file, {
          resource_type: "auto",
          folder: folder
        }, async function(e, result: UploadApiResponse|any) {
          if(e) reject(e);
          resolve({
            url: result.secure_url,
            id: result.public_id
          });
      })
    })
}
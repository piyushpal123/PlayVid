import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

(async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadOnCloudinary = async (localfilepath)=>{

        if(!localfilepath)return null;
        try {
          const response =  await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto"
           })

           //file successful upload 
           console.log("file is uploaded ",response.url);
           return response;

           
            
        } catch (error) {
        fs.unlinkSync(localfilepath)
          
       
            
        

    }
}

})
export {uploadOnCloudinary}

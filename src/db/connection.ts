import mongoose from 'mongoose';

const url = 'mongodb://localhost/ecommerce_app';

export const connection = async()=>{
    try{
        await mongoose.connect(url)
        console.log("Succesfully connected to the db");
        
    }catch(e){
        console.log(e,"ERRRRRR");
    }

}
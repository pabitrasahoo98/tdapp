const express= require('express')
const mongoose= require('mongoose')
const jwt=require('jsonwebtoken')
const cors= require('cors')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const cloudinary = require('cloudinary')
const fs= require('fs')


const app=express()
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(fileUpload({limit:{fileSize:50*1024*1024},useTempFiles:true,}))
app.use(cors())
app.use(express.json())


cloudinary.config({
    cloud_name:"dav142uln",
    api_key:"176466534952543",
    api_secret:"KHL0YgJhfO5Ctv5cgzumUWqlJ-g",
})

mongoose.connect("mongodb+srv://pabitrachin2:Pabitrachintu@cluster0.vll6tov.mongodb.net/?retryWrites=true").then(()=>{
    console.log("connected to mongodb successfully")}).catch((err)=>{console.log(err)})


const userSchema=new mongoose.Schema({

    name:{
        type: String,
        required: true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
        minlength:[8,"password must be least 8 character long"],
        select:false,
    },
    avatar:{
        public_id:String,
        uri:String,
    },
    createdAt:{
        type:String,
        default:Date.now,
    },
    tasks:[
        {
        title:"String",
        description:"String",
        completed:Boolean,
        createdAt:Date,
    }
],


});



const  User= mongoose.model("users",userSchema)

app.get('/',async(req,res)=> {
  try{

res.send("server is running")

}catch(error){
 res.status(500).json({success:false,messege:error.message});
}
})




app.post('/register',async(req,res)=> {
     try{
    const{name,email,password}=req.body;
    const avatar=req.files.avatar.tempFilePath;
    let user=await User.findOne({email});
    if(user){
        return res.status(400).json({success:false,messege:"user already exist"});
    }
    const mycloud=await cloudinary.v2.uploader.upload(avatar,{folder:"todoApp",});
    fs.rmSync("./tmp",{recursive:true});

    user= await User.create({name,email,password,avatar:{public_id:mycloud.public_id,uri:mycloud.secure_url,}});

    const token=jwt.sign({_id:user._id},"vjhvmkjbjkbjkbkj",{expiresIn:"1d"});

    const userData={
        _id:user._id,
        name:user.name,
        email:user.email,
        avatar:user.avatar,
        tasks:user.tasks,
    }


res.cookie("token",token).json({success:true,userData})


}catch(error){
    res.status(500).json({success:false,messege:error.message});
 }
})


app.post('/login',async(req,res)=> {
    try{
   const{email,password}=req.body;
   let user=await User.findOne({email}).select("+password");
   if(!user){
       return res.status(400).json({success:false,messege:"invalid user and password"});
   }

  if(user.password!==password){
    return res.status(400).json({success:false,messege:"invalid user and password"})
  }

   const token=jwt.sign({_id:user._id},"vjhvmkjbjkbjkbkj",{expiresIn:"1d"});

   const userData={
       _id:user._id,
       name:user.name,
       email:user.email,
       avatar:user.avatar,
       tasks:user.tasks,
   }


res.cookie("token",token).json({success:true,userData})

}catch(error){
   res.status(500).json({success:false,messege:error.message});
}
})

app.post('/addtask',async(req,res)=> {
    try{
        const { token } = req.cookies;

        if (!token) {
          return res.status(401).json({ success: false, message: "Login First" });
        }
    
        const decoded = jwt.verify(token,"vjhvmkjbjkbjkbkj" );

        const { title, description } = req.body;

        let user = await User.findById(decoded._id);
    
        user.tasks.push({
          title,
          description,
          completed: false,
          createdAt: new Date(Date.now()),
        });

        
    await user.save();

    res.status(200).json({ success: true, message: "Task added successfully" });


}catch(error){
   res.status(500).json({success:false,messege:error.message});
}
})



app.delete('/task/:taskId',async(req,res)=> {
    try {
        const { token } = req.cookies;

        if (!token) {
          return res.status(401).json({ success: false, message: "Login First" });
        }
    
        const decoded = jwt.verify(token,"vjhvmkjbjkbjkbkj" );

      const { taskId } = req.params;
  
      let user = await User.findById(decoded._id);
  
      user.tasks = user.tasks.filter(
        (task) => task._id.toString() !== taskId.toString()
      );
  
      await user.save();
  
      res
        .status(200)
        .json({ success: true, message: "Task removed successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })



  app.get('/task/:taskId',async(req,res)=> {
    try {
        const { token } = req.cookies;

        if (!token) {
          return res.status(401).json({ success: false, message: "Login First" });
        }
    
        const decoded = jwt.verify(token,"vjhvmkjbjkbjkbkj" );

      const { taskId } = req.params;
  
      let user = await User.findById(decoded._id);
  
      user.task = user.tasks.find(
        (task) => task._id.toString() === taskId.toString()
      );
  
      user.task.completed = !user.task.completed;
  
      await user.save();
  
      res
        .status(200)
        .json({ success: true, message: "Task Updated successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })


  app.get('/me',async(req,res)=> {
    try {

        const { token } = req.cookies;

        if (!token) {
          return res.status(401).json({ success: false, message: "Login First" });
        }
    
        const decoded = jwt.verify(token,"vjhvmkjbjkbjkbkj" );

      const user = await User.findById(decoded._id);

      
    const token1=jwt.sign({_id:user._id},"vjhvmkjbjkbjkbkj",{expiresIn:"1d"});
    res.cookie("token",token1).json({success:true,user})
  
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })

app.put('/updateprofile',async(req,res)=> {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ success: false, message: "Login First" });
    }

    const decoded = jwt.verify(token,"vjhvmkjbjkbjkbkj" );
    const user = await User.findById(decoded._id);

    const { name } = req.body;
    const avatar = req.files.avatar.tempFilePath;

    if (name) user.name = name;
    if (avatar) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);

      const mycloud = await cloudinary.v2.uploader.upload(avatar,{folder:"todoApp",});

      fs.rmSync("./tmp", { recursive: true });

      user.avatar = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      };
    }

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Profile Updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
})


  app.put('/updatepassword',async(req,res)=> {
    try {

        const { token } = req.cookies;

        if (!token) {
          return res.status(401).json({ success: false, message: "Login First" });
        }
    
        const decoded = jwt.verify(token,"vjhvmkjbjkbjkbkj" );

      const user = await User.findById(decoded._id).select("+password");
  
      const { oldPassword, newPassword } = req.body;
  
      if (!oldPassword || !newPassword) {
        return res
          .status(400)
          .json({ success: false, message: "Please enter all fields" });
      }
  
  
      if (user.password!==oldPassword) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Old Password" });
      }
  
      user.password = newPassword;
  
      await user.save();
  
      res
        .status(200)
        .json({ success: true, message: "Password Updated successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })




app.get('/logout',async(req,res)=> {
    try{

res.cookie("token",null,{expires:new Date(Date.now())}).json({success:true,messege:"log out succesfully"})

}catch(error){
   res.status(500).json({success:false,messege:error.message});
}
})




app.listen(4000,()=>{console.log("server is running")})
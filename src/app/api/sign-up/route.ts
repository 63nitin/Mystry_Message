import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
    await dbConnect()

    try{
       const {username, email,password} = await request.json()
       const existingUserVerifiedByUsername = await
       UserModel.
       findOne({
        username,
        isverified: true
       })
       if(existingUserVerifiedByUsername){
        return Response.json({
            success: false,
            message:"Username is already taken"
        },{status: 400})
       }

       const existingUserByEmail = await UserModel.findOne({email})
        const verifyCode = Math.floor(10000 + Math.random() * 90000).toString()
       

       if(existingUserByEmail){
        if(existingUserByEmail.isverified){
            return Response.json({
                success: false,
                message: "User already exist with this email"
            },{status: 400})
        } else {
            const hasedPassword = await bcrypt.hash(password,10)
            existingUserByEmail.password = hasedPassword;
            existingUserByEmail.verifyCode = verifyCode;
            existingUserByEmail.verifyExpiry = new
            Date(Date.now() + 3600000)
            await existingUserByEmail.save()
        }
       }else{
         const hasedPassword = await bcrypt.hash(password,10)
         const expiryDate = new Date()
         expiryDate.setHours(expiryDate.getHours() + 1)
        
       const newUser =  new UserModel({
            username,
            email,
            password: hasedPassword,
            verifyCode,
            verifyExpiry:expiryDate,
            isverified: false,
            isAcceptinMessage: true,
            messages:[]
         })

         await newUser.save()

       }

       // send verification mail

     const emailResponse =   await sendVerificationEmail(
        email,
        username,
        verifyCode
       )

       if(!emailResponse.success){
        return Response.json({
            success: false,
            message: emailResponse.message
        },{status:500})
       }

       return Response.json({
        success: true,
        message: "User registered successfully. Please verify your email"
       }, {status:201})


    } catch(error){
        console.error('Error registering usr', error)
        return Response.json(
            {
            success: false,
            message: "Error registering user"
            },
            {
                status:500
            }
    )
    }
}


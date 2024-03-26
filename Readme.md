npm init
mkdir public
cd public
mkdir temp
cd > .gitkeep


cd ..

cd >.env
cd > .gitignore
cd > Readme.md

mkdir src
cd src
cd > index.js


now first of all ,we will start creating server in index.js
we need to import express,doteenv/config and mongoose to checkk whether server is running or not😎😎

for initializing DB and Server we will use IIFE- (....)()
IIFE stands for immediately invoked functtion expression

//Dotenv
to access .env file data
1. import 'dotenv/config'
2. In package.json
   "start":"node -r dotenv/config --experimental-json-modules src/index.js"
   In index.js
   import dotenv from 'dotenv'
   dotenv.config({
path:'./env'     //relative .env file path
   })


   //middlewares
   enables communication and data management for applications. by using conditiond(if-else)
   1.cors
   2.cookie-parser
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, //give acces to urls
    credentials:true
  })
);
app.use(express.json({limit:"20kb"}))    //limit of json data file
app.use(express.urlencoded({extended:true,limit:"20kb"}))
app.use(express.static("public"))        //to run the file(./dist) or store the jpg/png,  public file can also be ./dist folder
app.use(cookieParser())                  //to access the cookies of users

app.get(err,req,res,next)   //next is the middleware

//IN utils
In ApiErrors.js
we will create a subclass ApiErrors to Overwrite the InBuild Nodejs ERROR(class ApiError extends Error)

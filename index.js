const express=require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const cors=require('cors');
const admin = require("firebase-admin");
const ObjectId=require('mongodb').ObjectId;
const app=express();
const port = process.env.PORT || 5000;


// const serviceAccount = require('./apartment-sales-web-firebase-adminsdk-9tisd-c9295ab6fe.json');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wl8pl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];

      try {
          const decodedUser = await admin.auth().verifyIdToken(token);
          // console.log(decodedUser.email);
          req.decodedEmail = decodedUser.email;
      }
      catch {

      }

  }
  next();
}


//DB Start
async function run() {
    try {
      await client.connect();
      const database = client.db("qxygenSales");
      const planCollection = database.collection("plans");
      const reviewCollection =database.collection("reviews");
      const orderCollection = database.collection("order");
      const usersCollection = database.collection('users');
      const adminCollection = database.collection('admin');
      //GET Plans
      app.get('/plans',async(req,res)=>{
        const cursor=planCollection.find({});
        const plans= await cursor.toArray();
        res.send(plans);
    })

    //Check admin
    app.get('/isAdmin', async (req,res)=>{
      const email = req.query.email;
      if(email){
        const cursor = adminCollection.find({email: email})
      const isAdmin = await cursor.toArray();
      res.send(isAdmin.length > 0);
      }
    })
    //Check admin

    //GET Order
      app.get('/order',verifyToken,async(req,res)=>{
        console.log(req.decodedEmail);
        console.log(req.query.email);
        if(req.decodedEmail && req.query.email === req.decodedEmail){
          const cursor=orderCollection.find({});
          const orders= await cursor.toArray();
          res.send(orders);
        }
        else{
          res.status(401).json([{message: 'Unauthorized'}])
        }
        

        
    })
    //GET Order by email
      app.get('/order/:email',async(req,res)=>{
        const email=req.params.email;
        console.log(email);
        const cursor=orderCollection.find({});
        const orders= await cursor.toArray();
        console.log(orders);
        const filteredOrder=orders.filter(order =>order.customerEmail === email);
        res.send(filteredOrder)
    })
    //POST API Add new Order
    app.post('/order', async(req,res)=>{
      const order=req.body;
      console.log("hit the post",req.body);
      const result=await orderCollection.insertOne(order);
      console.log(result);
      res.json(result);
    })
    //POST API -(Post a new service)
    app.post('/plan', async(req,res)=>{
      const plan=req.body;
      console.log("hit the post",req.body);
      const result=await planCollection.insertOne(plan);
      console.log(result);
      res.json(result);
    })
    //service delete
    app.delete('/plan/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await planCollection.deleteOne(query);
      res.json(result);
  })

  app.post('/review',async(req,res)=>{
    const review=req.body;
      console.log("hit the post",req.body);
      const result=await reviewCollection.insertOne(review);
      console.log(result);
      res.json(result);
  })
  app.get('/review',async(req,res)=>{
    const cursor=reviewCollection.find({});
    const reviews= await cursor.toArray();
    res.send(reviews);
})

// Show Users 
app.get('/users',async(req,res)=>{
  const cursor=usersCollection.find({});
  const users= await cursor.toArray();
  res.send(users);
})


app.post('/users', async(req,res)=>{
  const cursor=usersCollection.find({});
  const userList= await cursor.toArray();
  const user=req.body;
  console.log("Old Users",userList);
  const alreadyExist=userList.filter(us =>us.email === user.email);
  console.log("match ",alreadyExist);
 if(alreadyExist.length === 0){
  const result=await usersCollection.insertOne(user);
  console.log("Inserting",result);
  res.json(result);
 }
  console.log("New Users",user);
//   userList.map(async (oldUser)=>{
//     if(oldUser.email !== user){
//       const result=await usersCollection.insertOne(user);
//       console.log(result);
//       res.json(result);
    
//     }
//     else{
//       console.log("matched");
//       await res.status(401).json([{message: 'Unauthorized'}])
//       }   
//   })
})



app.put('/users/:id', async (req, res) => {
  const id = req.params.id;
  const oldUser = req.body;
  console.log(oldUser);
  const filter = { _id: ObjectId(id) };
  const options = { upsert: true };
  const updateDoc = {
      $set: {
        status: "admin",
      },
  };
  const result = await usersCollection.updateOne(filter, updateDoc, options)
  console.log('updating', id)
  res.json(result)
})


app.post('/addAdmin/:adminEmail', async(req,res)=>{
  const adminReq=req.params.adminEmail;
  const result=await adminCollection.insertOne(adminReq);
  console.log(result);
  res.json(result);
})



    //DELETE API
    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.json(result);
  })


    //Update API
    app.put('/order/:id', async (req, res) => {
      const id = req.params.id;
      const oldOrder = req.body;
      console.log(oldOrder);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
          $set: {
            status: "Shipped",
          },
      };
      const result = await orderCollection.updateOne(filter, updateDoc, options)
      console.log('updating', id)
      res.json(result)
  })


    app.get('/placeOrder/:id',async(req,res)=>{
        const id=req.params.id;
        console.log(id);
        const query={_id: ObjectId(id)};
        const plan = await planCollection.findOne(query);
        res.send(plan);
    })
    }
    finally {}
  }
  run().catch(console.dir);
  app.get('/',(req,res)=>{
    res.send("Hello world");
    console.log("Hi");
})
app.listen(port ,()=>{
    console.log("Running on port ",port);
})
const express=require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const cors=require('cors');
const ObjectId=require('mongodb').ObjectId;
const app=express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wl8pl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//DB Start
async function run() {
    try {
      await client.connect();
      const database = client.db("traipTravels");
      const planCollection = database.collection("plans");
      const orderCollection = database.collection("orders");
      //GET Plans
      app.get('/plans',async(req,res)=>{
        const cursor=planCollection.find({});
        const plans= await cursor.toArray();
        res.send(plans);
    })
    //GET Order
      app.get('/order',async(req,res)=>{
        const cursor=orderCollection.find({});
        const orders= await cursor.toArray();
        res.send(orders);
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
    //POST API -(Post a new Tour Plan)
    app.post('/plan', async(req,res)=>{
      const plan=req.body;
      console.log("hit the post",req.body);
      const result=await planCollection.insertOne(plan);
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
            status: "Approved",
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
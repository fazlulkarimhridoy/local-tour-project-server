const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ibuouo3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const services = client.db("tourDB").collection("services");
    const bookings = client.db("tourDB").collection("myBookings");

    // all get api

    // get all services
    app.get("/services", async (req, res) => {
      const result = await services.find().toArray();
      res.send(result);
    });

    // get services by current user
    app.get("/service/:email", async (req, res) => {
      const email = req.params.email;
      const query = { ServiceProviderEmail: email };
      const result = await services.find(query).toArray();
      res.send(result);
    });

    // get bookings by current user
    app.get("/myBooking/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await bookings.find(query).toArray();
      res.send(result);
    });

    // get pending works form bookings by current user
    app.get("/myPendingWorks/:email", async (req, res) => {
      const email = req.params.email;
      const query = { providerEmail: email };
      const result = await bookings.find(query).toArray();
      res.send(result);
    });

    // get services by id
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await services.findOne(query);
      res.send(result);
    });


    // all post api

    // post a booking service from service detail page
    app.post("/addBooking", async (req, res) => {
      const booking = req.body;
      const result = await bookings.insertOne(booking);
      res.send(result);
    });

    // post a new service
    app.post("/addService", async (req, res) => {
      const service = req.body;
      const result = await services.insertOne(service);
      res.send(result);
    });


    // all update api

    // update a service
    app.put("/services/:id", async (req, res)=>{
      const id = req.params.id;
      const filter = { _id : new ObjectId(id) };
      const options = {upsert : true};
      const updatedProduct = req.body;
      const doc = {
        $set : {
          ServiceName : updatedProduct.ServiceName,
          ServiceImage : updatedProduct.ServiceImage,
          ServiceProviderName : updatedProduct.ServiceProviderName,
          ServiceProviderImage : updatedProduct.ServiceProviderImage,
          ServiceArea : updatedProduct.ServiceArea,
          ServicePrice : updatedProduct.ServicePrice,
          ServiceProviderEmail : updatedProduct.ServiceProviderEmail,
          ServiceDescription : updatedProduct.ServiceDescription
        }
      }
      const result = await services.updateOne(filter, doc, options);
      res.send(result)
      console.log("id", id);
      console.log("filter", filter);
      console.log("updated product", updatedProduct);
      console.log("updated data", doc);
      console.log("result", result);
    })


    // all delete api

    // delete a booking
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookings.deleteOne(query);
      res.send(result);
    });


    // delete a logged in users service
    app.delete("/service/:id", async (req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await services.deleteOne(query);
      res.send(result);
    })







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// server status
app.get("/", (req, res) => {
  res.send("local tour making server is running");
});
app.listen(port, () => {
  console.log(`local tour server is running at port ${port}`);
});

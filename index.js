const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://local-tour-client.vercel.app"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ibuouo3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const services = client.db("tourDB").collection("services");
    const bookings = client.db("tourDB").collection("myBookings");

    // auth api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      res
        .clearCookie("token", {
          maxAge: 0,
        })
        .send({ success: true });
    });

    // get all services
    app.get("/services", async (req, res) => {
      const result = await services.find().toArray();
      res.send(result);
    });

    // get services by current user
    app.get("/service/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.user.email !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { ServiceProviderEmail: email };
      const result = await services.find(query).toArray();
      res.send(result);
    });

    // api for other services in service details page
    app.get("/otherService/:email", async (req, res) => {
      const email = req.params.email;
      const query = { ServiceProviderEmail: email };
      const result = await services.find(query).toArray();
      res.send(result);
    });

    // get bookings by current user
    app.get("/myBooking/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.user.email !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { userEmail: email };
      const result = await bookings.find(query).toArray();
      res.send(result);
    });

    // get pending works form bookings by current user
    app.get("/myPendingWorks/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.user.email !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
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

    // get a service by  service name;
    app.get("/findService/:name", async (req, res) => {
      const name = req.params.name;
      const query = {
        ServiceName: name,
      };
      const result = await services.find(query).toArray();
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
    app.put("/services/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = req.body;
      const doc = {
        $set: {
          ServiceName: updatedProduct.ServiceName,
          ServiceImage: updatedProduct.ServiceImage,
          ServiceProviderName: updatedProduct.ServiceProviderName,
          ServiceProviderImage: updatedProduct.ServiceProviderImage,
          ServiceArea: updatedProduct.ServiceArea,
          ServicePrice: updatedProduct.ServicePrice,
          ServiceProviderEmail: updatedProduct.ServiceProviderEmail,
          ServiceDescription: updatedProduct.ServiceDescription,
        },
      };
      const result = await services.updateOne(filter, doc, options);
      res.send(result);
    });

    // all delete api

    // delete a booking
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookings.deleteOne(query);
      res.send(result);
    });

    // delete a logged in users service
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await services.deleteOne(query);
      res.send(result);
    });

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

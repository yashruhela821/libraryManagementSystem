const express = require("express");
const connectDB = require("./config/databases");
const { validateSignUpData } = require("./utils/validation");
const User = require("./models/admin");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { userAuth } = require("./middleWares/auth");
const bcrypt = require("bcrypt");
const Book = require('./models/books');
const app = express();

// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//   })
// );
app.use(express.json());
app.use(cookieParser());

// const authRouter = require("./routes/auth");
// const profileRouter = require("./routes/profile");
// const requestRouter = require("./routes/request");
// const userRouter = require("./routes/user");
app.post("/signup", async (req, res) => {
    try {
      // Validation of data
      validateSignUpData(req);
  
      const { firstName, lastName, emailId, password } = req.body;
      //checking email is not presnt already
      const existingUser = await User.findOne({ emailId });

      if (existingUser) {
        return res.status(400).json({ message: "Email already exists." });
      }
  
      // Encrypt the password
      const passwordHash = await bcrypt.hash(password, 10);
      console.log(passwordHash);
  
      //   Creating a new instance of the User model
      const user = new User({
        firstName,
        lastName,
        emailId,
        password: passwordHash,
      });
  
      const savedUser = await user.save();
      const token = await savedUser.getJWT();
  
      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000),
      });
  
      res.json({ message: "User Added successfully!", data: savedUser });
    } catch (err) {
      res.status(400).send("ERROR : " + err.message);
    }
  });

  //login for admin

  app.post("/login", async (req, res) => {
    try {
      const { emailId, password } = req.body;
  
      const user = await User.findOne({ emailId: emailId });
      if (!user) {
        throw new Error("Invalid credentials");
      }
      const isPasswordValid = await user.validatePassword(password);
  
      if (isPasswordValid) {
        const token = await user.getJWT();
  
        res.cookie("token", token, {
          expires: new Date(Date.now() + 8 * 3600000),
        });
        res.json({ message: "Login successful", user });
        res.send(user);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (err) {
      res.status(400).send("ERROR : " + err.message);
    }
  });

  //add book
  app.post("/books/add", userAuth, async (req, res) => {
    try {
      const { title, author, genre } = req.body;
  
      const book = new Book({
        title,
        author,
        genre,
        availabilityStatus: 'available',  
      });
  
      await book.save();
      res.status(201).json({ message: "Book added successfully", book });
    } catch (err) {
      res.status(400).send("Error adding book: " + err.message);
    }
  });

  //search books
  app.get("/books/search", async (req, res) => {
    try {
      const { title, author, genre, availabilityStatus } = req.query;
  
   
      const searchCriteria = {};
      if (title) searchCriteria.title = title;
      if (author) searchCriteria.author = author;
      if (genre) searchCriteria.genre = genre;
      if (availabilityStatus) searchCriteria.availabilityStatus = availabilityStatus;
  

      
      const books = await Book.find(searchCriteria);
  
      if (books.length === 0) {
        return res.status(404).send("No books found matching the criteria");
      }
  
      // Respond with the found books and their details
      res.json(books.map(book => ({
        title: book.title,
        author: book.author,
        genre: book.genre,
        availabilityStatus: book.availabilityStatus,
      })));
    } catch (err) {
      res.status(400).send("Error searching for books: " + err.message);
    }
  });
  
  //update status
  app.patch("/books/updateStatus", userAuth, async (req, res) => {
    try {
      const { title, newAvailabilityStatus } = req.body;
  

      const book = await Book.findOne({ title });
      if (!book) {
        return res.status(404).send("Book not found");
      }
  
      book.availabilityStatus = newAvailabilityStatus;
      await book.save();
  
      res.json({
        message: "Book status updated successfully",
        title: book.title,
        newAvailabilityStatus: book.availabilityStatus,
      });
    } catch (err) {
      res.status(400).send("Error updating book status: " + err.message);
    }
  });

  //dlete
  app.delete("/books/delete", userAuth, async (req, res) => {
    try {
      const { title, availabilityStatus } = req.body;
      const deletedBook = await Book.findOneAndDelete({ title, availabilityStatus });
  
      if (!deletedBook) {
        return res.status(404).send("Book not found ");
      }
  
      res.json({
        message: "Book deleted successfully",
        title: deletedBook.title,
        availabilityStatus: deletedBook.availabilityStatus,
      });
    } catch (err) {
      res.status(400).send("Error deleting book: " + err.message);
    }
  });
  
  
  


// app.use("/", authRouter);
// app.use("/", profileRouter);
// app.use("/", requestRouter);
// app.use("/", userRouter);

connectDB()
  .then(() => {
    console.log("Database connection established...");
    app.listen(777, () => {
      console.log("Server is successfully listening on port 777...");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });

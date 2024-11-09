const mongoose = require("mongoose");
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    genre: {
      type: String,
      required: true,
      trim: true,
    },
    availabilityStatus: {
        type: String,
        enum: ['available', 'borrowed', 'self-owned'],
        default: 'available',
      },
  
  },
  {
    timestamps: true,
  }

);

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
